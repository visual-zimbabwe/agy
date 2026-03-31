import { describe, expect, it } from "vitest";

import { createDeckNoteFingerprint, findDuplicateDeckNote, normalizeDeckNoteFields } from "@/features/decks/duplicates";

describe("normalizeDeckNoteFields", () => {
  it("sorts keys and trims values so field order does not affect duplicate detection", () => {
    expect(
      normalizeDeckNoteFields({
        Back: " Answer ",
        Front: " Prompt ",
      }),
    ).toEqual({
      Back: "Answer",
      Front: "Prompt",
    });
  });

  it("normalizes Windows line endings before comparing notes", () => {
    expect(createDeckNoteFingerprint({ Front: "Line 1\r\nLine 2" })).toBe(createDeckNoteFingerprint({ Front: "Line 1\nLine 2" }));
  });
});

describe("findDuplicateDeckNote", () => {
  it("matches an existing note with the same normalized fields", () => {
    const duplicate = findDuplicateDeckNote(
      [
        { id: "note-1", fields: { Back: "Answer", Front: "Prompt" } },
        { id: "note-2", fields: { Front: "Different", Back: "Content" } },
      ],
      { Front: "Prompt", Back: "Answer" },
    );

    expect(duplicate?.id).toBe("note-1");
  });

  it("does not treat different inner whitespace as an exact duplicate", () => {
    const duplicate = findDuplicateDeckNote([{ id: "note-1", fields: { Front: "Prompt  text", Back: "Answer" } }], {
      Front: "Prompt text",
      Back: "Answer",
    });

    expect(duplicate).toBeNull();
  });
});
