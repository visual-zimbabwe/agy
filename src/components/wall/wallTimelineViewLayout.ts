"use client";

import type { Note } from "@/features/wall/types";

export type WallTimelineMetric = "created" | "updated";
export type WallTimelineDensity = "compact" | "comfortable" | "expanded";
export type WallTimelineZoom = "far" | "balanced" | "close";

export type WallTimelineItem = {
  id: string;
  note: Note;
  ts: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  lane: number;
};

export type WallTimelineLayout = {
  items: WallTimelineItem[];
  minTs: number;
  maxTs: number;
  contentWidth: number;
  contentHeight: number;
  laneCount: number;
  maxItemWidth: number;
};

const startOffset = 120;
const endOffset = 180;
const minimumCanvasWidth = 1200;
const topOffset = 146;
const bottomPadding = 84;

const densityConfig: Record<WallTimelineDensity, { horizontalGap: number; verticalGap: number; minimumSpread: number; minimumTimelineSpread: number }> = {
  compact: {
    horizontalGap: 28,
    verticalGap: 28,
    minimumSpread: 188,
    minimumTimelineSpread: 420,
  },
  comfortable: {
    horizontalGap: 40,
    verticalGap: 40,
    minimumSpread: 220,
    minimumTimelineSpread: 480,
  },
  expanded: {
    horizontalGap: 56,
    verticalGap: 56,
    minimumSpread: 260,
    minimumTimelineSpread: 560,
  },
};

const zoomSpreadMultiplier: Record<WallTimelineZoom, number> = {
  far: 0.72,
  balanced: 1,
  close: 1.32,
};

const readTimestamp = (note: Note, metric: WallTimelineMetric) => (metric === "updated" ? note.updatedAt : note.createdAt);

export const buildWallTimelineLayout = (
  notes: Note[],
  metric: WallTimelineMetric = "created",
  density: WallTimelineDensity = "comfortable",
  zoom: WallTimelineZoom = "balanced",
): WallTimelineLayout => {
  const sorted = [...notes]
    .filter((note) => !note.deletedAt)
    .sort((left, right) => {
      const delta = readTimestamp(left, metric) - readTimestamp(right, metric);
      if (delta !== 0) {
        return delta;
      }
      return left.createdAt - right.createdAt;
    });

  const config = densityConfig[density];
  const spreadMultiplier = zoomSpreadMultiplier[zoom];
  const minimumSpread = Math.max(140, Math.round(config.minimumSpread * spreadMultiplier));
  const minimumTimelineSpread = Math.max(320, Math.round(config.minimumTimelineSpread * spreadMultiplier));

  if (sorted.length === 0) {
    const now = Date.now();
    return {
      items: [],
      minTs: now,
      maxTs: now,
      contentWidth: minimumCanvasWidth,
      contentHeight: topOffset + bottomPadding + 220,
      laneCount: 1,
      maxItemWidth: 0,
    };
  }

  const minTs = readTimestamp(sorted[0]!, metric);
  const maxTs = readTimestamp(sorted[sorted.length - 1]!, metric);
  const timeSpan = Math.max(1, maxTs - minTs);
  const laneRightEdges: number[] = [];
  const laneHeights: number[] = [];

  const unpositioned = sorted.map((note, index) => {
    const timestamp = readTimestamp(note, metric);
    const normalized = timeSpan === 0 ? index / Math.max(1, sorted.length - 1) : (timestamp - minTs) / timeSpan;
    const targetX = startOffset + normalized * Math.max(minimumSpread * Math.max(sorted.length - 1, 1), minimumTimelineSpread);
    const width = Math.max(72, Math.round(note.w));
    const height = Math.max(72, Math.round(note.h));

    let lane = laneRightEdges.findIndex((rightEdge) => targetX >= rightEdge + config.horizontalGap);
    if (lane < 0) {
      lane = laneRightEdges.length;
      laneRightEdges.push(Number.NEGATIVE_INFINITY);
      laneHeights.push(0);
    }

    const previousRight = laneRightEdges[lane] ?? Number.NEGATIVE_INFINITY;
    const x = Number.isFinite(previousRight) ? Math.max(targetX, previousRight + config.horizontalGap) : targetX;
    laneRightEdges[lane] = x + width;
    laneHeights[lane] = Math.max(laneHeights[lane] ?? 0, height);

    return {
      id: note.id,
      note,
      ts: timestamp,
      x,
      width,
      height,
      lane,
    };
  });

  const laneTops = laneHeights.reduce<number[]>((tops, height, index) => {
    if (index === 0) {
      tops.push(topOffset);
      return tops;
    }
    const previousTop = tops[index - 1] ?? topOffset;
    const previousHeight = laneHeights[index - 1] ?? 0;
    tops.push(previousTop + previousHeight + config.verticalGap);
    return tops;
  }, []);

  const items: WallTimelineItem[] = unpositioned.map((item) => ({
    ...item,
    y: laneTops[item.lane] ?? topOffset,
    centerX: item.x + item.width / 2,
  }));

  const rightEdge = items.reduce((max, item) => Math.max(max, item.x + item.width), startOffset);
  const maxBottom = items.reduce((max, item) => Math.max(max, item.y + item.height), topOffset);
  const maxItemWidth = items.reduce((max, item) => Math.max(max, item.width), 0);

  return {
    items,
    minTs,
    maxTs,
    contentWidth: Math.max(minimumCanvasWidth, rightEdge + endOffset),
    contentHeight: Math.max(topOffset + bottomPadding + 220, maxBottom + bottomPadding),
    laneCount: Math.max(1, laneHeights.length),
    maxItemWidth,
  };
};
