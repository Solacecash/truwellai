export function toggleExclusiveMulti(
  current: string[],
  id: string,
  exclusiveId: string
): string[] {
  if (id === exclusiveId) {
    return current.includes(exclusiveId) ? [] : [exclusiveId];
  }
  const withoutExclusive = current.filter((x) => x !== exclusiveId);
  if (withoutExclusive.includes(id)) {
    return withoutExclusive.filter((x) => x !== id);
  }
  return [...withoutExclusive, id];
}
