import { describe, expect, it } from "vitest";

import type { PersistedWallState } from "@/features/wall/types";
import {
  alignBoundsToWallTile,
  createViewportWallBounds,
  filterLinksToVisibleNoteIds,
  filterNotesToWallBounds,
  filterZonesToWallBounds,
  getAdaptiveWallOverscanWorldPx,
  getWallRenderDetailLevel,
  mergeWallWindowIntoSnapshot,
} from "@/features/wall/windowing";

describe("wall windowing", () => {
  it("derives world bounds from camera and viewport", () => {
    const bounds = createViewportWallBounds({ x: -200, y: -100, zoom: 2 }, { w: 400, h: 300 }, 50);

    expect(bounds).toEqual({
      minX: 75,
      minY: 25,
      maxX: 325,
      maxY: 225,
    });
  });

  it("filters notes and zones by overlap with the viewport bounds", () => {
    const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const notes = [
      { id: "inside", x: 10, y: 10, w: 30, h: 30 },
      { id: "touching", x: 90, y: 90, w: 20, h: 20 },
      { id: "outside", x: 140, y: 10, w: 20, h: 20 },
    ];
    const zones = [
      { id: "zone-1", x: -20, y: 20, w: 30, h: 30 },
      { id: "zone-2", x: 150, y: 150, w: 20, h: 20 },
    ];

    expect(filterNotesToWallBounds(notes, bounds).map((note) => note.id)).toEqual(["inside", "touching"]);
    expect(filterZonesToWallBounds(zones, bounds).map((zone) => zone.id)).toEqual(["zone-1"]);
  });

  it("filters links to those fully connected inside the visible note set", () => {
    const links = [
      { id: "keep", fromNoteId: "a", toNoteId: "b" },
      { id: "drop", fromNoteId: "a", toNoteId: "c" },
    ];

    expect(filterLinksToVisibleNoteIds(links, new Set(["a", "b"])).map((link) => link.id)).toEqual(["keep"]);
  });

  it("adapts overscan and render detail level for zoomed-out walls", () => {
    expect(getAdaptiveWallOverscanWorldPx(0.35, 320)).toBe(128);
    expect(getAdaptiveWallOverscanWorldPx(2, 320)).toBe(432);
    expect(getWallRenderDetailLevel(0.35, 24)).toBe("ambient");
    expect(getWallRenderDetailLevel(0.8, 90)).toBe("summary");
    expect(getWallRenderDetailLevel(1.2, 18)).toBe("full");
  });

  it("aligns viewport bounds to stable window tiles", () => {
    expect(
      alignBoundsToWallTile({
        minX: 120,
        minY: -50,
        maxX: 2610,
        maxY: 2501,
      }),
    ).toEqual({
      minX: 0,
      minY: -2400,
      maxX: 4800,
      maxY: 4800,
    });
  });

  it("merges a window snapshot into an existing normalized snapshot with last-write-wins semantics", () => {
    const base: PersistedWallState = {
      notes: {
        a: {
          id: "a",
          text: "Old",
          tags: [],
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          color: "#fff",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
      lastColor: "#fff",
    };
    const windowSnapshot: PersistedWallState = {
      notes: {
        a: {
          id: "a",
          text: "Stale",
          tags: [],
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          color: "#fff",
          createdAt: 1,
          updatedAt: 0,
        },
        b: {
          id: "b",
          text: "Added",
          tags: [],
          x: 20,
          y: 20,
          w: 10,
          h: 10,
          color: "#eee",
          createdAt: 2,
          updatedAt: 2,
        },
      },
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 20, y: 30, zoom: 1.2 },
      lastColor: "#eee",
    };

    const merged = mergeWallWindowIntoSnapshot(base, windowSnapshot);

    expect(merged.notes.a?.text).toBe("Old");
    expect(merged.notes.b?.text).toBe("Added");
    expect(merged.camera).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(merged.lastColor).toBe("#eee");
  });
});
