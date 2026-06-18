import { describe, expect, it } from "vitest";

import { wallNoteViewModelFixtures } from "@/features/wall/__fixtures__/wall-note-view-model-fixtures";
import type { Note } from "@/features/wall/types";
import { getWallNoteViewModel, stripWikiLinkMarkup } from "@/features/wall/wall-note-view-model";

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
      meta: "Next",
      standardTitle: "Project Atlas",
      standardBody: "Next",
      kind: "standard",
    });
  });

  it("derives media titles and metadata from note payloads", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.file)).toMatchObject({
      kind: "file",
      title: "Quarterly review",
      meta: expect.stringMatching(/PDF/i),
      metaDisplay: expect.stringMatching(/PDF/i),
    });
  });

  it("masks private notes at the presentation boundary", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.private)).toMatchObject({
      kind: "private",
      title: "Private note",
      meta: "Secured node",
      privacyMaskLabel: "Secured node",
      privacyMetaLabel: "Secured node",
    });
  });

  it("derives audio and video presentation labels", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.audio)).toMatchObject({
      kind: "audio",
      title: "Ambient Texture",
      meta: expect.stringMatching(/Audio/i),
    });
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.video)).toMatchObject({
      kind: "video",
      title: "Launch recap.mp4",
      meta: expect.stringMatching(/Video/i),
    });
  });

  it("derives image captions and metadata", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.image)).toMatchObject({
      kind: "image",
      title: "studio",
      imageCaption: "Morning light over the studio",
      imageMeta: expect.stringMatching(/Image/i),
    });
  });

  it("derives bookmark titles and site metadata", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.bookmark)).toMatchObject({
      kind: "web-bookmark",
      title: "Example Article",
      meta: "Example",
    });
  });

  it("derives journal title and body splits", () => {
    expect(getWallNoteViewModel(wallNoteViewModelFixtures.journal)).toMatchObject({
      kind: "journal",
      journalTitle: "Dear Wall,",
      journalBody: "This is the second line of the journal entry.",
    });
  });

  it("uppercases canvas meta display when requested", () => {
    const preview = getWallNoteViewModel(wallNoteViewModelFixtures.file, { surface: "preview" });
    const canvas = getWallNoteViewModel(wallNoteViewModelFixtures.file, { surface: "canvas-full" });

    expect(preview.meta).toBe(preview.metaDisplay);
    expect(canvas.metaDisplay).toBe(canvas.meta.toUpperCase());
  });

  it("keeps canvas and preview title/meta aligned for fixture notes", () => {
    for (const note of Object.values(wallNoteViewModelFixtures)) {
      const preview = getWallNoteViewModel(note, { surface: "preview" });
      const canvas = getWallNoteViewModel(note, { surface: "canvas-full", uppercaseMeta: true });

      expect(canvas.title).toBe(preview.title);
      expect(canvas.meta).toBe(preview.meta);
    }
  });
});

describe("wall note view model visual baseline", () => {
  it("matches stable presentation snapshots per note kind", () => {
    const snapshots = Object.fromEntries(
      Object.entries(wallNoteViewModelFixtures).map(([key, note]) => [
        key,
        getWallNoteViewModel(note, { surface: "preview" }),
      ]),
    );

    expect(snapshots).toMatchSnapshot();
  });
});
