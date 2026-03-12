"use client";

import type { Note } from "@/features/wall/types";

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

export const buildWallTimelineLayout = (notes: Note[]): WallTimelineLayout => {
  const sorted = [...notes]
    .filter((note) => !note.deletedAt)
    .sort((left, right) => {
      const delta = left.createdAt - right.createdAt;
      if (delta !== 0) {
        return delta;
      }
      return left.updatedAt - right.updatedAt;
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

  const minTs = sorted[0]?.createdAt ?? Date.now();
  const maxTs = sorted[sorted.length - 1]?.createdAt ?? minTs;
  const timeSpan = Math.max(1, maxTs - minTs);
  const laneLastX: number[] = [];

  const items = sorted.map((note, index) => {
    const normalized = timeSpan === 0 ? index / Math.max(1, sorted.length - 1) : (note.createdAt - minTs) / timeSpan;
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
      ts: note.createdAt,
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
