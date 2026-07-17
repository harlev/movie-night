import type { Profile } from '@/lib/types';

interface SurveyAccessInput {
  membersOnly: boolean;
  isAnonymous: boolean;
  userId: string | null;
  userRole: Profile['role'] | null;
  voterId: string | null;
  guestName: string | null;
}

export type SurveyBallotOwner = {
  authenticatedUserId: string | null;
  ownerMode: 'user' | 'guest' | 'anonymous';
  voterId: string | null;
  guestDisplayName: string | null;
};

export function resolveSurveyBallotOwner(input: SurveyAccessInput): SurveyBallotOwner | { error: string } {
  if (input.membersOnly && (!input.userId || !input.userRole)) {
    return { error: 'This survey is limited to members' };
  }
  if (input.userRole === 'viewer') return { error: 'Viewers cannot submit ballots' };
  if (!input.voterId && (input.isAnonymous || !input.userId)) {
    return { error: 'Missing voter identity. Please enable cookies.' };
  }

  if (input.isAnonymous) {
    return {
      authenticatedUserId: input.userId,
      ownerMode: 'anonymous',
      voterId: input.voterId,
      guestDisplayName: null,
    };
  }

  if (input.userId) {
    return {
      authenticatedUserId: input.userId,
      ownerMode: 'user',
      voterId: null,
      guestDisplayName: null,
    };
  }

  const guestDisplayName = input.guestName?.trim();
  if (!guestDisplayName) return { error: 'Your name is required' };
  return {
    authenticatedUserId: null,
    ownerMode: 'guest',
    voterId: input.voterId,
    guestDisplayName,
  };
}

export function resolveSurveyOptionCreator(input: {
  isAnonymous: boolean;
  userId: string | null;
  voterId: string | null;
}): { addedBy: string | null; voterId: string | null } | { error: string } {
  if (!input.isAnonymous && input.userId) return { addedBy: input.userId, voterId: null };
  if (!input.voterId) return { error: 'Missing voter identity. Please enable cookies.' };
  return { addedBy: null, voterId: input.voterId };
}
