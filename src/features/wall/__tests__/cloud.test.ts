import { describe, expect, it } from "vitest";

import { rowsToSnapshot } from "@/features/wall/cloud";
import { NOTE_DEFAULTS } from "@/features/wall/constants";

describe("cloud rows mapping", () => {
  it("maps persisted note formatting fields from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "n1",
          text: "Hello",
          image_url: "https://example.com/img.png",
          text_align: "center",
          text_v_align: "middle",
          text_font: "inter",
          text_color: "#112233",
          tags: ["one"],
          text_size: "px:20",
          x: 10,
          y: 20,
          w: 200,
          h: 140,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const note = snapshot.notes.n1;
    expect(note?.textAlign).toBe("center");
    expect(note?.textVAlign).toBe("middle");
    expect(note?.textFont).toBe("inter");
    expect(note?.textColor).toBe("#112233");
    expect(note?.imageUrl).toBe("https://example.com/img.png");
    expect(note?.textSizePx).toBe(20);
  });

  it("falls back to defaults when cloud rows are missing formatting fields", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "n1",
          text: "Hello",
          tags: [],
          text_size: null,
          x: 0,
          y: 0,
          w: 200,
          h: 140,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const note = snapshot.notes.n1;
    expect(note?.textAlign).toBe("left");
    expect(note?.textVAlign).toBe(NOTE_DEFAULTS.textVAlign);
    expect(note?.textColor).toBe(NOTE_DEFAULTS.textColor);
    expect(note?.textFont).toBe("nunito");
  });

  it("maps note groups and note state fields from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "n1",
          text: "Pinned",
          pinned: true,
          highlighted: true,
          tags: [],
          text_size: null,
          x: 0,
          y: 0,
          w: 200,
          h: 140,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [
        {
          id: "g1",
          label: "Group",
          color: "#C7D2FE",
          note_ids: ["n1"],
          collapsed: false,
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      links: [],
    });

    expect(snapshot.notes.n1?.pinned).toBe(true);
    expect(snapshot.notes.n1?.highlighted).toBe(true);
    expect(snapshot.noteGroups.g1?.noteIds).toEqual(["n1"]);
  });

  it("maps vocabulary payload from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "v1",
          text: "cogent",
          vocabulary: {
            word: "cogent",
            sourceContext: "The argument was cogent.",
            guessMeaning: "clear",
            meaning: "convincing and clear",
            ownSentence: "Her point was cogent.",
            flipped: true,
            nextReviewAt: 1000,
            lastReviewedAt: 900,
            intervalDays: 3,
            reviewsCount: 2,
            lapses: 1,
            isFocus: false,
            lastOutcome: "good",
          },
          tags: ["vocab"],
          text_size: null,
          x: 0,
          y: 0,
          w: 200,
          h: 140,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const vocabulary = snapshot.notes.v1?.vocabulary;
    expect(vocabulary?.word).toBe("cogent");
    expect(vocabulary?.flipped).toBe(true);
    expect(vocabulary?.lastOutcome).toBe("good");
  });

  it("maps quote note metadata from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "q1",
          note_kind: "quote",
          text: "The only way out is through.",
          quote_author: "Robert Frost",
          quote_source: "A Servant to Servants",
          tags: ["quote"],
          text_size: null,
          x: 0,
          y: 0,
          w: 220,
          h: 160,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const quote = snapshot.notes.q1;
    expect(quote?.noteKind).toBe("quote");
    expect(quote?.quoteAuthor).toBe("Robert Frost");
    expect(quote?.quoteSource).toBe("A Servant to Servants");
  });

  it("maps journal note metadata from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "j1",
          note_kind: "journal",
          text: "Monday, March 16",
          text_font: "patrick_hand",
          tags: ["journal"],
          text_size: "px:18",
          x: 0,
          y: 0,
          w: 250,
          h: 208,
          color: "#F6EEDC",
          created_at: "2026-03-16T08:00:00.000Z",
          updated_at: "2026-03-16T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const journal = snapshot.notes.j1;
    expect(journal?.noteKind).toBe("journal");
    expect(journal?.textFont).toBe("patrick_hand");
  });

  it("maps canon note metadata from cloud rows", () => {
    const snapshot = rowsToSnapshot({
      wall: { camera_x: 0, camera_y: 0, camera_zoom: 1, last_color: null },
      notes: [
        {
          id: "c1",
          note_kind: "canon",
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
          text_size: null,
          x: 0,
          y: 0,
          w: 220,
          h: 160,
          color: "#FEEA89",
          created_at: "2026-02-14T08:00:00.000Z",
          updated_at: "2026-02-14T09:00:00.000Z",
        },
      ],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links: [],
    });

    const canon = snapshot.notes.c1;
    expect(canon?.noteKind).toBe("canon");
    expect(canon?.canon?.mode).toBe("list");
    expect(canon?.canon?.title).toBe("Ten Commandments");
    expect(canon?.canon?.items).toHaveLength(2);
  });
});
