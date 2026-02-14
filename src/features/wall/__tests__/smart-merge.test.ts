import { describe, expect, it } from "vitest";

import type { Note } from "@/features/wall/types";
import { findSmartMergeSuggestions } from "@/lib/smart-merge";

const note = (overrides: Partial<Note>): Note => ({
  id: overrides.id ?? "note",
  text: overrides.text ?? "",
  tags: overrides.tags ?? [],
  textSize: overrides.textSize ?? "md",
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  w: overrides.w ?? 220,
  h: overrides.h ?? 160,
  color: overrides.color ?? "#FEEA89",
  createdAt: overrides.createdAt ?? 1,
  updatedAt: overrides.updatedAt ?? 1,
  ...overrides,
});

describe("smart merge suggestion scoring", () => {
  it("flags obvious duplicates", () => {
    const suggestions = findSmartMergeSuggestions([
      note({ id: "older", updatedAt: 1, text: "Launch plan for Q2!" }),
      note({ id: "newer", updatedAt: 2, text: "launch plan for q2" }),
    ]);

    expect(suggestions[0]).toBeDefined();
    expect(suggestions[0]?.reason).toBe("duplicate");
    expect(suggestions[0]?.keepNoteId).toBe("newer");
    expect(suggestions[0]?.mergeNoteId).toBe("older");
  });

  it("flags strong textual overlap as similar", () => {
    const suggestions = findSmartMergeSuggestions([
      note({ id: "a", text: "Design API retry strategy for sync failures", x: 0, y: 0 }),
      note({ id: "b", text: "Design retry strategy for sync failure handling", x: 90, y: 70 }),
      note({ id: "c", text: "Completely unrelated gardening tasks", x: 1400, y: 1200 }),
    ]);

    const similar = suggestions.find((item) => item.keepNoteId === "a" || item.keepNoteId === "b");
    expect(similar).toBeDefined();
    expect(similar?.reason).toBe("similar");
  });
});
