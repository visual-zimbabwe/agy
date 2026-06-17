export type TimelineStreamDirection = "next" | "previous";

export const moveTimelineStreamSelection = (
  entryIds: readonly string[],
  currentId: string | undefined,
  direction: TimelineStreamDirection,
): string | undefined => {
  if (entryIds.length === 0) {
    return undefined;
  }

  if (!currentId) {
    return direction === "next" ? entryIds[0] : entryIds[entryIds.length - 1];
  }

  const index = entryIds.indexOf(currentId);
  if (index < 0) {
    return entryIds[0];
  }

  if (direction === "next") {
    return entryIds[Math.min(index + 1, entryIds.length - 1)];
  }

  return entryIds[Math.max(index - 1, 0)];
};
