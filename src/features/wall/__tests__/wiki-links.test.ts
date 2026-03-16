import { describe, expect, it } from "vitest";

import { extractWikiLinks, findNoteByWikiTitle, getActiveWikiLinkQuery, getNoteWikiTitle, replaceWikiLinkQuery } from "@/features/wall/wiki-links";
import type { Note } from "@/features/wall/types";

const makeNote = (id: string, text: string): Note => ({
  id,
  text,
  tags: [],
  textSize: "md",
  x: 0,
  y: 0,
  w: 220,
  h: 160,
  color: "#FEEA89",
  createdAt: 1,
  updatedAt: 1,
});

describe("wiki link helpers", () => {
  it("extracts wiki links from note text", () => {
    expect(extractWikiLinks("Read [[Alpha Note]] before [[Beta]].")).toEqual([
      { raw: "[[Alpha Note]]", title: "Alpha Note", start: 5, end: 19 },
      { raw: "[[Beta]]", title: "Beta", start: 27, end: 35 },
    ]);
  });

  it("detects the active wiki query at the caret", () => {
    expect(getActiveWikiLinkQuery("Plan [[Road", 11)).toEqual({ start: 5, end: 11, query: "Road" });
  });

  it("replaces the active wiki query with the chosen title", () => {
    const query = getActiveWikiLinkQuery("Plan [[Ro", 9);
    expect(query).toBeTruthy();
    if (!query) {
      return;
    }
    expect(replaceWikiLinkQuery("Plan [[Ro", query, "Roadmap")).toEqual({
      nextValue: "Plan [[Roadmap]]",
      selectionStart: 16,
      selectionEnd: 16,
    });
  });

  it("resolves note titles by first non-empty line", () => {
    const notesById = {
      alpha: makeNote("alpha", "Alpha Note\nSecond line"),
      beta: makeNote("beta", "Beta Note"),
    };
    expect(getNoteWikiTitle(notesById.alpha)).toBe("Alpha Note");
    expect(findNoteByWikiTitle(notesById, "beta note")?.id).toBe("beta");
  });
});
