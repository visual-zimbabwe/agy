import { describe, expect, it } from "vitest";

import { applyVocabularyReview, createVocabularyNote } from "@/features/wall/vocabulary";

describe("vocabulary scheduling", () => {
  it("schedules again for 10 minutes and increments lapses", () => {
    const now = 1_700_000_000_000;
    const reviewed = applyVocabularyReview(createVocabularyNote(now), "again", now);
    expect(reviewed.nextReviewAt).toBe(now + 10 * 60 * 1000);
    expect(reviewed.lapses).toBe(1);
    expect(reviewed.intervalDays).toBe(0);
  });

  it("requires repeated misses to mark focus", () => {
    const now = 1_700_000_000_000;
    const base = createVocabularyNote(now);
    const first = applyVocabularyReview(base, "again", now);
    const second = applyVocabularyReview(first, "again", now + 1);
    const third = applyVocabularyReview(second, "again", now + 2);
    expect(first.isFocus).toBe(false);
    expect(second.isFocus).toBe(false);
    expect(third.isFocus).toBe(true);
  });
});
