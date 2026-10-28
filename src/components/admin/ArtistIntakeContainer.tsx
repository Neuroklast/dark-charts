'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth/client-fetch';
import { parseArtistCsv, MAX_ARTIST_CSV_BYTES, type ArtistCsvPreview, type ArtistIntakeRow } from '@/lib/catalog/artistCsv';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminPagination } from './shared/AdminPagination';
import { AdminBulkToolbar } from './shared/AdminBulkToolbar';
import { useAdminList, useDebouncedValue } from './shared/useAdminList';

type ArtistListRow = ArtistIntakeRow & {
  id: string;
  isVisible: boolean;
  status: string;
  source: string | null;
};

type ArtistFormValues = {
  name: string;
  spotify: string;
  genres: string;
  country: string;
};

const emptyForm: ArtistFormValues = { name: '', spotify: '', genres: '', country: '' };

function inputArtist(form: ArtistFormValues): ArtistIntakeRow {
  const spotify = form.spotify.trim();
  const match = spotify.match(/(?:open\.spotify\.com\/artist\/|spotify:artist:)([A-Za-z0-9]{22})/i);
  const spotifyId = match?.[1] ?? spotify;
  if (spotifyId && !/^[A-Za-z0-9]{22}$/.test(spotifyId)) {
    throw new Error('Bitte eine gültige Spotify-Artist-ID oder einen Spotify-Artist-Link eingeben.');
  }
  if (!form.name.trim()) throw new Error('Artist-Name ist erforderlich.');
  return {
    name: form.name.trim(),
    spotifyId: spotifyId || null,
    genres: form.genres.split(/[,;|]/).map(g => g.trim()).filter(Boolean),
    country: form.country.trim() || null,
  };
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as {
    error?: string;
    created?: number;
    skipped?: number;
    errors?: string[];
    affected?: number;
    jobsQueued?: number;
  };
  if (!response.ok) throw new Error(payload.error || 'Die Anfrage ist fehlgeschlagen.');
  return payload;
}

export function ArtistIntakeContainer() {
  const [form, setForm] = useState<ArtistFormValues>(emptyForm);
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [csvName, setCsvName] = useState('');
  const [preview, setPreview] = useState<ArtistCsvPreview | null>(null);
  const [fileError, setFileError] = useState('');
  const [imported, setImported] = useState(0);
  const [importResult, setImportResult] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [visibility, setVisibility] = useState<'all' | 'pending' | 'visible' | 'hidden'>('all');
  const [showIntake, setShowIntake] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allMatching, setAllMatching] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const params = useMemo(() => new URLSearchParams({
    view: 'list', page: String(page), size: String(pageSize), search: debouncedSearch, visibility,
  }).toString(), [page, pageSize, debouncedSearch, visibility]);
  const { rows, total, loading, refreshing, refresh, setRows, setTotal } = useAdminList<ArtistListRow>(
    '/api/admin/artists?' + params,
    data => ({ rows: data.artists ?? [], total: data.total ?? 0 }),
    message => toast.error(message)
  );
  const loadArtists = useCallback(() => refresh(true), [refresh]);

  function resetSelection() {
    setSelectedIds([]);
    setAllMatching(false);
  }
  function updateListFilters(next: { search?: string; visibility?: typeof visibility; size?: number }) {
    if (next.search !== undefined) setSearch(next.search);
    if (next.visibility !== undefined) setVisibility(next.visibility);
    if (next.size !== undefined) setPageSize(next.size);
    setPage(0);
    resetSelection();
  }

  useEffect(() => {
    if (editingId && mode === 'manual') document.getElementById('artist-manual-form')?.scrollIntoView({ block: 'center' });
  }, [editingId, mode]);

  async function saveArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const artist = inputArtist(form);
      await postJson('/api/admin/artists', editingId
        ? { action: 'update', artistId: editingId, artist }
        : { action: 'create', artist });
      toast.success(editingId ? 'Artist aktualisiert.' : 'Artist angelegt. Freigabe steht aus.');
      setForm(emptyForm);
      setEditingId(null);
      await loadArtists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Artist konnte nicht gespeichert werden.');
    } finally {
      setBusy(false);
    }
  }

  async function selectFile(file: File | undefined) {
    setPreview(null);
    setFileError('');
    setCsvName(file?.name ?? '');
    setImported(0);
    setImportResult('');
    if (!file) return;
    if (!file.name.toLocaleLowerCase('de').endsWith('.csv')) {
      setFileError('Bitte eine CSV-Datei auswählen.');
      return;
    }
    if (file.size > MAX_ARTIST_CSV_BYTES) {
      setFileError('Die CSV darf maximal 1 MB groß sein.');
      return;
    }
    try {
      const result = parseArtistCsv(await file.text());
      setPreview(result);
      if (result.artists.length === 0) setFileError('Keine gültigen Artists gefunden.');
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Datei konnte nicht gelesen werden.');
    }
  }

  async function importCsv() {
    if (!preview || preview.artists.length === 0 || preview.errors.length || busy) return;
    setBusy(true);
    let created = 0;
    let skipped = preview.duplicateCount;
    const errors: string[] = [];
    try {
      for (let offset = 0; offset < preview.artists.length; offset += 25) {
        const artists = preview.artists.slice(offset, offset + 25);
        const response = await postJson('/api/admin/artists', { action: 'import', artists });
        created += response.created ?? 0;
        skipped += response.skipped ?? 0;
        errors.push(...(response.errors ?? []));
        setImported(Math.min(offset + artists.length, preview.artists.length));
      }
      setImportResult(created + ' neu angelegt, ' + skipped + ' übersprungen, ' + errors.length + ' Fehler.');
      if (errors.length) {
        setFileError(errors.slice(0, 5).join(' | '));
        toast.warning('Import mit Fehlern abgeschlossen.');
      } else {
        toast.success('CSV-Import abgeschlossen. Neue Artists warten auf Freigabe.');
        setPreview(null);
        setCsvName('');
      }
      setPage(0);
      await loadArtists();
    } catch (error) {
      setImportResult(created + ' angelegt, ' + skipped + ' übersprungen. Import unterbrochen.');
      toast.error(error instanceof Error ? error.message : 'Import unterbrochen');
      await loadArtists();
    } finally {
      setBusy(false);
    }
  }

  function editArtist(artist: ArtistListRow) {
    setEditingId(artist.id);
    setForm({
      name: artist.name,
      spotify: artist.spotifyId ?? '',
      genres: (artist.genres ?? []).join(', '),
      country: artist.country ?? '',
    });
    setMode('manual');
    setShowIntake(true);
  }

  async function moderate(artist: ArtistListRow) {
    if (rowBusy || bulkBusy) return;
    const nextVisible = !artist.isVisible;
    setRowBusy(artist.id);
    setRows(list => list.map(row => row.id === artist.id
      ? { ...row, isVisible: nextVisible, status: nextVisible ? 'active' : 'inactive' } : row));
    try {
      await postJson('/api/admin/catalog', {
        entity: 'artists', id: artist.id, action: nextVisible ? 'approve' : 'hide',
      });
      if (visibility === 'pending' || (visibility === 'visible' && !nextVisible) ||
          (visibility === 'hidden' && nextVisible)) {
        setRows(list => list.filter(row => row.id !== artist.id));
        setTotal(value => Math.max(0, value - 1));
      }
      setSelectedIds(ids => ids.filter(id => id !== artist.id));
      toast.success(nextVisible ? 'Artist freigegeben.' : 'Artist verborgen.');
    } catch (error) {
      setRows(list => list.map(row => row.id === artist.id ? artist : row));
      toast.error(error instanceof Error ? error.message : 'Änderung fehlgeschlagen');
    } finally { setRowBusy(null); }
  }

  async function bulkModerate(operation: 'approve' | 'hide') {
    if (bulkBusy || (!allMatching && selectedIds.length === 0)) return;
    const count = allMatching ? total : selectedIds.length;
    if (!window.confirm(`${count} Artists ${operation === 'approve' ? 'freigeben' : 'verbergen'}? ${allMatching ? 'Alle Treffer des aktuellen Filters sind betroffen, auch auf anderen Seiten.' : ''}`)) return;
    setBulkBusy(true);
    try {
      const payload = await postJson('/api/admin/catalog', {
        action: 'bulk', entity: 'artists', operation,
        ...(allMatching ? { allMatching: true, search: debouncedSearch, visibility } : { ids: selectedIds }),
      });
      toast.success(`${payload.affected ?? 0} Artists aktualisiert, ${payload.skipped ?? 0} übersprungen.`);
      resetSelection();
      if (page !== 0) setPage(0);
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sammelaktion fehlgeschlagen');
    } finally { setBulkBusy(false); }
  }

  async function deleteArtist(artist: ArtistListRow) {
    if (!window.confirm('Artist "' + artist.name + '" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.')) return;
    setRowBusy(artist.id);
    try {
      await postJson('/api/admin/artists', { action: 'delete', artistId: artist.id });
      toast.success('Artist gelöscht.');
      if (editingId === artist.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setRows(list => list.filter(row => row.id !== artist.id));
      setTotal(value => Math.max(0, value - 1));
      setSelectedIds(ids => ids.filter(id => id !== artist.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Artist konnte nicht gelöscht werden.');
    } finally { setRowBusy(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Artists anlegen, importieren und gesammelt verwalten.</p>
        <Button type="button" variant="outline" onClick={() => setShowIntake(value => !value)}>{showIntake ? 'Eingabe schließen' : '+ Artists hinzufügen / CSV importieren'}</Button>
      </div>
      {showIntake && <Card className="p-5 md:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg uppercase tracking-wide">Artists hinzufügen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Von Hand eintragen oder eine eigene CSV-Datei hochladen. Neue Artists sind bis zur Freigabe nicht öffentlich.
          </p>
        </div>
        <Tabs value={mode} onValueChange={value => setMode(value === 'csv' ? 'csv' : 'manual')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manual">Manuell eintragen</TabsTrigger>
            <TabsTrigger value="csv">CSV hochladen</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-4">
            <form id="artist-manual-form" className="grid gap-4 md:grid-cols-2" onSubmit={event => void saveArtist(event)}>
              <div className="space-y-2">
                <Label htmlFor="artist-name">Artist-Name *</Label>
                <Input id="artist-name" value={form.name} maxLength={160} required
                  onChange={event => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist-spotify">Spotify-ID oder Artist-Link (optional)</Label>
                <Input id="artist-spotify" value={form.spotify} placeholder="open.spotify.com/artist/..."
                  onChange={event => setForm({ ...form, spotify: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist-genres">Genres (durch Komma getrennt)</Label>
                <Input id="artist-genres" value={form.genres}
                  onChange={event => setForm({ ...form, genres: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist-country">Land</Label>
                <Input id="artist-country" value={form.country} maxLength={120}
                  onChange={event => setForm({ ...form, country: event.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={busy}>{editingId ? 'Änderungen speichern' : 'Artist anlegen'}</Button>
                {editingId && <Button type="button" variant="outline"
                  onClick={() => { setEditingId(null); setForm(emptyForm); }}>Abbrechen</Button>}
              </div>
            </form>
          </TabsContent>
          <TabsContent value="csv" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="artist-csv">Eigene CSV-Datei auswählen (maximal 1 MB und 1500 Zeilen)</Label>
              <Input id="artist-csv" type="file" accept=".csv,text/csv" disabled={busy}
                onChange={event => { void selectFile(event.target.files?.[0]); }} />
              <p className="text-xs text-muted-foreground">
                Benötigt: Name oder Artist. Optional: Spotify_ID, Genres, Country. Komma oder Semikolon als Trennzeichen.
              </p>
            </div>
            {csvName && <p className="text-sm text-muted-foreground">Datei: {csvName}</p>}
            {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
            {preview && (
              <div className="space-y-3">
                <p className="text-sm">{preview.artists.length} gültige Artists, {preview.duplicateCount} Dubletten in der Datei, {preview.errors.length} ungültige Zeilen.</p>
                {preview.errors.length > 0 &&
                  <ul className="list-disc pl-6 text-sm text-destructive">
                    {preview.errors.slice(0, 8).map((error, index) => <li key={index}>{error}</li>)}
                  </ul>}
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="mb-2 font-medium">Vorschau</p>
                  {preview.artists.slice(0, 5).map((artist, index) =>
                    <p key={index} className="truncate text-muted-foreground">{artist.name} {artist.spotifyId ? '· Spotify verknüpft' : ''}</p>)}
                </div>
                <Button disabled={busy || preview.artists.length === 0 || preview.errors.length > 0}
                  onClick={() => void importCsv()}>
                  {busy ? 'Importiere ' + imported + ' / ' + preview.artists.length : 'CSV-Import starten'}
                </Button>
              </div>
            )}
            {importResult && <p role="status" className="text-sm">{importResult}</p>}
          </TabsContent>
        </Tabs>
      </Card>}

      <Card className="p-4 md:p-5 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-lg uppercase tracking-wide">Artist-Datenbank</h2>
            <p className="text-sm text-muted-foreground">{total.toLocaleString('de-DE')} Treffer · {refreshing ? 'Aktualisiere…' : 'Bereit'}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1 space-y-1">
              <Label htmlFor="artist-search">Artist suchen</Label>
              <Input id="artist-search" value={search} placeholder="Nach Namen suchen"
                onChange={event => updateListFilters({ search: event.target.value })} />
            </div>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="block">Status</span>
              <select aria-label="Artists nach Status filtern" value={visibility}
                onChange={event => updateListFilters({ visibility: event.target.value as typeof visibility })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                <option value="all">Alle Artists</option>
                <option value="pending">Freigabe ausstehend</option>
                <option value="visible">Öffentlich</option>
                <option value="hidden">Nicht öffentlich</option>
              </select>
            </label>
            <Button type="button" variant="outline" size="sm" disabled={refreshing}
              onClick={() => void refresh(true)}>Aktualisieren</Button>
          </div>
        </div>
        <AdminBulkToolbar
          visibleIds={rows.filter(row => !['BANNED', 'RESTRICTED'].includes(row.status)).map(row => row.id)}
          selectedIds={selectedIds} allMatching={allMatching} total={total}
          busy={bulkBusy || rowBusy !== null}
          onSelect={setSelectedIds} onAllMatchingChange={setAllMatching}
          onApprove={() => void bulkModerate('approve')} onHide={() => void bulkModerate('hide')}
        />
        <AdminPagination page={page} pageSize={pageSize} total={total}
          onPageChange={value => { setPage(value); resetSelection(); }}
          onPageSizeChange={size => updateListFilters({ size })}
          disabled={bulkBusy} />
        <div className="max-h-[62vh] min-h-[10rem] overflow-auto rounded-lg border border-border" aria-busy={loading}>
          {loading && rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Lade Artists…</p> :
            rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Keine passenden Artists.</p> :
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="w-12 px-3 py-2">Auswahl</th>
                  <th scope="col" className="px-3 py-2">Artist</th>
                  <th scope="col" className="px-3 py-2">Genres / Land</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(artist => (
                  <tr key={artist.id} className={rowBusy === artist.id ? 'opacity-60' : 'hover:bg-muted/30'}>
                    <td className="px-3 py-2">
                      <Checkbox aria-label={`${artist.name} auswählen`}
                        disabled={bulkBusy || ['BANNED', 'RESTRICTED'].includes(artist.status)}
                        checked={allMatching || selectedIds.includes(artist.id)}
                        onCheckedChange={checked => {
                          setAllMatching(false);
                          setSelectedIds(ids => checked ? [...new Set([...ids, artist.id])] : ids.filter(id => id !== artist.id));
                        }} />
                    </td>
                    <td className="px-3 py-2 font-medium">{artist.name}
                      <div className="text-[11px] font-normal text-muted-foreground">{artist.spotifyId ? 'Spotify verknüpft' : 'Ohne Spotify-ID'}</div>
                    </td>
                    <td className="max-w-72 truncate px-3 py-2 text-muted-foreground" title={(artist.genres ?? []).join(', ')}>
                      {(artist.genres ?? []).join(', ') || 'Kein Genre'} · {artist.country || '—'}
                    </td>
                    <td className="px-3 py-2">{artist.isVisible ? 'Öffentlich' : artist.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={rowBusy !== null || bulkBusy} onClick={() => editArtist(artist)}>Bearbeiten</Button>
                        {!['BANNED', 'RESTRICTED'].includes(artist.status) &&
                          <Button size="sm" variant="outline" disabled={rowBusy !== null || bulkBusy}
                            onClick={() => void moderate(artist)}>{artist.isVisible ? 'Verbergen' : 'Freigeben'}</Button>}
                        <Button size="sm" variant="destructive" disabled={rowBusy !== null || bulkBusy}
                          onClick={() => void deleteArtist(artist)}>Löschen</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
        <AdminPagination page={page} pageSize={pageSize} total={total}
          onPageChange={value => { setPage(value); resetSelection(); }}
          onPageSizeChange={size => updateListFilters({ size })}
          disabled={bulkBusy} />
      </Card>
    </div>
  );
}
