import { describe, expect, it } from "vitest";

import { buildWallTimelineLayout } from "@/components/wall/wallTimelineViewLayout";
import type { Note } from "@/features/wall/types";

const makeNote = (id: string, createdAt: number): Note => ({
  id,
  text: `Note ${id}`,
  tags: [],
  x: 0,
  y: 0,
  w: 240,
  h: 180,
  color: "#FFE27A",
  createdAt,
  updatedAt: createdAt,
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

  it("moves dense notes onto separate lanes when cards would overlap", () => {
    const start = 1000;
    const layout = buildWallTimelineLayout([
      makeNote("a", start),
      makeNote("b", start + 5),
      makeNote("c", start + 10),
    ]);

    expect(new Set(layout.items.map((item) => item.lane)).size).toBeGreaterThan(1);
    expect(layout.laneCount).toBeGreaterThan(1);
  });
});
