'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { removeBallotMovie, removeBallotOption } from '@/lib/queries/ballots';
import { getMovieById } from '@/lib/queries/movies';
import { getUserById } from '@/lib/queries/profiles';
import {
  addOpenSurveyOption,
  addSurveyEntry,
  cleanupSurveyOptionImages,
  createSurvey,
  deleteSurvey,
  finalizeExpiredSurveys,
  getAdminSurveyOptionCount,
  getSurveyById,
  getSurveyChoices,
  getSurveyEntries,
  queueSurveyOptionImageCleanup,
  updateSurvey,
  updateSurveyArchived,
  updateSurveyClosingTime,
  updateSurveyState,
} from '@/lib/queries/surveys';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { pacificToUTC } from '@/lib/utils/closesAt';
import { generateId } from '@/lib/utils/id';
import { resolveSurveyOptionCreator } from '@/lib/utils/surveyAccess';
import {
  canDisableResponderOptions,
  getSurveyOptionValidationError,
  isSurveyClosed,
  normalizeSurveyLink,
  validateSurveySelectionSize,
} from '@/lib/utils/surveyConfig';
import { getWatchedNomineeWarningToast } from '@/lib/utils/watchedMovies';

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  warning?: string | null;
  title?: string;
  description?: string;
  surveyType?: string;
  maxRankN?: number;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserById(user.id) : null;
  return { user, profile };
}

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) return { error: 'Not authenticated' };
  if (profile.status !== 'active') return { error: 'Account is disabled' };
  if (profile.role !== 'admin') return { error: 'Admin access required' };
  return { userId: user.id };
}

function readCheckbox(formData: FormData, name: string, defaultValue: boolean): boolean {
  const values = formData.getAll(name).map(String);
  if (values.length === 0) return defaultValue;
  return values.some((value) => value === 'true' || value === 'on' || value === '1');
}

function revalidateSurvey(surveyId: string) {
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath(`/survey/${surveyId}`);
  revalidatePath(`/survey/${surveyId}/simple`);
  revalidatePath('/admin/surveys');
  revalidatePath('/dashboard');
}

async function reconcileExpiredSurvey(survey: Awaited<ReturnType<typeof getSurveyById>>): Promise<boolean> {
  if (!survey || !isSurveyClosed({ state: survey.state, closesAt: survey.closes_at })) return false;
  if (survey.state === 'live') await finalizeExpiredSurveys();
  revalidateSurvey(survey.id);
  return true;
}

function imageExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function uploadOptionImage(surveyId: string, image: File | null): Promise<string | null> {
  if (!image || image.size === 0) return null;
  const objectPath = `${surveyId}/${generateId()}.${imageExtension(image.type)}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from('survey-option-images').upload(
    objectPath,
    await image.arrayBuffer(),
    { contentType: image.type, upsert: false }
  );
  if (error) throw error;
  return objectPath;
}

export async function createSurveyAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const surveyType = formData.get('surveyType') === 'open' ? 'open' : 'movie';
  const maxRankN = validateSurveySelectionSize(formData.get('maxRankN') ?? '3');
  const isAnonymous = readCheckbox(formData, 'isAnonymous', false);
  const membersOnly = readCheckbox(formData, 'membersOnly', true);

  if (!title) return { error: 'Title is required', title: '', description, surveyType };
  if (title.length > 100) return { error: 'Title must be 100 characters or fewer', title, description, surveyType };
  if (!maxRankN) return { error: 'Selection method must be 1, 3, or 5', title, description, surveyType };

  const closesAtLocal = String(formData.get('closesAt') ?? '').trim();
  const closesAt = closesAtLocal ? pacificToUTC(closesAtLocal) : undefined;
  const survey = await createSurvey({
    title,
    description: description || undefined,
    maxRankN,
    closesAt,
    surveyType,
    allowResponderOptions: surveyType === 'open',
    isAnonymous,
    membersOnly,
  });
  redirect(`/admin/surveys/${survey.id}`);
}

export async function updateSurveySettingsAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;

  const surveyId = String(formData.get('surveyId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'draft') return { error: 'Survey settings can only be changed while it is a draft' };

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const maxRankN = validateSurveySelectionSize(formData.get('maxRankN') ?? survey.max_rank_n);
  if (!title) return { error: 'Title is required' };
  if (title.length > 100) return { error: 'Title must be 100 characters or fewer' };
  if (!maxRankN) return { error: 'Selection method must be 1, 3, or 5' };

  let allowResponderOptions = survey.survey_type === 'open'
    ? readCheckbox(formData, 'allowResponderOptions', survey.allow_responder_options)
    : false;
  if (survey.survey_type === 'open' && !allowResponderOptions) {
    const adminOptionCount = await getAdminSurveyOptionCount(surveyId);
    if (!canDisableResponderOptions(adminOptionCount)) {
      allowResponderOptions = true;
      return { error: 'Add at least two admin options before disabling responder-added options' };
    }
  }

  await updateSurvey(surveyId, {
    title,
    description: description || null,
    max_rank_n: maxRankN,
    allow_responder_options: allowResponderOptions,
    is_anonymous: readCheckbox(formData, 'isAnonymous', survey.is_anonymous),
    members_only: readCheckbox(formData, 'membersOnly', survey.members_only),
  });
  revalidateSurvey(surveyId);
  return { success: true, message: 'Survey updated' };
}

export async function updateSurveyAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  return updateSurveySettingsAction(prevState, formData);
}

export async function updateSurveyClosesAtAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (await reconcileExpiredSurvey(survey)) return { error: 'Cannot update the closing time of a closed survey' };
  const closesAtLocal = String(formData.get('closesAt') ?? '').trim();
  const closesAt = closesAtLocal ? pacificToUTC(closesAtLocal) : null;
  try {
    await updateSurveyClosingTime(surveyId, closesAt, adminAccess.userId);
  } catch (error) {
    const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : null;
    return { error: message || 'Could not update the closing time' };
  }
  revalidateSurvey(surveyId);
  return { success: true, message: closesAt ? 'Closing time updated' : 'Closing time cleared' };
}

export async function changeSurveyStateAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const newState = formData.get('state') as 'draft' | 'live' | 'frozen';
  if (!['draft', 'live', 'frozen'].includes(newState)) return { error: 'Invalid state' };
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (await reconcileExpiredSurvey(survey)) return { error: 'Cannot change the state of a closed survey' };
  if (survey.state === 'draft' && newState === 'frozen') return { error: 'Cannot freeze a draft survey directly' };

  if (newState === 'live') {
    if (survey.closes_at && new Date(survey.closes_at).getTime() <= Date.now()) {
      return { error: 'Set a future closing time before making the survey live' };
    }
    if (survey.survey_type === 'movie') {
      const entries = await getSurveyEntries(surveyId);
      if (entries.length === 0) return { error: 'Cannot go live without any movies' };
    } else {
      const adminOptionCount = await getAdminSurveyOptionCount(surveyId);
      if (!survey.allow_responder_options && !canDisableResponderOptions(adminOptionCount)) {
        return { error: 'Add at least two admin options or allow responders to add options' };
      }
    }
  }

  const result = await updateSurveyState(surveyId, newState, adminAccess.userId);
  if (!result.success) return { error: result.error };
  revalidateSurvey(surveyId);
  return { success: true, message: `Survey is now ${newState}` };
}

async function addOptionFromForm(
  formData: FormData,
  creator: {
    mode: 'admin' | 'responder';
    authenticatedUserId: string | null;
    addedBy: string | null;
    voterId: string | null;
  }
): Promise<ActionState> {
  const surveyId = String(formData.get('surveyId') ?? '');
  const title = String(formData.get('optionTitle') ?? '').trim();
  const description = String(formData.get('optionDescription') ?? '').trim();
  const link = String(formData.get('optionLink') ?? '').trim();
  const imageValue = formData.get('optionImage');
  const image = imageValue instanceof File ? imageValue : null;
  const validationError = getSurveyOptionValidationError({ title, description, link, image });
  if (validationError) return { error: validationError };

  let imagePath: string | null = null;
  try {
    imagePath = await uploadOptionImage(surveyId, image);
    await addOpenSurveyOption({
      surveyId,
      title,
      description: description || null,
      imagePath,
      linkUrl: normalizeSurveyLink(link),
      createdByMode: creator.mode,
      authenticatedUserId: creator.authenticatedUserId,
      addedBy: creator.addedBy,
      voterId: creator.voterId,
    });
  } catch (error) {
    if (imagePath) {
      try {
        await queueSurveyOptionImageCleanup(imagePath);
        await cleanupSurveyOptionImages();
      } catch {
        return { error: 'Could not add the option. Image cleanup is queued for retry.' };
      }
    }
    const message = error instanceof Error && /duplicate|unique/i.test(error.message)
      ? 'An active option with this title already exists'
      : 'Could not add the option';
    return { error: message };
  }
  revalidateSurvey(surveyId);
  return { success: true, message: 'Option added' };
}

export async function addOpenSurveyOptionAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.survey_type !== 'open') return { error: 'Open survey not found' };
  if (await reconcileExpiredSurvey(survey)) {
    return { error: 'This survey is closed' };
  }
  return addOptionFromForm(formData, {
    mode: 'admin',
    authenticatedUserId: adminAccess.userId,
    addedBy: adminAccess.userId,
    voterId: null,
  });
}

export async function addResponderSurveyOptionAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const surveyId = String(formData.get('surveyId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.survey_type !== 'open') return { error: 'Open survey not found' };
  if (survey.state !== 'live' || await reconcileExpiredSurvey(survey)) {
    return { error: 'This survey is not accepting options' };
  }
  if (!survey.allow_responder_options) return { error: 'Responders cannot add options to this survey' };

  const { user, profile } = await getCurrentUser();
  if (user && (!profile || profile.status !== 'active')) return { error: 'Account is disabled' };
  if (survey.members_only && (!user || !profile || profile.status !== 'active' || profile.role === 'viewer')) {
    return { error: 'This survey is limited to members' };
  }
  const cookieStore = await cookies();
  const creator = resolveSurveyOptionCreator({
    isAnonymous: survey.is_anonymous,
    userId: user?.id ?? null,
    voterId: cookieStore.get('survey_voter_id')?.value ?? null,
  });
  if ('error' in creator) return creator;
  return addOptionFromForm(formData, {
    mode: 'responder',
    authenticatedUserId: user?.id ?? null,
    ...creator,
  });
}

export async function removeOpenSurveyOptionAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const optionId = String(formData.get('optionId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.survey_type !== 'open') return { error: 'Open survey not found' };
  if (await reconcileExpiredSurvey(survey)) return { error: 'Cannot remove options from a closed survey' };
  const choices = await getSurveyChoices(surveyId);
  if (!choices.some((choice) => choice.id === optionId)) return { error: 'Survey option not found' };
  const affected = await removeBallotOption(surveyId, optionId);
  const adminOptionCount = await getAdminSurveyOptionCount(surveyId);
  const responderOptionsReenabled = !survey.allow_responder_options && !canDisableResponderOptions(adminOptionCount);
  if (responderOptionsReenabled) {
    await updateSurvey(surveyId, { allow_responder_options: true });
  }
  const imageCleanup = await cleanupSurveyOptionImages();
  revalidateSurvey(surveyId);
  return {
    success: true,
    message: `Option removed${affected ? `. ${affected} ballot(s) affected.` : ''}${responderOptionsReenabled ? ' Responder-added options were re-enabled.' : ''}${imageCleanup.pending ? ' Image cleanup is queued for retry.' : ''}`,
  };
}

export async function addMovieToSurveyAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const movieId = String(formData.get('movieId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.survey_type !== 'movie') return { error: 'Movie survey not found' };
  if (await reconcileExpiredSurvey(survey)) return { error: 'Cannot add movies to a closed survey' };
  if (!movieId) return { error: 'Movie ID required' };
  const movie = await getMovieById(movieId);
  if (!movie) return { error: 'Movie not found' };
  try {
    await addSurveyEntry({ surveyId, movieId, addedBy: adminAccess.userId });
    revalidateSurvey(surveyId);
    return { success: true, message: 'Movie added', warning: movie.watched ? getWatchedNomineeWarningToast(movie.title) : null };
  } catch {
    return { error: 'Movie already in survey' };
  }
}

export async function removeMovieFromSurveyAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const movieId = String(formData.get('movieId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.survey_type !== 'movie') return { error: 'Movie survey not found' };
  if (await reconcileExpiredSurvey(survey)) return { error: 'Cannot remove movies from a closed survey' };
  const affected = movieId ? await removeBallotMovie(surveyId, movieId) : 0;
  revalidateSurvey(surveyId);
  return { success: true, message: `Movie removed${affected ? `. ${affected} ballot(s) affected.` : ''}` };
}

export async function deleteSurveyAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'draft') return { error: 'Can only delete draft surveys' };
  await deleteSurvey(surveyId);
  await cleanupSurveyOptionImages();
  redirect('/admin/surveys');
}

export async function toggleSurveyArchivedAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const adminAccess = await requireAdmin();
  if ('error' in adminAccess) return adminAccess;
  const surveyId = String(formData.get('surveyId') ?? '');
  const archived = formData.get('archived') === 'true';
  const survey = await getSurveyById(surveyId);
  if (!survey) return { error: 'Survey not found' };
  if (survey.state !== 'frozen') return { error: 'Can only archive frozen surveys' };
  await updateSurveyArchived(surveyId, archived);
  revalidateSurvey(surveyId);
  revalidatePath('/history');
  revalidatePath('/leaderboard');
  return { success: true, message: archived ? 'Survey archived' : 'Survey unarchived' };
}
