"use client";

import type { Note } from "@/features/wall/types";

export type WallPreviewSurface = "wall" | "timeline-stream" | "timeline-canvas" | "timeline-detail";
export type WallPreviewScale = "small" | "medium" | "large";

export type WallPreviewDimensions = {
  width: number;
  height: number;
  scale: number;
};

type ResolveWallPreviewDimensionsOptions = {
  surface: WallPreviewSurface;
  previewScale?: WallPreviewScale;
  maxWidth?: number;
  maxHeight?: number;
};

const minimumDimensionsBySurface: Record<WallPreviewSurface, { width: number; height: number }> = {
  wall: { width: 1, height: 1 },
  "timeline-stream": { width: 220, height: 170 },
  "timeline-canvas": { width: 144, height: 116 },
  "timeline-detail": { width: 260, height: 220 },
};

const timelineCanvasScaleByPreviewScale: Record<WallPreviewScale, number> = {
  small: 0.7,
  medium: 0.84,
  large: 1,
};

const clampBaseDimension = (value: number, minimum: number) => Math.max(minimum, Math.round(value));

export const resolveWallPreviewDimensions = (
  note: Pick<Note, "w" | "h">,
  options: ResolveWallPreviewDimensionsOptions,
): WallPreviewDimensions => {
  const { surface, previewScale = "large" } = options;
  const minimum = minimumDimensionsBySurface[surface];
  const intrinsicWidth = clampBaseDimension(note.w, minimum.width);
  const intrinsicHeight = clampBaseDimension(note.h, minimum.height);
  if (surface === "timeline-canvas") {
    const baseScale = timelineCanvasScaleByPreviewScale[previewScale];
    return {
      width: Math.max(minimum.width, Math.round(intrinsicWidth * baseScale)),
      height: Math.max(minimum.height, Math.round(intrinsicHeight * baseScale)),
      scale: baseScale,
    };
  }

  return {
    width: intrinsicWidth,
    height: intrinsicHeight,
    scale: 1,
  };
};
