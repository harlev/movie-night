import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllBallots, getParticipantBallot } from '@/lib/queries/ballots';
import { getUserById } from '@/lib/queries/profiles';
import { calculateStandings } from '@/lib/services/scoring';
import SimpleVotingClient from './SimpleVotingClient';
import { resolveSimpleSurveyView } from './simpleViewState';
import { getSurveyGuestSessionIdHash } from '@/lib/utils/surveyGuest.server';

export default async function SimpleSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; page?: string; submitted?: string }>;
}) {
  const { id } = await params;
  const { view, page, submitted } = await searchParams;
  const guestSessionIdHash = await getSurveyGuestSessionIdHash(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const survey = await getSurveyById(id);
  if (!survey || survey.state === 'draft') {
    notFound();
  }

  const [userBallot, profile] = await Promise.all([
    getParticipantBallot({
      surveyId: survey.id,
      userId: user?.id ?? null,
      guestSessionIdHash,
    }),
    user ? getUserById(user.id) : Promise.resolve(null),
  ]);

  const resolvedView = resolveSimpleSurveyView({
    requestedView: view ?? null,
    requestedPage: page ?? null,
    requestedSubmitted: submitted ?? null,
    hasExistingBallot: !!userBallot,
    surveyState: survey.state,
    userRole: profile?.role,
  });

  if (resolvedView.shouldRedirect) {
    redirect(`/survey/${survey.id}/simple${resolvedView.canonicalSearch}`);
  }

  const entries = await getSurveyEntries(survey.id);
  const clientEntries = entries.map((e) => ({
    movieId: e.movie_id,
    movie: {
      id: e.movie.id,
      title: e.movie.title,
      metadata_snapshot: e.movie.metadata_snapshot,
    },
  }));

  const clientBallotRanks = userBallot?.ranks.map((r) => ({
    rank: r.rank,
    movieId: r.movie_id,
  })) || null;

  let standings = undefined;
  let clientAllBallots = undefined;

  if (resolvedView.view === 'results') {
    const allBallots = await getAllBallots(survey.id);
    standings = calculateStandings(
      allBallots.map((b) => ({
        ranks: b.ranks.map((r) => ({ rank: r.rank, movieId: r.movieId })),
      })),
      entries.map((e) => ({
        id: e.movie.id,
        title: e.movie.title,
        tmdbId: e.movie.tmdb_id,
        metadataSnapshot: e.movie.metadata_snapshot,
      })),
      survey.max_rank_n
    );
    clientAllBallots = allBallots.map((b) => ({
      user: b.user,
      ranks: b.ranks.map((r) => ({
        rank: r.rank,
        movieId: r.movieId,
        movieTitle: r.movieTitle,
      })),
    }));
  }

  return (
    <SimpleVotingClient
      survey={{
        id: survey.id,
        title: survey.title,
        description: survey.description,
        state: survey.state,
        maxRankN: survey.max_rank_n,
        closesAt: survey.closes_at,
      }}
      entries={clientEntries}
      userBallotRanks={clientBallotRanks}
      view={resolvedView.view}
      resultsPage={resolvedView.resultsPage}
      allBallots={clientAllBallots}
      standings={standings}
      hasExistingBallot={!!userBallot}
      showBackToBallot={resolvedView.canEditBallot}
      showSubmittedFlash={resolvedView.showSubmittedFlash}
      userRole={profile?.role}
      isLoggedIn={!!user}
      currentGuestDisplayName={userBallot?.guest_display_name ?? null}
    />
  );
}
