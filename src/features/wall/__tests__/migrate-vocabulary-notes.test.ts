import { describe, expect, it } from "vitest";

import { convertVocabularyNoteToStandard, migrateVocabularyNotesInState } from "@/features/wall/migrate-vocabulary-notes";
import type { Note } from "@/features/wall/types";

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: "n1",
  noteKind: "standard",
  text: "",
  textAlign: "left",
  textVAlign: "top",
  textFont: "nunito",
  textColor: "#1f2430",
  textSizePx: 14,
  tags: [],
  textSize: "md",
  pinned: false,
  highlighted: false,
  x: 0,
  y: 0,
  w: 200,
  h: 120,
  color: "#fffefb",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("migrate-vocabulary-notes", () => {
  it("converts empty-front flashcard to word title with meaning footer", () => {
    const note = baseNote({
      vocabulary: {
        word: "ephemeral",
        sourceContext: "from a poem",
        guessMeaning: "",
        meaning: "short-lived",
        ownSentence: "",
        flipped: false,
        nextReviewAt: 0,
        intervalDays: 0,
        reviewsCount: 0,
        lapses: 0,
        isFocus: false,
      },
    });

    const migrated = convertVocabularyNoteToStandard(note, 100);
    expect(migrated.vocabulary).toBeUndefined();
    expect(migrated.text).toContain("ephemeral");
    expect(migrated.text).toContain("short-lived");
    expect(migrated.updatedAt).toBe(100);
  });

  it("appends vocabulary footer when note already has text", () => {
    const note = baseNote({
      text: "My idea",
      vocabulary: {
        word: "lemma",
        sourceContext: "",
        guessMeaning: "",
        meaning: "a heading",
        ownSentence: "Used in docs.",
        flipped: false,
        nextReviewAt: 0,
        intervalDays: 0,
        reviewsCount: 0,
        lapses: 0,
        isFocus: false,
      },
    });

    const migrated = convertVocabularyNoteToStandard(note);
    expect(migrated.text.startsWith("My idea")).toBe(true);
    expect(migrated.text).toContain("a heading");
    expect(migrated.text).toContain("Used in docs.");
    expect(migrated.vocabulary).toBeUndefined();
  });

  it("migrateVocabularyNotesInState is idempotent", () => {
    const notes = {
      a: baseNote({ id: "a" }),
      b: baseNote({
        id: "b",
        vocabulary: {
          word: "test",
          sourceContext: "",
          guessMeaning: "",
          meaning: "check",
          ownSentence: "",
          flipped: false,
          nextReviewAt: 0,
          intervalDays: 0,
          reviewsCount: 0,
          lapses: 0,
          isFocus: false,
        },
      }),
    };

    const first = migrateVocabularyNotesInState(notes);
    expect(first.migratedCount).toBe(1);
    expect(first.notes.b.vocabulary).toBeUndefined();

    const second = migrateVocabularyNotesInState(first.notes);
    expect(second.migratedCount).toBe(0);
    expect(second.notes.b.text).toBe(first.notes.b.text);
  });
});
