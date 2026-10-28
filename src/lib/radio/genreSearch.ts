export function normalizeGenre(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');
}

export function matchesRadioGenre(genres: string[], search: string): boolean {
  if (!search.trim()) return true;
  const query = normalizeGenre(search);
  return genres.some((genre) => normalizeGenre(genre).includes(query));
}
