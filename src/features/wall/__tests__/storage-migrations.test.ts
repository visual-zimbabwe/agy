import { describe, expect, it } from "vitest";

import { normalizePersistedWallState, parseTimelinePayload } from "@/features/wall/storage-migrations";

describe("storage migrations", () => {
  it("normalizes legacy snapshots without links/zoneGroups and note defaults", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        n1: {
          id: "n1",
          text: "Legacy note",
          x: 10,
          y: 20,
          w: 200,
          h: 140,
          color: "#fff",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized).toBeTruthy();
    if (!normalized) {
      return;
    }
    expect(normalized.zoneGroups).toEqual({});
    expect(normalized.noteGroups).toEqual({});
    expect(normalized.links).toEqual({});
    expect(normalized.notes.n1?.tags).toEqual([]);
    expect(normalized.notes.n1?.textVAlign).toBe("top");
    expect(normalized.notes.n1?.textColor).toBe("#1F2937");
    expect(normalized.notes.n1?.textSize).toBe("md");
    expect(normalized.zones).toEqual({});
  });

  it("accepts array-based entity payloads for compatibility", () => {
    const normalized = normalizePersistedWallState({
      notes: [
        {
          id: "note-1",
          text: "array note",
          tags: ["a"],
          textSize: "lg",
          x: 0,
          y: 0,
          w: 200,
          h: 150,
          color: "#abc",
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
      camera: { x: 5, y: 6, zoom: 1.2 },
      lastColor: "#abc",
    });

    expect(normalized?.notes["note-1"]?.text).toBe("array note");
    expect(normalized?.lastColor).toBe("#abc");
  });

  it("rounds fractional text sizes from legacy local snapshots", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        n1: {
          id: "n1",
          text: "Sized note",
          textSizePx: 17.6,
          x: 10,
          y: 20,
          w: 200,
          h: 140,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.n1?.textSizePx).toBe(18);
  });

  it("defaults legacy zones to frame kind and preserves explicit kind", () => {
    const normalized = normalizePersistedWallState({
      notes: {},
      zones: {
        z1: {
          id: "z1",
          label: "Legacy Zone",
          x: 10,
          y: 20,
          w: 300,
          h: 200,
          color: "#fff",
          createdAt: 1,
          updatedAt: 2,
        },
        z2: {
          id: "z2",
          label: "Column Zone",
          kind: "column",
          x: 20,
          y: 30,
          w: 280,
          h: 400,
          color: "#eee",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.zones.z1?.kind).toBe("frame");
    expect(normalized?.zones.z2?.kind).toBe("column");
  });

  it("parses timeline payload and rejects malformed JSON", () => {
    const valid = parseTimelinePayload(
      JSON.stringify({
        notes: {},
        zones: {},
        zoneGroups: {},
        noteGroups: {},
        links: {},
        camera: { x: 0, y: 0, zoom: 1 },
      }),
    );
    const invalid = parseTimelinePayload("{broken");

    expect(valid).toBeTruthy();
    expect(invalid).toBeNull();
  });

  it("preserves vocabulary note metadata when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        v1: {
          id: "v1",
          text: "cogent",
          tags: ["vocab"],
          x: 0,
          y: 0,
          w: 220,
          h: 160,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 2,
          vocabulary: {
            word: "cogent",
            sourceContext: "The argument felt cogent.",
            guessMeaning: "clear",
            meaning: "convincing and clear",
            ownSentence: "Her essay was cogent and easy to follow.",
            flipped: true,
            nextReviewAt: 1000,
            lastReviewedAt: 900,
            intervalDays: 3,
            reviewsCount: 2,
            lapses: 1,
            isFocus: false,
            lastOutcome: "good",
          },
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.v1?.vocabulary?.word).toBe("cogent");
    expect(normalized?.notes.v1?.vocabulary?.nextReviewAt).toBe(1000);
    expect(normalized?.notes.v1?.vocabulary?.lastOutcome).toBe("good");
    expect(normalized?.notes.v1?.vocabulary?.flipped).toBe(true);
  });

  it("normalizes quote note metadata when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        q1: {
          id: "q1",
          noteKind: "quote",
          text: "Stay hungry, stay foolish.",
          quoteAuthor: "Steve Jobs",
          quoteSource: "Stanford Commencement, 2005",
          tags: ["quote"],
          x: 0,
          y: 0,
          w: 220,
          h: 160,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.q1?.noteKind).toBe("quote");
    expect(normalized?.notes.q1?.quoteAuthor).toBe("Steve Jobs");
    expect(normalized?.notes.q1?.quoteSource).toBe("Stanford Commencement, 2005");
  });

  it("preserves throne note kind when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        t1: {
          id: "t1",
          noteKind: "throne",
          text: "There are no men like me. Only me.",
          quoteAuthor: "Jaime Lannister",
          quoteSource: "House Lannister",
          x: 20,
          y: 30,
          w: 240,
          h: 184,
          color: "#FF2400",
          createdAt: 1000,
          updatedAt: 2000,
          tags: ["throne", "quote"],
        },
      },
      zones: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.t1?.noteKind).toBe("throne");
    expect(normalized?.notes.t1?.quoteAuthor).toBe("Jaime Lannister");
    expect(normalized?.notes.t1?.color).toBe("#FF2400");
  });

  it("normalizes journal note metadata when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        j1: {
          id: "j1",
          noteKind: "journal",
          text: "Monday notes",
          textFont: "patrick_hand",
          x: 0,
          y: 0,
          w: 250,
          h: 208,
          color: "#F6EEDC",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.j1?.noteKind).toBe("journal");
    expect(normalized?.notes.j1?.textFont).toBe("patrick_hand");
  });

  it("normalizes canon note metadata when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        c1: {
          id: "c1",
          noteKind: "canon",
          text: "",
          canon: {
            mode: "list",
            title: "Ten Commandments",
            statement: "",
            interpretation: "",
            example: "",
            source: "",
            items: [
              { id: "i1", title: "First", text: "No other gods before me.", interpretation: "Loyalty to one God." },
              { id: "i2", title: "Second", text: "No idols.", interpretation: "Avoid replacing worship with objects." },
            ],
          },
          tags: ["canon"],
          x: 0,
          y: 0,
          w: 220,
          h: 160,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.c1?.noteKind).toBe("canon");
    expect(normalized?.notes.c1?.canon?.mode).toBe("list");
    expect(normalized?.notes.c1?.canon?.items).toHaveLength(2);
  });

  it("normalizes poetry note payload when present", () => {
    const normalized = normalizePersistedWallState({
      notes: {
        p1: {
          id: "p1",
          noteKind: "poetry",
          text: "Hope is the thing with feathers",
          quoteAuthor: "Emily Dickinson",
          quoteSource: "PoetryDB",
          poetry: {
            status: "ready",
            dateKey: "2026-03-20",
            title: "'Hope' is the thing with feathers",
            author: "Emily Dickinson",
            lines: ["Hope is the thing with feathers", "That perches in the soul"],
            lineCount: 2,
            searchField: "author",
            searchQuery: "Emily Dickinson",
            matchType: "exact",
            fetchedAt: 10,
            lastSuccessAt: 10,
          },
          tags: ["poetry", "poem"],
          x: 0,
          y: 0,
          w: 320,
          h: 280,
          color: "#B73A3A",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });

    expect(normalized?.notes.p1?.noteKind).toBe("poetry");
    expect(normalized?.notes.p1?.poetry?.author).toBe("Emily Dickinson");
    expect(normalized?.notes.p1?.poetry?.lines).toEqual(["Hope is the thing with feathers", "That perches in the soul"]);
    expect(normalized?.notes.p1?.poetry?.searchField).toBe("author");
    expect(normalized?.notes.p1?.poetry?.searchQuery).toBe("Emily Dickinson");
    expect(normalized?.notes.p1?.poetry?.matchType).toBe("exact");
  });
});

