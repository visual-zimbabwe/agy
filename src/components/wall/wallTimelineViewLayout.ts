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
  lane: number;
};

export type WallTimelineLayout = {
  items: WallTimelineItem[];
  minTs: number;
  maxTs: number;
  contentWidth: number;
  laneCount: number;
  cardWidth: number;
  laneGap: number;
};

const startOffset = 120;
const endOffset = 180;
const minimumCanvasWidth = 1200;

const densityConfig: Record<WallTimelineDensity, { cardWidth: number; laneGap: number; minimumSpread: number; minimumTimelineSpread: number }> = {
  compact: {
    cardWidth: 204,
    laneGap: 204,
    minimumSpread: 188,
    minimumTimelineSpread: 420,
  },
  comfortable: {
    cardWidth: 232,
    laneGap: 228,
    minimumSpread: 220,
    minimumTimelineSpread: 480,
  },
  expanded: {
    cardWidth: 272,
    laneGap: 250,
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
      laneCount: 1,
      cardWidth: config.cardWidth,
      laneGap: config.laneGap,
    };
  }

  const minTs = readTimestamp(sorted[0]!, metric);
  const maxTs = readTimestamp(sorted[sorted.length - 1]!, metric);
  const timeSpan = Math.max(1, maxTs - minTs);
  const laneLastX: number[] = [];

  const items = sorted.map((note, index) => {
    const timestamp = readTimestamp(note, metric);
    const normalized = timeSpan === 0 ? index / Math.max(1, sorted.length - 1) : (timestamp - minTs) / timeSpan;
    const targetX = startOffset + normalized * Math.max(minimumSpread * Math.max(sorted.length - 1, 1), minimumTimelineSpread);

    let lane = laneLastX.findIndex((lastX) => targetX - lastX >= config.cardWidth + 36);
    if (lane < 0) {
      lane = laneLastX.length;
      laneLastX.push(Number.NEGATIVE_INFINITY);
    }

    const previousX = laneLastX[lane] ?? Number.NEGATIVE_INFINITY;
    const x = Number.isFinite(previousX) ? Math.max(targetX, previousX + minimumSpread) : targetX;
    laneLastX[lane] = x;

    return {
      id: note.id,
      note,
      ts: timestamp,
      x,
      lane,
    };
  });

  const rightEdge = items.reduce((max, item) => Math.max(max, item.x + config.cardWidth), startOffset + config.cardWidth);

  return {
    items,
    minTs,
    maxTs,
    contentWidth: Math.max(minimumCanvasWidth, rightEdge + endOffset),
    laneCount: Math.max(1, laneLastX.length),
    cardWidth: config.cardWidth,
    laneGap: config.laneGap,
  };
};
