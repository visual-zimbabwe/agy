import { describe, expect, it } from "vitest";

import { findOpenNotePosition } from "@/components/wall/wall-canvas-helpers";

const overlaps = (left: { x: number; y: number; w: number; h: number }, right: { x: number; y: number; w: number; h: number }, padding = 20) =>
  left.x < right.x + right.w + padding &&
  left.x + left.w + padding > right.x &&
  left.y < right.y + right.h + padding &&
  left.y + left.h + padding > right.y;

describe("findOpenNotePosition", () => {
  const camera = { x: 0, y: 0, zoom: 1 };
  const viewport = { w: 800, h: 600 };
  const size = { w: 220, h: 160 };

  it("returns the preferred position when it is already clear", () => {
    const position = findOpenNotePosition({
      camera,
      viewport,
      occupiedRects: [],
      preferred: { x: 120, y: 140 },
      size,
    });

    expect(position).toEqual({ x: 120, y: 140 });
  });

  it("finds a non-overlapping slot when the preferred area is occupied", () => {
    const occupied = [{ x: 120, y: 140, w: 220, h: 160 }];
    const position = findOpenNotePosition({
      camera,
      viewport,
      occupiedRects: occupied,
      preferred: { x: 120, y: 140 },
      size,
    });

    expect(position).not.toEqual({ x: 120, y: 140 });
    expect(overlaps({ ...position, ...size }, occupied[0]!)).toBe(false);
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
    expect(position.x + size.w).toBeLessThanOrEqual(viewport.w);
    expect(position.y + size.h).toBeLessThanOrEqual(viewport.h);
  });

  it("clamps oversized preferred positions back into the visible frame", () => {
    const position = findOpenNotePosition({
      camera,
      viewport,
      occupiedRects: [],
      preferred: { x: 760, y: 560 },
      size,
    });

    expect(position).toEqual({ x: 580, y: 440 });
  });
});
