import { describe, expect, it } from "vitest";

import { getWallNoteViewModel, stripWikiLinkMarkup } from "@/features/wall/wall-note-view-model";
import type { Note } from "@/features/wall/types";

const makeNote = (patch: Partial<Note> = {}): Note => ({
  id: "note",
  text: "First line\nSecond line",
  tags: [],
  x: 0,
  y: 0,
  w: 240,
  h: 160,
  color: "#FFFFFF",
  createdAt: 0,
  updatedAt: 0,
  ...patch,
});

describe("wall note view model", () => {
  it("strips wiki link markup for standard note titles", () => {
    expect(stripWikiLinkMarkup("Read [[Project Atlas]] today")).toBe("Read Project Atlas today");
    expect(getWallNoteViewModel(makeNote({ text: "[[Project Atlas]]\nNext" }))).toMatchObject({
      title: "Project Atlas",
      meta: "standard note",
    });
  });

  it("derives media titles and metadata from note payloads", () => {
    expect(
      getWallNoteViewModel(makeNote({
        noteKind: "file",
        file: { source: "upload", name: "brief.pdf", url: "data:application/pdf;base64,AA==" },
      })),
    ).toMatchObject({
      title: "brief.pdf",
      meta: "PDF DOCUMENT",
    });
  });

  it("masks private notes at the presentation boundary", () => {
    expect(
      getWallNoteViewModel(makeNote({
        text: "secret",
        privateNote: {
          version: 1,
          salt: "salt",
          iv: "iv",
          ciphertext: "cipher",
          protectedAt: 0,
          updatedAt: 0,
        },
      })),
    ).toMatchObject({
      title: "Private note",
      meta: "Secured node",
      privacyMaskLabel: "Secured node",
    });
  });
});
