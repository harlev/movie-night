export function reconcileSurveyEntries<T extends { optionId: string }>(
  previous: T[],
  incoming: T[],
  orderNew: (entries: T[]) => T[] = (entries) => entries
): T[] {
  const incomingById = new Map(incoming.map((entry) => [entry.optionId, entry]));
  const retained = previous
    .filter((entry) => incomingById.has(entry.optionId))
    .map((entry) => incomingById.get(entry.optionId)!);
  const retainedIds = new Set(retained.map((entry) => entry.optionId));
  const added = incoming.filter((entry) => !retainedIds.has(entry.optionId));
  return [...retained, ...orderNew(added)];
}
