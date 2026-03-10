export type PrimaryStatusSlot = 'movie' | 'survey' | 'none';

export function getPrimaryStatusSlot({
  hasActiveMovie,
  hasActiveSurvey,
}: {
  hasActiveMovie: boolean;
  hasActiveSurvey: boolean;
}): PrimaryStatusSlot {
  if (hasActiveMovie) {
    return 'movie';
  }

  if (hasActiveSurvey) {
    return 'survey';
  }

  return 'none';
}
