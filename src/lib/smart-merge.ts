import type { Note } from "@/features/wall/types";

export type SmartMergeReason = "duplicate" | "similar";

export type SmartMergeSuggestion = {
  keepNoteId: string;
  mergeNoteId: string;
  score: number;
  reason: SmartMergeReason;
};

const tokenize = (text: string) =>
  text
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const normalizeWhitespace = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const normalizeForTokens = (value: string) => normalizeWhitespace(value).replace(/[^a-z0-9 ]+/g, "");

const tokenJaccard = (a: string[], b: string[]) => {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  const left = new Set(a);
  const right = new Set(b);
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }
  const union = left.size + right.size - overlap;
  return union === 0 ? 0 : overlap / union;
};

const trigramSet = (value: string) => {
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 3) {
    return new Set([compact]);
  }
  const set = new Set<string>();
  for (let index = 0; index <= compact.length - 3; index += 1) {
    set.add(compact.slice(index, index + 3));
  }
  return set;
};

const diceSimilarity = (a: string, b: string) => {
  const left = trigramSet(a);
  const right = trigramSet(b);
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }
  return (2 * overlap) / (left.size + right.size);
};

const pickKeepOrder = (first: Note, second: Note): [Note, Note] => {
  if (first.updatedAt !== second.updatedAt) {
    return first.updatedAt >= second.updatedAt ? [first, second] : [second, first];
  }
  return first.id.localeCompare(second.id) <= 0 ? [first, second] : [second, first];
};

export const findSmartMergeSuggestions = (notes: Note[], limit = 24): SmartMergeSuggestion[] => {
  if (notes.length < 2) {
    return [];
  }

  const suggestions: SmartMergeSuggestion[] = [];

  for (let leftIndex = 0; leftIndex < notes.length - 1; leftIndex += 1) {
    const left = notes[leftIndex];
    if (!left) {
      continue;
    }
    const leftBase = normalizeWhitespace(left.text);
    const leftTokenText = normalizeForTokens(left.text);
    if (!leftBase) {
      continue;
    }
    const leftTokens = tokenize(leftTokenText);

    for (let rightIndex = leftIndex + 1; rightIndex < notes.length; rightIndex += 1) {
      const right = notes[rightIndex];
      if (!right) {
        continue;
      }
      const rightBase = normalizeWhitespace(right.text);
      const rightTokenText = normalizeForTokens(right.text);
      if (!rightBase) {
        continue;
      }
      const rightTokens = tokenize(rightTokenText);

      const [keep, merge] = pickKeepOrder(left, right);

      if (leftTokenText && leftTokenText === rightTokenText && leftTokenText.length >= 6) {
        suggestions.push({
          keepNoteId: keep.id,
          mergeNoteId: merge.id,
          score: 1,
          reason: "duplicate",
        });
        continue;
      }

      const overlapScore = tokenJaccard(leftTokens, rightTokens);
      const textScore = diceSimilarity(leftBase, rightBase);

      const short = leftBase.length <= rightBase.length ? leftBase : rightBase;
      const long = short === leftBase ? rightBase : leftBase;
      const containsMatch = short.length >= 12 && long.includes(short);

      let score = Math.max(overlapScore, textScore);
      if (containsMatch) {
        score = Math.max(score, 0.9);
      }

      const distance = Math.hypot((left.x + left.w / 2) - (right.x + right.w / 2), (left.y + left.h / 2) - (right.y + right.h / 2));
      if (distance < 260 && score > 0.62) {
        score = Math.min(0.97, score + 0.05);
      }

      if (score < 0.68) {
        continue;
      }

      suggestions.push({
        keepNoteId: keep.id,
        mergeNoteId: merge.id,
        score,
        reason: "similar",
      });
    }
  }

  return suggestions
    .sort((a, b) => {
      if (a.reason !== b.reason) {
        return a.reason === "duplicate" ? -1 : 1;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.keepNoteId !== b.keepNoteId) {
        return a.keepNoteId.localeCompare(b.keepNoteId);
      }
      return a.mergeNoteId.localeCompare(b.mergeNoteId);
    })
    .slice(0, Math.max(0, limit));
};
