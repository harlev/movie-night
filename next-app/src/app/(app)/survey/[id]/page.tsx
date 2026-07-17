import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getAllBallots, getBallotByOwner } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { finalizeExpiredSurveys, getSurveyById, getSurveyChoices } from '@/lib/queries/surveys';
import { calculateStandings, getPointsBreakdown } from '@/lib/services/scoring';
import { createClient } from '@/lib/supabase/server';
import { isSurveyClosed } from '@/lib/utils/surveyConfig';
import SurveyVotingClient from './SurveyVotingClient';

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let survey = await getSurveyById(id);
  if (!survey || survey.state === 'draft') notFound();

  if (isSurveyClosed({ state: survey.state, closesAt: survey.closes_at })) {
    await finalizeExpiredSurveys();
    survey = await getSurveyById(id);
    if (!survey) notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserById(user.id) : null;
  if (survey.members_only && (!user || !profile || profile.status !== 'active')) {
    redirect(`/login?next=${encodeURIComponent(`/survey/${id}`)}`);
  }

  const cookieStore = await cookies();
  const voterId = cookieStore.get('survey_voter_id')?.value ?? null;
  const owner = survey.is_anonymous
    ? voterId ? { ownerMode: 'anonymous' as const, voterId } : null
    : user
      ? { ownerMode: 'user' as const, userId: user.id }
      : voterId
        ? { ownerMode: 'guest' as const, voterId }
        : null;

  const [choices, allBallots, userBallot] = await Promise.all([
    getSurveyChoices(survey.id),
    getAllBallots(survey.id),
    owner ? getBallotByOwner(survey.id, owner) : Promise.resolve(null),
  ]);
  const standings = calculateStandings(
    allBallots.map((ballot) => ({
      ranks: ballot.ranks.map((rank) => ({ rank: rank.rank, optionId: rank.optionId })),
    })),
    choices.map((choice) => ({ id: choice.id, title: choice.title, imageUrl: choice.imageUrl })),
    survey.max_rank_n
  );

  return (
    <SurveyVotingClient
      survey={{
        id: survey.id,
        title: survey.title,
        description: survey.description,
        state: survey.state,
        maxRankN: survey.max_rank_n,
        closesAt: survey.closes_at,
        surveyType: survey.survey_type,
        allowResponderOptions: survey.allow_responder_options,
        isAnonymous: survey.is_anonymous,
        membersOnly: survey.members_only,
      }}
      entries={choices.map((choice) => ({ optionId: choice.id, choice }))}
      userBallotRanks={userBallot?.ranks.map((rank) => ({ rank: rank.rank, optionId: rank.survey_entry_id })) ?? null}
      allBallots={allBallots.map((ballot) => ({
        user: ballot.user,
        ranks: ballot.ranks.map((rank) => ({
          rank: rank.rank,
          optionId: rank.optionId,
          optionTitle: rank.optionTitle,
        })),
      }))}
      standings={standings}
      pointsBreakdown={getPointsBreakdown(survey.max_rank_n)}
      hasExistingBallot={Boolean(userBallot)}
      userRole={profile?.role ?? null}
      isAuthenticated={Boolean(user)}
      initialGuestName={userBallot?.guest_display_name ?? ''}
    />
  );
}
