export const SURVEY_SELECTION_SIZES = [1, 3, 5] as const;
export const SURVEY_OPTION_TITLE_MAX_LENGTH = 100;
export const SURVEY_OPTION_DESCRIPTION_MAX_LENGTH = 500;
export const SURVEY_OPTION_IMAGE_MAX_BYTES = 2_000_000;
export const SURVEY_OPTION_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const SURVEY_GUEST_NAME_MAX_LENGTH = 80;

export type SurveySelectionSize = (typeof SURVEY_SELECTION_SIZES)[number];

export function validateSurveySelectionSize(value: unknown): SurveySelectionSize | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return SURVEY_SELECTION_SIZES.includes(parsed as SurveySelectionSize)
    ? (parsed as SurveySelectionSize)
    : null;
}

export function canDisableResponderOptions(adminOptionCount: number): boolean {
  return adminOptionCount >= 2;
}

export function isSurveyClosed(
  survey: { state: 'draft' | 'live' | 'frozen'; closesAt: string | null },
  now: Date = new Date()
): boolean {
  if (survey.state === 'frozen') return true;
  if (survey.state !== 'live' || !survey.closesAt) return false;
  return now.getTime() >= new Date(survey.closesAt).getTime();
}

export function normalizeSurveyLink(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getSurveyGuestNameValidationError(value: string | null | undefined): string | null {
  const name = value?.trim() ?? '';
  if (!name) return 'Your name is required';
  if (name.length > SURVEY_GUEST_NAME_MAX_LENGTH) {
    return `Your name must be ${SURVEY_GUEST_NAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

interface SurveyOptionImageLike {
  size: number;
  type: string;
}

export function getSurveyOptionValidationError(data: {
  title: string;
  description?: string | null;
  link?: string | null;
  image?: SurveyOptionImageLike | null;
}): string | null {
  const title = data.title.trim();
  if (!title) return 'Option title is required';
  if (title.length > SURVEY_OPTION_TITLE_MAX_LENGTH) {
    return `Option title must be ${SURVEY_OPTION_TITLE_MAX_LENGTH} characters or fewer`;
  }
  if ((data.description?.trim().length ?? 0) > SURVEY_OPTION_DESCRIPTION_MAX_LENGTH) {
    return `Option description must be ${SURVEY_OPTION_DESCRIPTION_MAX_LENGTH} characters or fewer`;
  }
  if (data.link?.trim() && !normalizeSurveyLink(data.link)) {
    return 'Option link must be a valid HTTP or HTTPS URL';
  }
  if (data.image && data.image.size > 0) {
    if (!SURVEY_OPTION_IMAGE_TYPES.includes(data.image.type as (typeof SURVEY_OPTION_IMAGE_TYPES)[number])) {
      return 'Option image must be a PNG, JPEG, or WebP file';
    }
    if (data.image.size > SURVEY_OPTION_IMAGE_MAX_BYTES) {
      return 'Option image must be 2 MB or smaller';
    }
  }
  return null;
}
