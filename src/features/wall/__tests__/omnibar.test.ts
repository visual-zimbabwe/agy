import { describe, expect, it } from "vitest";

import {
  commandMatchesToolFilters,
  matchesWallOmnibarNoteFilters,
  parseWallOmnibarQuery,
} from "@/features/wall/omnibar";
import type { Note } from "@/features/wall/types";

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  noteKind: "standard",
  text: "Project launch checklist",
  tags: ["project", "launch"],
  x: 0,
  y: 0,
  w: 240,
  h: 180,
  color: "#fff4b0",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("parseWallOmnibarQuery", () => {
  it("extracts structured tokens and leaves free text searchable", () => {
    const parsed = parseWallOmnibarQuery("tag:project type:quote is:pinned tool:details quarterly review");

    expect(parsed.tagFilters).toEqual(["project"]);
    expect(parsed.typeFilters).toEqual(["quote"]);
    expect(parsed.stateFilters).toEqual(["pinned"]);
    expect(parsed.toolFilters).toEqual(["details"]);
    expect(parsed.searchText).toBe("quarterly review");
    expect(parsed.commandsOnly).toBe(false);
  });

  it("preserves slash-prefixed action search mode", () => {
    const parsed = parseWallOmnibarQuery("tool:export /pdf");

    expect(parsed.commandsOnly).toBe(true);
    expect(parsed.searchText).toBe("pdf");
    expect(parsed.toolFilters).toEqual(["export"]);
  });
});

describe("matchesWallOmnibarNoteFilters", () => {
  it("requires matching tags, note type, and note state", () => {
    const parsed = parseWallOmnibarQuery("tag:project type:quote is:highlighted");
    const note = makeNote({ noteKind: "quote", highlighted: true, quoteAuthor: "Ada Lovelace" });

    expect(matchesWallOmnibarNoteFilters(note, parsed)).toBe(true);
    expect(matchesWallOmnibarNoteFilters(makeNote({ noteKind: "quote", highlighted: false }), parsed)).toBe(false);
    expect(matchesWallOmnibarNoteFilters(makeNote({ noteKind: "standard", highlighted: true }), parsed)).toBe(false);
  });
});

describe("commandMatchesToolFilters", () => {
  it("matches actions against tool tokens", () => {
    expect(
      commandMatchesToolFilters(
        { label: "Open sidebar", description: "Open the right details sidebar.", keywords: ["details", "sidebar"] },
        ["details"],
      ),
    ).toBe(true);
    expect(
      commandMatchesToolFilters(
        { label: "Open export panel", description: "Export PNG and PDF.", keywords: ["download", "share"] },
        ["timeline"],
      ),
    ).toBe(false);
  });
});
