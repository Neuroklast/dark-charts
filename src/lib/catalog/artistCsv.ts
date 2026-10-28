export interface ArtistIntakeRow {
  name: string;
  spotifyId: string | null;
  genres: string[];
  country: string | null;
}

export interface ArtistCsvPreview {
  artists: ArtistIntakeRow[];
  duplicateCount: number;
  errors: string[];
}

export const MAX_ARTIST_CSV_BYTES = 1024 * 1024;
export const MAX_ARTIST_CSV_ROWS = 1500;

function csvCells(source: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || !cell.trim()) {
        quoted = !quoted;
      } else {
        throw new Error('Ungültige CSV-Anführungszeichen.');
      }
    } else if (char === delimiter && !quoted) {
      record.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      record.push(cell.trim());
      if (record.some(Boolean)) records.push(record);
      record = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error('Die CSV enthält ein nicht geschlossenes Anführungszeichen.');
  record.push(cell.trim());
  if (record.some(Boolean)) records.push(record);
  return records;
}

function delimiterOf(csv: string): string {
  const firstLine = csv.split(/\r?\n/, 1)[0] ?? '';
  const count = (delimiter: string) => {
    let quoted = false;
    let total = 0;
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') {
        if (quoted && firstLine[i + 1] === '"') i++;
        else quoted = !quoted;
      } else if (firstLine[i] === delimiter && !quoted) total++;
    }
    return total;
  };
  return count(';') > count(',') ? ';' : ',';
}

function headerKey(value: string): string {
  return value.toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function spotifyIdOf(value: string): string | null {
  if (!value) return null;
  const match = value.match(/(?:open\.spotify\.com\/artist\/|spotify:artist:)([A-Za-z0-9]{22})/i);
  const id = match?.[1] ?? value;
  if (!/^[A-Za-z0-9]{22}$/.test(id)) {
    throw new Error('Spotify-ID muss 22 Zeichen lang sein oder als Artist-Link vorliegen.');
  }
  return id;
}

export function parseArtistCsv(source: string): ArtistCsvPreview {
  if (new TextEncoder().encode(source).byteLength > MAX_ARTIST_CSV_BYTES) {
    throw new Error('Die CSV darf maximal 1 MB groß sein.');
  }
  const records = csvCells(source.replace(/^\uFEFF/, ''), delimiterOf(source));
  if (records.length < 2) throw new Error('Die CSV muss eine Kopfzeile und mindestens einen Artist enthalten.');
  if (records.length - 1 > MAX_ARTIST_CSV_ROWS) {
    throw new Error('Pro Datei sind maximal 1500 Artists erlaubt.');
  }

  const headers = records[0].map(headerKey);
  const indexOf = (...names: string[]) => headers.findIndex(h => names.includes(h));
  const nameIndex = indexOf('name', 'artist', 'artistname', 'band', 'bandname');
  const spotifyIndex = indexOf('spotifyid', 'spotifyartistid', 'spotify', 'spotifyurl', 'spotifylink');
  const genreIndex = indexOf('genre', 'genres', 'subgenres', 'subgenre', 'maingenre', 'musikrichtung');
  const countryIndex = indexOf('country', 'land');
  if (nameIndex < 0) throw new Error('Spalte Name oder Artist fehlt in der CSV.');

  const artists: ArtistIntakeRow[] = [];
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();
  let duplicateCount = 0;

  for (let i = 1; i < records.length; i++) {
    const cells = records[i];
    const name = (cells[nameIndex] ?? '').trim();
    if (!name || name.length > 160) {
      errors.push('Zeile ' + (i + 1) + ': Artist-Name fehlt oder ist zu lang.');
      continue;
    }
    let spotifyId: string | null;
    try {
      spotifyId = spotifyIndex >= 0 ? spotifyIdOf((cells[spotifyIndex] ?? '').trim()) : null;
    } catch (error) {
      errors.push('Zeile ' + (i + 1) + ': ' + (error instanceof Error ? error.message : 'Ungültige Spotify-ID'));
      continue;
    }
    const country = countryIndex >= 0 ? (cells[countryIndex] ?? '').trim() : '';
    const genres = genreIndex >= 0
      ? (cells[genreIndex] ?? '').split(/[|;,]/).map(g => g.trim()).filter(Boolean)
      : [];
    if (country.length > 120 || genres.length > 15 || genres.some(g => g.length > 70)) {
      errors.push('Zeile ' + (i + 1) + ': Land oder Genre ist zu lang.');
      continue;
    }
    const normalized = name.toLocaleLowerCase('de');
    if (seenNames.has(normalized) || (spotifyId !== null && seenIds.has(spotifyId))) {
      duplicateCount++;
      continue;
    }
    seenNames.add(normalized);
    if (spotifyId !== null) seenIds.add(spotifyId);
    artists.push({ name, spotifyId, genres, country: country || null });
  }
  return { artists, duplicateCount, errors };
}
