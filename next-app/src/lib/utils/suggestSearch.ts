interface SearchParamsReader {
  get(name: string): string | null;
}

export function buildSuggestMovieHref(query: string): string {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return '/movies/suggest';

  const params = new URLSearchParams({ query: trimmedQuery });
  return `/movies/suggest?${params.toString()}`;
}

export function parseSuggestMovieQuery(searchParams: SearchParamsReader): string {
  return searchParams.get('query')?.trim() ?? '';
}
