/**
 * Returns a datetime-local string for next Sunday at 6:00 PM Pacific Time.
 * Used as the default value for closing time inputs.
 */
export function getNextSunday6pmPacific(): string {
  // Get current time in Pacific
  const now = new Date();
  const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  // Find next Sunday
  const daysUntilSunday = (7 - pacificNow.getDay()) % 7 || 7;
  const nextSunday = new Date(pacificNow);
  nextSunday.setDate(pacificNow.getDate() + daysUntilSunday);
  nextSunday.setHours(18, 0, 0, 0);

  // Format as datetime-local: YYYY-MM-DDTHH:MM
  const year = nextSunday.getFullYear();
  const month = String(nextSunday.getMonth() + 1).padStart(2, '0');
  const day = String(nextSunday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T18:00`;
}

/**
 * Converts a datetime-local string (interpreted as Pacific Time) to a UTC ISO string.
 */
export function pacificToUTC(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Start with the same clock values as UTC (timezone-neutral baseline)
  const asUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Find the Pacific-to-UTC offset at this approximate instant by formatting
  // the same instant in both timezones and comparing. Both are re-parsed in
  // the browser's local timezone, so the *difference* is the real offset.
  const pacificMs = new Date(asUTC.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getTime();
  const utcMs = new Date(asUTC.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const offsetMs = utcMs - pacificMs; // positive: Pacific is behind UTC

  // The input numbers are Pacific, so shift forward by the offset to get UTC
  const result = new Date(asUTC.getTime() + offsetMs);
  return result.toISOString();
}

/**
 * Converts a UTC ISO string to a datetime-local string in Pacific Time.
 * Used for pre-filling edit forms.
 */
export function utcToPacificLocal(utcIso: string): string {
  const date = new Date(utcIso);
  // Format in Pacific timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
