import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllMovies } from '@/lib/queries/movies';
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

  const [entries, allMovies, ballots, suggestionCounts] = await Promise.all([
    getSurveyEntries(survey.id),
    getAllMovies(),
    getAllBallots(survey.id),
    getSuggestionCounts(),
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
    }));

  return (
    <SurveyDetailClient
      survey={survey}
      entries={entries}
      ballotCount={ballots.length}
      availableMovies={availableMovies}
      ballots={ballots}
      suggestionCounts={suggestionCounts}
    />
  );
}
