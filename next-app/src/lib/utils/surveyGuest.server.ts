import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';

export const SURVEY_GUEST_COOKIE_NAME = 'sv_guest_id';

function getSurveyGuestHashSecret(): string {
  const secret =
    process.env.SURVEY_GUEST_HASH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error('Missing SURVEY_GUEST_HASH_SECRET or SUPABASE_SERVICE_ROLE_KEY');
  }

  return secret;
}

export async function getSurveyGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SURVEY_GUEST_COOKIE_NAME)?.value || null;
}

export async function getSurveyGuestSessionIdHash(
  surveyId: string
): Promise<string | null> {
  const guestSessionId = await getSurveyGuestSessionId();
  if (!guestSessionId) {
    return null;
  }

  return createHash('sha256')
    .update(`${getSurveyGuestHashSecret()}:${surveyId}:${guestSessionId}`)
    .digest('hex');
}
