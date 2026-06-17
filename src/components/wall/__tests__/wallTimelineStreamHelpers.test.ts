import { describe, expect, it } from "vitest";

import {
  buildTimelineStreamGroups,
  filterTimelineStreamNotes,
  formatTimelineStreamDayLabel,
  getTimelineStreamDayOptions,
  getTimelineStreamSearchHaystack,
  matchesTimelineStreamSearch,
  moveTimelineStreamSelection,
  resolveTimelineStreamSelection,
  timelineStreamDayKey,
  timelineStreamStartOfDay,
} from "@/components/wall/wallTimelineStreamHelpers";
import type { Note } from "@/features/wall/types";

const makeNote = (patch: Partial<Note> & Pick<Note, "id">): Note => ({
  text: "Untitled note",
  tags: [],
  x: 0,
  y: 0,
  w: 240,
  h: 160,
  color: "#FFE27A",
  createdAt: Date.UTC(2026, 2, 16, 12, 0, 0),
  updatedAt: Date.UTC(2026, 2, 16, 12, 0, 0),
  ...patch,
});

describe("matchesTimelineStreamSearch", () => {
  it("matches first-line titles, tags, and file names", () => {
    const note = makeNote({
      id: "text-note",
      text: "Dear Wall\nSecond line",
      tags: ["journal"],
    });
    const fileNote = makeNote({
      id: "file-note",
      noteKind: "file",
      text: "",
      file: { source: "upload", name: "quarterly-report.pdf", url: "https://example.com/report.pdf" },
    });

    expect(matchesTimelineStreamSearch(note, "dear wall")).toBe(true);
    expect(matchesTimelineStreamSearch(note, "journal")).toBe(true);
    expect(matchesTimelineStreamSearch(fileNote, "quarterly-report")).toBe(true);
    expect(matchesTimelineStreamSearch(note, "missing")).toBe(false);
  });

  it("returns true for an empty query", () => {
    const note = makeNote({ id: "note", text: "Anything" });
    expect(matchesTimelineStreamSearch(note, "   ")).toBe(true);
  });
});

describe("filterTimelineStreamNotes", () => {
  it("drops deleted notes and applies the search filter", () => {
    const notes = [
      makeNote({ id: "keep", text: "Dear Wall" }),
      makeNote({ id: "drop", text: "Other note" }),
      makeNote({ id: "deleted", text: "Dear Wall", deletedAt: Date.now() }),
    ];

    expect(filterTimelineStreamNotes(notes, "dear wall").map((note) => note.id)).toEqual(["keep"]);
  });
});

describe("buildTimelineStreamGroups", () => {
  it("groups notes by created day in descending order by default", () => {
    const notes = [
      makeNote({ id: "today", text: "Today note", createdAt: Date.UTC(2026, 2, 16, 18, 0, 0) }),
      makeNote({ id: "yesterday", text: "Yesterday note", createdAt: Date.UTC(2026, 2, 15, 10, 0, 0) }),
    ];

    const groups = buildTimelineStreamGroups(notes);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.entries.map((entry) => entry.id)).toEqual(["today"]);
    expect(groups[1]?.entries.map((entry) => entry.id)).toEqual(["yesterday"]);
    expect(groups[0]?.label).toBe("Today");
    expect(groups[1]?.label).toBe("Yesterday");
  });

  it("can sort and bucket by updated time", () => {
    const notes = [
      makeNote({
        id: "older-update",
        text: "Older update",
        createdAt: Date.UTC(2026, 2, 10, 9, 0, 0),
        updatedAt: Date.UTC(2026, 2, 16, 8, 0, 0),
      }),
      makeNote({
        id: "newer-update",
        text: "Newer update",
        createdAt: Date.UTC(2026, 2, 14, 9, 0, 0),
        updatedAt: Date.UTC(2026, 2, 16, 20, 0, 0),
      }),
    ];

    const groups = buildTimelineStreamGroups(notes, { sortMode: "updated" });
    expect(groups[0]?.entries.map((entry) => entry.id)).toEqual(["newer-update", "older-update"]);
  });

  it("respects the search query before grouping", () => {
    const notes = [
      makeNote({ id: "match", text: "Dear Wall" }),
      makeNote({ id: "skip", text: "Other note" }),
    ];

    const groups = buildTimelineStreamGroups(notes, { searchQuery: "dear wall" });
    expect(groups.flatMap((group) => group.entries.map((entry) => entry.id))).toEqual(["match"]);
  });
});

describe("getTimelineStreamDayOptions", () => {
  it("returns day labels for the jump menu", () => {
    const notes = [
      makeNote({ id: "today", text: "Today note", createdAt: Date.UTC(2026, 2, 16, 18, 0, 0) }),
      makeNote({ id: "yesterday", text: "Yesterday note", createdAt: Date.UTC(2026, 2, 15, 10, 0, 0) }),
    ];
    const groups = buildTimelineStreamGroups(notes);

    expect(getTimelineStreamDayOptions(groups)).toEqual([
      { key: timelineStreamDayKey(Date.UTC(2026, 2, 16, 18, 0, 0)), label: "Today" },
      { key: timelineStreamDayKey(Date.UTC(2026, 2, 15, 10, 0, 0)), label: "Yesterday" },
    ]);
  });
});

describe("timeline stream day helpers", () => {
  it("formats relative day labels from the latest day anchor", () => {
    const latestDay = timelineStreamStartOfDay(Date.UTC(2026, 2, 16, 12, 0, 0));
    expect(formatTimelineStreamDayLabel(Date.UTC(2026, 2, 16, 18, 0, 0), latestDay)).toBe("Today");
    expect(formatTimelineStreamDayLabel(Date.UTC(2026, 2, 15, 10, 0, 0), latestDay)).toBe("Yesterday");
    expect(formatTimelineStreamDayLabel(Date.UTC(2026, 2, 10, 10, 0, 0), latestDay)).toBe("March 10, 2026");
  });

  it("builds a stable day key", () => {
    expect(timelineStreamDayKey(Date.UTC(2026, 2, 16, 18, 0, 0))).toBe("2026-2-16");
  });
});

describe("getTimelineStreamSearchHaystack", () => {
  it("includes bookmark and quote metadata", () => {
    const note = makeNote({
      id: "bookmark",
      noteKind: "web-bookmark",
      text: "",
      bookmark: {
        url: "https://example.com",
        normalizedUrl: "https://example.com",
        status: "ready",
        metadata: {
          url: "https://example.com",
          finalUrl: "https://example.com",
          title: "Example Article",
          description: "",
          siteName: "Example",
          domain: "example.com",
          kind: "article",
        },
      },
    });

    expect(getTimelineStreamSearchHaystack(note)).toContain("Example Article");
  });
});

describe("moveTimelineStreamSelection", () => {
  const entryIds = ["newest", "middle", "oldest"];

  it("returns the first entry when nothing is selected and moving next", () => {
    expect(moveTimelineStreamSelection(entryIds, undefined, "next")).toBe("newest");
  });

  it("returns the last entry when nothing is selected and moving previous", () => {
    expect(moveTimelineStreamSelection(entryIds, undefined, "previous")).toBe("oldest");
  });

  it("moves toward older entries on next", () => {
    expect(moveTimelineStreamSelection(entryIds, "newest", "next")).toBe("middle");
    expect(moveTimelineStreamSelection(entryIds, "middle", "next")).toBe("oldest");
  });

  it("moves toward newer entries on previous", () => {
    expect(moveTimelineStreamSelection(entryIds, "oldest", "previous")).toBe("middle");
    expect(moveTimelineStreamSelection(entryIds, "middle", "previous")).toBe("newest");
  });

  it("clamps at the ends of the list", () => {
    expect(moveTimelineStreamSelection(entryIds, "oldest", "next")).toBe("oldest");
    expect(moveTimelineStreamSelection(entryIds, "newest", "previous")).toBe("newest");
  });

  it("falls back to the first entry when the current id is missing", () => {
    expect(moveTimelineStreamSelection(entryIds, "missing", "next")).toBe("newest");
  });
});

describe("resolveTimelineStreamSelection", () => {
  const entryIds = ["a", "b"];

  it("prefers the parent selection when it is still visible", () => {
    expect(resolveTimelineStreamSelection(entryIds, "b", "a")).toBe("b");
  });

  it("falls back to local selection when parent selection is filtered out", () => {
    expect(resolveTimelineStreamSelection(entryIds, "missing", "a")).toBe("a");
  });

  it("returns undefined when nothing visible is selected", () => {
    expect(resolveTimelineStreamSelection(entryIds, "missing", undefined)).toBeUndefined();
  });
});
