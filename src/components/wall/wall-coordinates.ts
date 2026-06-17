"use client";

import type { Note, Zone } from "@/features/wall/types";
import { clamp } from "@/lib/wall-utils";

export type Bounds = { x: number; y: number; w: number; h: number };
type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };
type Rect = { x: number; y: number; w: number; h: number };

export const toWorldPoint = (screenX: number, screenY: number, camera: Camera) => ({
  x: (screenX - camera.x) / camera.zoom,
  y: (screenY - camera.y) / camera.zoom,
});

export const toScreenPoint = (worldX: number, worldY: number, camera: Camera) => ({
  x: worldX * camera.zoom + camera.x,
  y: worldY * camera.zoom + camera.y,
});

export const zoneContainsNote = (zone: Zone, note: Note) =>
  note.x < zone.x + zone.w &&
  note.x + note.w > zone.x &&
  note.y < zone.y + zone.h &&
  note.y + note.h > zone.y;

export const noteInAnyZone = (note: Note, zones: Zone[]) => zones.some((zone) => zoneContainsNote(zone, note));

export const fitBoundsCamera = (bounds: Bounds, viewport: Viewport, padding = 64) => {
  const width = Math.max(1, bounds.w + padding * 2);
  const height = Math.max(1, bounds.h + padding * 2);
  const zoom = clamp(Math.min(viewport.w / width, viewport.h / height), 0.2, 2.2);
  const centerX = bounds.x + bounds.w / 2;
  const centerY = bounds.y + bounds.h / 2;

  return {
    x: viewport.w / 2 - centerX * zoom,
    y: viewport.h / 2 - centerY * zoom,
    zoom,
  };
};

const clampRectToViewport = (rect: Rect, camera: Camera, viewport: Viewport) => {
  const viewportLeft = -camera.x / camera.zoom;
  const viewportTop = -camera.y / camera.zoom;
  const viewportRight = viewportLeft + viewport.w / camera.zoom;
  const viewportBottom = viewportTop + viewport.h / camera.zoom;

  const minX = viewportLeft;
  const minY = viewportTop;
  const maxX = Math.max(minX, viewportRight - rect.w);
  const maxY = Math.max(minY, viewportBottom - rect.h);

  return {
    ...rect,
    x: clamp(rect.x, minX, maxX),
    y: clamp(rect.y, minY, maxY),
  };
};

const rectsOverlap = (left: Rect, right: Rect, padding: number) =>
  left.x < right.x + right.w + padding &&
  left.x + left.w + padding > right.x &&
  left.y < right.y + right.h + padding &&
  left.y + left.h + padding > right.y;

const candidateDistance = (candidate: Rect, anchor: Rect) => Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);

const axisSearchBounds = (
  origin: number,
  step: number,
  size: number,
  viewportMin: number,
  viewportMax: number,
  occupiedStarts: number[],
  occupiedEnds: number[],
) => {
  const occupiedMin = occupiedStarts.length > 0 ? Math.min(...occupiedStarts) : viewportMin;
  const occupiedMax = occupiedEnds.length > 0 ? Math.max(...occupiedEnds) : viewportMax - size;
  const searchMin = Math.min(viewportMin, occupiedMin - size * 2);
  const searchMax = Math.max(viewportMax - size, occupiedMax + size * 2);
  return {
    negative: Math.max(0, Math.ceil((origin - searchMin) / step)),
    positive: Math.max(0, Math.ceil((searchMax - origin) / step)),
    overflow: searchMax,
  };
};

type FindOpenNotePositionOptions = {
  camera: Camera;
  viewport: Viewport;
  occupiedRects: Rect[];
  preferred: { x: number; y: number };
  size: { w: number; h: number };
  padding?: number;
};

export const findOpenNotePosition = ({
  camera,
  viewport,
  occupiedRects,
  preferred,
  size,
  padding = 20,
}: FindOpenNotePositionOptions) => {
  const baseRect = clampRectToViewport(
    {
      x: preferred.x,
      y: preferred.y,
      w: size.w,
      h: size.h,
    },
    camera,
    viewport,
  );
  const collides = (candidate: Rect) => occupiedRects.some((rect) => rectsOverlap(candidate, rect, padding));
  if (!collides(baseRect)) {
    return { x: baseRect.x, y: baseRect.y };
  }

  const stepX = Math.max(24, Math.round(size.w / 5));
  const stepY = Math.max(24, Math.round(size.h / 5));
  const viewportLeft = -camera.x / camera.zoom;
  const viewportTop = -camera.y / camera.zoom;
  const viewportRight = viewportLeft + viewport.w / camera.zoom;
  const viewportBottom = viewportTop + viewport.h / camera.zoom;
  const columns = Math.max(1, Math.ceil(Math.max(0, viewportRight - viewportLeft - size.w) / stepX));
  const rows = Math.max(1, Math.ceil(Math.max(0, viewportBottom - viewportTop - size.h) / stepY));
  const viewportCandidates = new Map<string, Rect>();

  for (let offsetX = -(columns + 1); offsetX <= columns + 1; offsetX += 1) {
    for (let offsetY = -(rows + 1); offsetY <= rows + 1; offsetY += 1) {
      const candidate = clampRectToViewport(
        {
          x: baseRect.x + offsetX * stepX,
          y: baseRect.y + offsetY * stepY,
          w: size.w,
          h: size.h,
        },
        camera,
        viewport,
      );
      viewportCandidates.set(`${candidate.x}:${candidate.y}`, candidate);
    }
  }

  const orderedViewportCandidates = [...viewportCandidates.values()].sort(
    (left, right) => candidateDistance(left, baseRect) - candidateDistance(right, baseRect),
  );
  const availableInViewport = orderedViewportCandidates.find((candidate) => !collides(candidate));
  if (availableInViewport) {
    return { x: availableInViewport.x, y: availableInViewport.y };
  }

  const xBounds = axisSearchBounds(
    baseRect.x,
    stepX,
    size.w,
    viewportLeft,
    viewportRight,
    occupiedRects.map((rect) => rect.x),
    occupiedRects.map((rect) => rect.x + rect.w),
  );
  const yBounds = axisSearchBounds(
    baseRect.y,
    stepY,
    size.h,
    viewportTop,
    viewportBottom,
    occupiedRects.map((rect) => rect.y),
    occupiedRects.map((rect) => rect.y + rect.h),
  );
  const expandedCandidates = new Map<string, Rect>();

  for (let offsetX = -xBounds.negative; offsetX <= xBounds.positive; offsetX += 1) {
    for (let offsetY = -yBounds.negative; offsetY <= yBounds.positive; offsetY += 1) {
      const candidate = {
        x: baseRect.x + offsetX * stepX,
        y: baseRect.y + offsetY * stepY,
        w: size.w,
        h: size.h,
      };
      expandedCandidates.set(`${candidate.x}:${candidate.y}`, candidate);
    }
  }

  const orderedExpandedCandidates = [...expandedCandidates.values()].sort(
    (left, right) => candidateDistance(left, baseRect) - candidateDistance(right, baseRect),
  );
  const availableExpanded = orderedExpandedCandidates.find((candidate) => !collides(candidate));
  if (availableExpanded) {
    return { x: availableExpanded.x, y: availableExpanded.y };
  }

  return {
    x: xBounds.overflow + padding,
    y: baseRect.y,
  };
};
