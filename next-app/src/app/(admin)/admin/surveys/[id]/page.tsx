import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSurveyById, getSurveyChoices, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllMovies, autoMarkPastDueSurveyWinnersAsWatched } from '@/lib/queries/movies';
import { getAllBallots } from '@/lib/queries/ballots';
import { getSuggestionCounts } from '@/lib/queries/suggestions';
import SurveyDetailClient from './SurveyDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const survey = await getSurveyById(id);
  return {
    title: survey ? `${survey.title} - Admin` : 'Survey Not Found',
  };
}

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurveyById(id);

  if (!survey) {
    notFound();
  }

  if (survey.survey_type === 'movie') {
    await autoMarkPastDueSurveyWinnersAsWatched();
  }

  const [choices, entries, allMovies, ballots, suggestionCounts] = await Promise.all([
    getSurveyChoices(survey.id),
    survey.survey_type === 'movie' ? getSurveyEntries(survey.id) : Promise.resolve([]),
    survey.survey_type === 'movie' ? getAllMovies() : Promise.resolve([]),
    getAllBallots(survey.id),
    survey.survey_type === 'movie' ? getSuggestionCounts() : Promise.resolve({}),
  ]);

  // Filter out movies already in survey
  const entryMovieIds = new Set(entries.map((e) => e.movie_id));
  const availableMovies = allMovies
    .filter((m) => !entryMovieIds.has(m.id))
    .map((m) => ({
      id: m.id,
      title: m.title,
      posterPath: m.metadata_snapshot?.posterPath || null,
      releaseDate: m.metadata_snapshot?.releaseDate || null,
      voteAverage: m.metadata_snapshot?.voteAverage || null,
      watched: m.watched,
      watchedAt: m.watched_at,
    }));

  return (
    <SurveyDetailClient
      survey={survey}
      choices={choices}
      entries={entries}
      ballotCount={ballots.length}
      availableMovies={availableMovies}
      ballots={ballots}
      suggestionCounts={suggestionCounts}
    />
  );
}
