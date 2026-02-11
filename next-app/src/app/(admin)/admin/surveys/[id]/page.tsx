import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSurveyById, getSurveyEntries } from '@/lib/queries/surveys';
import { getAllMovies } from '@/lib/queries/movies';
import { getAllBallots } from '@/lib/queries/ballots';
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

  const entries = await getSurveyEntries(survey.id);
  const allMovies = await getAllMovies();
  const ballots = await getAllBallots(survey.id);

  // Filter out movies already in survey
  const entryMovieIds = new Set(entries.map((e) => e.movie_id));
  const availableMovies = allMovies
    .filter((m) => !entryMovieIds.has(m.id))
    .map((m) => ({ id: m.id, title: m.title }));

  return (
    <SurveyDetailClient
      survey={survey}
      entries={entries}
      ballotCount={ballots.length}
      availableMovies={availableMovies}
      ballots={ballots}
    />
  );
}
