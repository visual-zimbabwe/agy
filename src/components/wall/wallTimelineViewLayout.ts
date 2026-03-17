"use client";

import { makeBucketKey, type TimelineBucketMode } from "@/components/wall/wallTimelineViewHelpers";
import type { Note } from "@/features/wall/types";

export type WallTimelineSort = "created" | "updated";
export type WallTimelineCardSize = "small" | "medium" | "large";
export type WallTimelineZoom = "overview" | "standard" | "detail";
export type WallTimelineViewMode = "stream" | "buckets";

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
  bucketKey: string;
};

export type WallTimelineBucketLayout = {
  key: string;
  label: string;
  count: number;
  startX: number;
  endX: number;
  centerX: number;
  timestamp: number;
};

export type WallTimelineLayout = {
  items: WallTimelineItem[];
  buckets: WallTimelineBucketLayout[];
  minTs: number;
  maxTs: number;
  contentWidth: number;
  contentHeight: number;
  laneCount: number;
  maxItemWidth: number;
};

export type BuildWallTimelineLayoutOptions = {
  sort?: WallTimelineSort;
  cardSize?: WallTimelineCardSize;
  zoom?: WallTimelineZoom;
  viewMode?: WallTimelineViewMode;
  groupBy?: TimelineBucketMode;
  viewportWidth?: number;
  fitAll?: boolean;
};

const startOffset = 132;
const endOffset = 224;
const minimumCanvasWidth = 1200;
const topOffset = 164;
const bottomPadding = 120;

const sizeConfig: Record<WallTimelineCardSize, { scale: number; horizontalGap: number; verticalGap: number; minimumSpread: number; minimumTimelineSpread: number }> = {
  small: {
    scale: 0.7,
    horizontalGap: 24,
    verticalGap: 26,
    minimumSpread: 172,
    minimumTimelineSpread: 420,
  },
  medium: {
    scale: 0.84,
    horizontalGap: 34,
    verticalGap: 34,
    minimumSpread: 220,
    minimumTimelineSpread: 540,
  },
  large: {
    scale: 1,
    horizontalGap: 48,
    verticalGap: 46,
    minimumSpread: 272,
    minimumTimelineSpread: 700,
  },
};

const zoomSpreadMultiplier: Record<WallTimelineZoom, number> = {
  overview: 0.68,
  standard: 1,
  detail: 1.46,
};

const readTimestamp = (note: Note, sort: WallTimelineSort) => (sort === "updated" ? note.updatedAt : note.createdAt);

const clampDimension = (value: number, minimum: number) => Math.max(minimum, Math.round(value));

const buildBucketedTargets = (
  sorted: Note[],
  readTs: (note: Note) => number,
  groupBy: TimelineBucketMode,
  minimumSpread: number,
  fitWidth: number,
) => {
  const buckets = new Map<string, { timestamp: number; noteIds: string[] }>();
  for (const note of sorted) {
    const ts = readTs(note);
    const key = makeBucketKey(ts, groupBy);
    const current = buckets.get(key);
    if (current) {
      current.noteIds.push(note.id);
      current.timestamp = Math.min(current.timestamp, ts);
      continue;
    }
    buckets.set(key, { timestamp: ts, noteIds: [note.id] });
  }

  const entries = [...buckets.entries()].sort((left, right) => left[1].timestamp - right[1].timestamp);
  const sectionGap = Math.max(80, Math.round(minimumSpread * 0.65));
  const usableWidth = Math.max(fitWidth, minimumCanvasWidth - startOffset - endOffset);
  const minSectionWidth = Math.max(220, Math.round(usableWidth / Math.max(entries.length, 1)));

  let cursor = startOffset;
  const targetById = new Map<string, number>();

  for (const [, bucket] of entries) {
    const sectionWidth = Math.max(minSectionWidth, minimumSpread + (bucket.noteIds.length - 1) * Math.max(42, Math.round(minimumSpread * 0.36)));
    const step = bucket.noteIds.length <= 1 ? 0 : Math.max(42, (sectionWidth - minimumSpread) / (bucket.noteIds.length - 1));
    bucket.noteIds.forEach((id, index) => {
      targetById.set(id, cursor + minimumSpread / 2 + index * step);
    });
    cursor += sectionWidth + sectionGap;
  }

  return targetById;
};

export const buildWallTimelineLayout = (
  notes: Note[],
  options: BuildWallTimelineLayoutOptions = {},
): WallTimelineLayout => {
  const {
    sort = "created",
    cardSize = "medium",
    zoom = "standard",
    viewMode = "stream",
    groupBy = "week",
    viewportWidth = minimumCanvasWidth,
    fitAll = false,
  } = options;

  const sorted = [...notes]
    .filter((note) => !note.deletedAt)
    .sort((left, right) => {
      const delta = readTimestamp(left, sort) - readTimestamp(right, sort);
      if (delta !== 0) {
        return delta;
      }
      return left.createdAt - right.createdAt;
    });

  const config = sizeConfig[cardSize];
  const spreadMultiplier = zoomSpreadMultiplier[zoom];
  const fitWidth = Math.max(420, viewportWidth - startOffset - endOffset);
  const minimumSpread = Math.max(120, Math.round(config.minimumSpread * spreadMultiplier));
  const minimumTimelineSpread = fitAll
    ? Math.max(280, Math.round(fitWidth))
    : Math.max(360, Math.round(config.minimumTimelineSpread * spreadMultiplier));

  if (sorted.length === 0) {
    const now = Date.now();
    return {
      items: [],
      buckets: [],
      minTs: now,
      maxTs: now,
      contentWidth: minimumCanvasWidth,
      contentHeight: topOffset + bottomPadding + 280,
      laneCount: 1,
      maxItemWidth: 0,
    };
  }

  const minTs = readTimestamp(sorted[0]!, sort);
  const maxTs = readTimestamp(sorted[sorted.length - 1]!, sort);
  const timeSpan = Math.max(1, maxTs - minTs);
  const laneRightEdges: number[] = [];
  const laneHeights: number[] = [];
  const bucketTargets = viewMode === "buckets"
    ? buildBucketedTargets(sorted, (note) => readTimestamp(note, sort), groupBy, minimumSpread, fitWidth)
    : null;

  const unpositioned = sorted.map((note, index) => {
    const timestamp = readTimestamp(note, sort);
    const normalized = timeSpan === 0 ? index / Math.max(1, sorted.length - 1) : (timestamp - minTs) / timeSpan;
    const targetX = bucketTargets
      ? bucketTargets.get(note.id) ?? startOffset
      : startOffset + normalized * Math.max(minimumSpread * Math.max(sorted.length - 1, 1), minimumTimelineSpread);
    const width = clampDimension(note.w * config.scale, 144);
    const height = clampDimension(note.h * config.scale, 116);
    const bucketKey = makeBucketKey(timestamp, groupBy);

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
      bucketKey,
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

  const bucketMap = new Map<string, WallTimelineBucketLayout>();
  for (const item of items) {
    const existing = bucketMap.get(item.bucketKey);
    if (existing) {
      existing.startX = Math.min(existing.startX, item.x - 30);
      existing.endX = Math.max(existing.endX, item.x + item.width + 30);
      existing.centerX = (existing.startX + existing.endX) / 2;
      existing.count += 1;
      continue;
    }
    bucketMap.set(item.bucketKey, {
      key: item.bucketKey,
      label: "",
      count: 1,
      startX: item.x - 30,
      endX: item.x + item.width + 30,
      centerX: item.centerX,
      timestamp: item.ts,
    });
  }

  const buckets = [...bucketMap.values()].sort((left, right) => left.timestamp - right.timestamp);
  const rightEdge = items.reduce((max, item) => Math.max(max, item.x + item.width), startOffset);
  const maxBottom = items.reduce((max, item) => Math.max(max, item.y + item.height), topOffset);
  const maxItemWidth = items.reduce((max, item) => Math.max(max, item.width), 0);

  return {
    items,
    buckets,
    minTs,
    maxTs,
    contentWidth: Math.max(minimumCanvasWidth, rightEdge + endOffset),
    contentHeight: Math.max(topOffset + bottomPadding + 260, maxBottom + bottomPadding),
    laneCount: Math.max(1, laneHeights.length),
    maxItemWidth,
  };
};
