import { describe, expect, it } from "vitest";

import { buildWindowCandidateBounds, createWallWindowResponse } from "@/features/wall/spatial-read-model";

describe("wall spatial read model", () => {
  it("builds candidate bounds with an expanded leading margin", () => {
    expect(
      buildWindowCandidateBounds(
        {
          minX: 100,
          minY: 200,
          maxX: 500,
          maxY: 800,
        },
        240,
      ),
    ).toEqual({
      minX: -140,
      minY: -40,
      maxX: 500,
      maxY: 800,
    });
  });

  it("creates a filtered window response with counts and neighbor prefetch bounds", () => {
    const response = createWallWindowResponse({
      shell: {
        id: "wall-1",
        title: "Demo wall",
        camera: { x: 0, y: 0, zoom: 1 },
        syncVersion: 12,
      },
      wall: {
        camera_x: 0,
        camera_y: 0,
        camera_zoom: 1,
        last_color: "#ffeeaa",
      },
      bounds: {
        minX: 0,
        minY: 0,
        maxX: 500,
        maxY: 400,
      },
      candidateBounds: {
        minX: -200,
        minY: -200,
        maxX: 500,
        maxY: 400,
      },
      notes: [
        {
          id: "n1",
          note_kind: "image",
          text: "North",
          image_url: "https://example.com/image.png",
          tags: [],
          text_size: null,
          x: 20,
          y: 30,
          w: 120,
          h: 100,
          color: "#fff7ed",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "n2",
          text: "Center",
          tags: [],
          text_size: null,
          x: 220,
          y: 150,
          w: 140,
          h: 120,
          color: "#fef3c7",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "n3",
          text: "Outside",
          tags: [],
          text_size: null,
          x: -150,
          y: -120,
          w: 100,
          h: 90,
          color: "#fde68a",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
      ],
      zones: [
        {
          id: "z1",
          label: "Visible zone",
          kind: "frame",
          group_id: "zg1",
          x: 0,
          y: 0,
          w: 300,
          h: 220,
          color: "#e5e7eb",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "z2",
          label: "Offscreen zone",
          kind: "frame",
          group_id: "zg2",
          x: -180,
          y: -180,
          w: 40,
          h: 40,
          color: "#d1d5db",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
      ],
      zoneGroups: [
        {
          id: "zg1",
          label: "Visible groups",
          color: "#bfdbfe",
          zone_ids: ["z1"],
          collapsed: false,
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "zg2",
          label: "Hidden groups",
          color: "#cbd5e1",
          zone_ids: ["z2"],
          collapsed: false,
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
      ],
      noteGroups: [
        {
          id: "ng1",
          label: "Visible note group",
          color: "#fecaca",
          note_ids: ["n1", "n2"],
          collapsed: false,
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "ng2",
          label: "Offscreen note group",
          color: "#fecdd3",
          note_ids: ["n3"],
          collapsed: false,
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
      ],
      links: [
        {
          id: "l1",
          from_note_id: "n1",
          to_note_id: "n2",
          type: "wiki",
          label: "north -> center",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
        {
          id: "l2",
          from_note_id: "n1",
          to_note_id: "n3",
          type: "wiki",
          label: "north -> outside",
          created_at: "2026-04-02T00:00:00.000Z",
          updated_at: "2026-04-02T00:00:00.000Z",
        },
      ],
    });

    expect(Object.keys(response.snapshot.notes)).toEqual(["n1", "n2"]);
    expect(Object.keys(response.snapshot.zones)).toEqual(["z1"]);
    expect(Object.keys(response.snapshot.zoneGroups)).toEqual(["zg1"]);
    expect(Object.keys(response.snapshot.noteGroups)).toEqual(["ng1"]);
    expect(Object.keys(response.snapshot.links)).toEqual(["l1"]);
    expect(response.assets["n1:image"]?.kind).toBe("image");
    expect(response.readModel.counts).toEqual({
      candidateNotes: 3,
      candidateZones: 2,
      visibleNotes: 2,
      visibleZones: 1,
      visibleLinks: 1,
      visibleZoneGroups: 1,
      visibleNoteGroups: 1,
    });
    expect(response.readModel.prefetchBounds).toEqual([
      { minX: -500, minY: 0, maxX: 0, maxY: 400 },
      { minX: 500, minY: 0, maxX: 1000, maxY: 400 },
      { minX: 0, minY: -400, maxX: 500, maxY: 0 },
      { minX: 0, minY: 400, maxX: 500, maxY: 800 },
    ]);
  });
});
