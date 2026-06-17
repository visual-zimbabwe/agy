import { describe, expect, it } from "vitest";

import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";
import type { Note } from "@/features/wall/types";

const makeNote = (patch: Partial<Note> & Pick<Note, "w" | "h">): Note => ({
  id: "note",
  text: "",
  tags: [],
  x: 0,
  y: 0,
  color: "#FFE27A",
  createdAt: 0,
  updatedAt: 0,
  ...patch,
});

describe("resolveWallPreviewDimensions", () => {
  it("preserves wall note dimensions for timeline stream journal notes", () => {
    const dimensions = resolveWallPreviewDimensions(
      makeNote({ w: 420, h: 280, noteKind: "journal", text: "Dear Wall" }),
      { surface: "timeline-stream" },
    );

    expect(dimensions.width).toBe(420);
    expect(dimensions.height).toBe(280);
    expect(dimensions.scale).toBe(1);
  });

  it("clamps oversized file and bookmark notes on the timeline stream", () => {
    const fileDimensions = resolveWallPreviewDimensions(
      makeNote({
        w: 640,
        h: 320,
        noteKind: "file",
        file: { source: "upload", name: "report.pdf", url: "https://example.com/report.pdf" },
      }),
      { surface: "timeline-stream" },
    );
    const bookmarkDimensions = resolveWallPreviewDimensions(
      makeNote({
        w: 720,
        h: 360,
        noteKind: "web-bookmark",
        bookmark: {
          url: "https://example.com",
          normalizedUrl: "https://example.com",
          status: "ready",
        },
      }),
      { surface: "timeline-stream" },
    );

    expect(fileDimensions.width).toBeLessThanOrEqual(320);
    expect(fileDimensions.height).toBeLessThanOrEqual(260);
    expect(bookmarkDimensions.width).toBeLessThanOrEqual(320);
    expect(bookmarkDimensions.height).toBeLessThanOrEqual(260);
  });

  it("respects custom max bounds for timeline stream attachment notes", () => {
    const dimensions = resolveWallPreviewDimensions(
      makeNote({
        w: 640,
        h: 320,
        noteKind: "file",
        file: { source: "upload", name: "report.pdf", url: "https://example.com/report.pdf" },
      }),
      { surface: "timeline-stream", maxWidth: 240, maxHeight: 180 },
    );

    expect(dimensions.width).toBeLessThanOrEqual(240);
    expect(dimensions.height).toBeLessThanOrEqual(180);
  });

  it("applies timeline canvas card scaling from the shared policy", () => {
    const dimensions = resolveWallPreviewDimensions(
      makeNote({ w: 420, h: 180 }),
      { surface: "timeline-canvas", previewScale: "small" },
    );

    expect(dimensions.width).toBe(294);
    expect(dimensions.height).toBe(126);
    expect(dimensions.scale).toBe(0.7);
  });
});
