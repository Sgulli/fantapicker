export function withoutExcluded<T extends { playerId: number }>(
  rows: T[],
  excludeIds: number[],
): T[] {
  if (excludeIds.length === 0) return rows;
  const skip = new Set(excludeIds);
  return rows.filter((row) => !skip.has(row.playerId));
}
