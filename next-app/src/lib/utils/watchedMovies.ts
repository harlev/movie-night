import { pacificToUTC } from './closesAt';

const PACIFIC_TIME_ZONE = 'America/Los_Angeles';

function toPacificDate(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: PACIFIC_TIME_ZONE }));
}

function toDatetimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function filterMoviesByWatched<T extends { watched: boolean }>(movies: T[], includeWatched: boolean): T[] {
  if (includeWatched) return movies;
  return movies.filter((movie) => !movie.watched);
}

export function getSurveyWinnerWatchDeadlineUTC(frozenAtIso: string): string {
  const frozenAt = toPacificDate(new Date(frozenAtIso));

  const deadline = new Date(frozenAt);
  const daysUntilWednesday = (3 - deadline.getDay() + 7) % 7;

  deadline.setDate(deadline.getDate() + daysUntilWednesday);
  deadline.setHours(23, 0, 0, 0);

  // If the survey froze after this week's Wednesday deadline, move to next week.
  if (deadline.getTime() <= frozenAt.getTime()) {
    deadline.setDate(deadline.getDate() + 7);
  }

  return pacificToUTC(toDatetimeLocalValue(deadline));
}

export function isPastSurveyWinnerWatchDeadline(frozenAtIso: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(getSurveyWinnerWatchDeadlineUTC(frozenAtIso)).getTime();
}

export function getWatchedNomineeWarningToast(movieTitle: string): string {
  return `"${movieTitle}" is marked as watched. It was added to nominees anyway.`;
}
