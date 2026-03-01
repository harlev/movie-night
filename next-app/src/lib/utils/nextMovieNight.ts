const DEFAULT_TIME_ZONE = 'America/Los_Angeles';
const WEDNESDAY_INDEX = 3;
const DAY_IN_MS = 86_400_000;

const WEEKDAY_INDEX_BY_SHORT_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedDaySnapshot(now: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  weekdayIndex: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';

  const weekdayShort = getPart('weekday');
  const weekdayIndex = WEEKDAY_INDEX_BY_SHORT_NAME[weekdayShort];

  if (weekdayIndex === undefined) {
    throw new Error(`Unsupported weekday value: ${weekdayShort}`);
  }

  return {
    year: Number(getPart('year')),
    month: Number(getPart('month')),
    day: Number(getPart('day')),
    weekdayIndex,
  };
}

export function getNextWednesdayIsoDate(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const snapshot = getZonedDaySnapshot(now, timeZone);
  const daysUntilWednesday =
    ((WEDNESDAY_INDEX - snapshot.weekdayIndex + 7) % 7) || 7;

  // Anchor at UTC noon to avoid DST edge cases when converting day-only values.
  const currentDayUtc = Date.UTC(snapshot.year, snapshot.month - 1, snapshot.day, 12, 0, 0, 0);
  const nextWednesdayUtc = new Date(currentDayUtc + daysUntilWednesday * DAY_IN_MS);

  return nextWednesdayUtc.toISOString().slice(0, 10);
}

export function getNextMovieNightDateLabel(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const isoDate = getNextWednesdayIsoDate(now, timeZone);
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
