"use client";

import type { Note } from "@/features/wall/types";

export type WallTimelineMetric = "created" | "updated";

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
};

const cardWidth = 232;
const laneGap = 228;
const startOffset = 120;
const endOffset = 180;
const minimumSpread = 220;
const minimumCanvasWidth = 1200;
const minimumTimelineSpread = 480;

const readTimestamp = (note: Note, metric: WallTimelineMetric) => (metric === "updated" ? note.updatedAt : note.createdAt);

export const buildWallTimelineLayout = (notes: Note[], metric: WallTimelineMetric = "created"): WallTimelineLayout => {
  const sorted = [...notes]
    .filter((note) => !note.deletedAt)
    .sort((left, right) => {
      const delta = readTimestamp(left, metric) - readTimestamp(right, metric);
      if (delta !== 0) {
        return delta;
      }
      return left.createdAt - right.createdAt;
    });

  if (sorted.length === 0) {
    const now = Date.now();
    return {
      items: [],
      minTs: now,
      maxTs: now,
      contentWidth: minimumCanvasWidth,
      laneCount: 1,
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

    let lane = laneLastX.findIndex((lastX) => targetX - lastX >= cardWidth + 36);
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

  const rightEdge = items.reduce((max, item) => Math.max(max, item.x + cardWidth), startOffset + cardWidth);

  return {
    items,
    minTs,
    maxTs,
    contentWidth: Math.max(minimumCanvasWidth, rightEdge + endOffset),
    laneCount: Math.max(1, laneLastX.length),
  };
};

export const wallTimelineCardWidth = cardWidth;
export const wallTimelineLaneGap = laneGap;
