export type SurveyBallotOwnerMode = 'identified' | 'guest';

interface SurveyBallotOwnerLabelInput {
  ownerMode: SurveyBallotOwnerMode;
  identifiedDisplayName: string | null;
  guestDisplayName: string | null;
}

export function getSurveyBallotOwnerLabel({
  ownerMode,
  identifiedDisplayName,
  guestDisplayName,
}: SurveyBallotOwnerLabelInput): string {
  if (ownerMode === 'guest') {
    return guestDisplayName?.trim() || 'Anonymous';
  }

  return identifiedDisplayName?.trim() || 'Unknown';
}

export function getSurveyBallotOwnerBadge(
  ownerMode: SurveyBallotOwnerMode
): string | null {
  return ownerMode === 'guest' ? 'Guest' : null;
}
