import { getAllMovies } from '@/lib/queries/movies';
import type { Metadata } from 'next';
import MoviesGrid from './MoviesGrid';

export const metadata: Metadata = {
  title: 'Movies - Movie Night',
};

export default async function MoviesPage() {
  const movies = await getAllMovies();

  return <MoviesGrid movies={movies} />;
}
