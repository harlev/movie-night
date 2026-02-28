export function buildSuggestedMovieHref(movieId: string): string {
  return `/movies/${movieId}?suggested=1`;
}

export function getSuggestionAcceptedToast(): string {
  return 'Your suggestion has been accepted. You can nominate it now.';
}
