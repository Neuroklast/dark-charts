'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface AdminBulkToolbarProps {
  visibleIds: string[];
  selectedIds: string[];
  total: number;
  allMatching: boolean;
  busy?: boolean;
  onSelect: (ids: string[]) => void;
  onAllMatchingChange: (enabled: boolean) => void;
  onApprove: () => void;
  onHide: () => void;
}

export function AdminBulkToolbar({
  visibleIds, selectedIds, total, allMatching, busy, onSelect, onAllMatchingChange, onApprove, onHide,
}: AdminBulkToolbarProps) {
  const selected = new Set(selectedIds);
  const allPage = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
  const somePage = visibleIds.some(id => selected.has(id));
  const count = allMatching ? total : selected.size;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      <label className="flex items-center gap-2">
        <Checkbox aria-label="Alle Einträge auf dieser Seite auswählen" disabled={busy}
          checked={allPage ? true : somePage ? 'indeterminate' : false}
          onCheckedChange={value => {
            onAllMatchingChange(false);
            onSelect(value === true ? Array.from(new Set([...selectedIds, ...visibleIds])) : selectedIds.filter(id => !visibleIds.includes(id)));
          }} />
        Diese Seite
      </label>
      <Button type="button" variant="link" size="sm" disabled={busy || total === 0}
        onClick={() => { onAllMatchingChange(!allMatching); if (!allMatching) onSelect([]); }}>
        {allMatching ? 'Gesamtauswahl aufheben' : `Alle ${total.toLocaleString('de-DE')} Treffer auswählen`}
      </Button>
      <span className="text-muted-foreground" aria-live="polite">{count.toLocaleString('de-DE')} ausgewählt</span>
      <div className="flex-1" />
      <Button type="button" size="sm" disabled={busy || count === 0} onClick={onApprove}>Freigeben</Button>
      <Button type="button" size="sm" variant="outline" disabled={busy || count === 0} onClick={onHide}>Verbergen</Button>
      <Button type="button" size="sm" variant="ghost" disabled={busy || count === 0}
        onClick={() => { onAllMatchingChange(false); onSelect([]); }}>Auswahl löschen</Button>
    </div>
  );
}
