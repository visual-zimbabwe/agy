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
});
