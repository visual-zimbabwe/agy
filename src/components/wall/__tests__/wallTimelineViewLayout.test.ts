import { describe, expect, it } from "vitest";

import { buildWallTimelineLayout } from "@/components/wall/wallTimelineViewLayout";
import type { Note } from "@/features/wall/types";

const makeNote = (id: string, createdAt: number, updatedAt = createdAt, size?: { w?: number; h?: number }): Note => ({
  id,
  text: `Note ${id}`,
  tags: [],
  x: 0,
  y: 0,
  w: size?.w ?? 240,
  h: size?.h ?? 180,
  color: "#FFE27A",
  createdAt,
  updatedAt,
});

describe("buildWallTimelineLayout", () => {
  it("sorts notes by creation time and grows left-to-right", () => {
    const layout = buildWallTimelineLayout([
      makeNote("late", 3000),
      makeNote("early", 1000),
      makeNote("mid", 2000),
    ]);

    expect(layout.items.map((item) => item.id)).toEqual(["early", "mid", "late"]);
    expect(layout.items[0]?.x).toBeLessThan(layout.items[1]?.x ?? 0);
    expect(layout.items[1]?.x).toBeLessThan(layout.items[2]?.x ?? 0);
  });

  it("can sort by updated time when requested", () => {
    const layout = buildWallTimelineLayout(
      [
        makeNote("first-created", 1000, 9000),
        makeNote("last-updated", 3000, 4000),
      ],
      { sort: "updated" },
    );

    expect(layout.items.map((item) => item.id)).toEqual(["last-updated", "first-created"]);
  });

  it("scales note dimensions using card size while preserving proportions", () => {
    const layout = buildWallTimelineLayout([
      makeNote("wide", 1000, 1000, { w: 420, h: 180 }),
      makeNote("tall", 2000, 2000, { w: 180, h: 320 }),
    ], { cardSize: "large" });
    const compact = buildWallTimelineLayout([
      makeNote("wide", 1000, 1000, { w: 420, h: 180 }),
      makeNote("tall", 2000, 2000, { w: 180, h: 320 }),
    ], { cardSize: "small" });

    expect(layout.items[0]?.width).toBe(420);
    expect(layout.items[1]?.height).toBe(320);
    expect(compact.items[0]?.width).toBeLessThan(layout.items[0]?.width ?? 0);
  });

  it("widens the timeline spread for detail zoom levels", () => {
    const notes = [
      makeNote("a", 1000),
      makeNote("b", 2000),
      makeNote("c", 3000),
    ];
    const overview = buildWallTimelineLayout(notes, { zoom: "overview" });
    const detail = buildWallTimelineLayout(notes, { zoom: "detail" });

    expect(overview.items[1]?.x).toBeLessThan(detail.items[1]?.x ?? 0);
    expect((overview.items[2]?.x ?? 0) - (overview.items[1]?.x ?? 0)).toBeLessThan((detail.items[2]?.x ?? 0) - (detail.items[1]?.x ?? 0));
  });

  it("moves dense notes onto separate lanes when notes would overlap", () => {
    const start = 1000;
    const layout = buildWallTimelineLayout([
      makeNote("a", start, start, { w: 360, h: 220 }),
      makeNote("b", start + 5, start + 5, { w: 340, h: 260 }),
      makeNote("c", start + 10, start + 10, { w: 380, h: 200 }),
    ]);

    expect(new Set(layout.items.map((item) => item.lane)).size).toBeGreaterThan(1);
    expect(layout.laneCount).toBeGreaterThan(1);
  });

  it("creates bucket sections when bucket mode is enabled", () => {
    const start = new Date("2026-01-01T00:00:00Z").getTime();
    const layout = buildWallTimelineLayout([
      makeNote("a", start),
      makeNote("b", start + 86_400_000 * 10),
      makeNote("c", start + 86_400_000 * 40),
    ], { viewMode: "buckets", groupBy: "month" });

    expect(layout.buckets.length).toBeGreaterThan(1);
    expect(layout.items[0]?.bucketKey).not.toBe(layout.items[2]?.bucketKey);
  });
});
