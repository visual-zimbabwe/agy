type DeckNode = {
  id: string;
  parent_id: string | null;
};

export const collectDeckAndChildrenIds = (decks: DeckNode[], rootDeckId: string, excludedIds: Set<string>) => {
  const childrenByParent = new Map<string | null, string[]>();
  for (const deck of decks) {
    const bucket = childrenByParent.get(deck.parent_id) ?? [];
    bucket.push(deck.id);
    childrenByParent.set(deck.parent_id, bucket);
  }

  const result: string[] = [];
  const queue = [rootDeckId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || excludedIds.has(current)) {
      continue;
    }
    result.push(current);
    for (const childId of childrenByParent.get(current) ?? []) {
      queue.push(childId);
    }
  }
  return result;
};

export const parseExcludedIds = (value: string | null) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );
