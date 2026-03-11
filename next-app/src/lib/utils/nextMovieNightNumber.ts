const POSTGRES_INT_MAX = 2_147_483_647;

export function parseNextMovieNightNumberInput(input: FormDataEntryValue | null): number | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmedInput = input.trim();
  if (!/^\d+$/.test(trimmedInput)) {
    return null;
  }

  const parsedNumber = Number(trimmedInput);
  if (!Number.isSafeInteger(parsedNumber) || parsedNumber < 1 || parsedNumber > POSTGRES_INT_MAX) {
    return null;
  }

  return parsedNumber;
}
