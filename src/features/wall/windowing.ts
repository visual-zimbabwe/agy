import type { Camera, Link, Note, PersistedWallState, Zone } from "@/features/wall/types";

export type WallBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type WallShell = {
  id: string;
  title?: string;
  camera: Camera;
  lastColor?: string;
  updatedAt?: string;
  syncVersion: number;
};

export type WallWindowPayload = {
  shell: WallShell;
  bounds: WallBounds;
  snapshot: PersistedWallState;
  syncVersion: number;
};

export type WallRenderDetailLevel = "full" | "summary" | "ambient";
export type WallRenderBudget = {
  detailLevel: WallRenderDetailLevel;
  overscanWorldPx: number;
  maxRenderedNotes: number;
  maxDecodedMediaNotes: number;
  allowImageAutoLayout: boolean;
  totalVisibleNoteCount: number;
  culledNoteCount: number;
};
const defaultWindowTileWorldPx = 2400;

const rectIntersectsBounds = (
  x: number,
  y: number,
  w: number,
  h: number,
  bounds: WallBounds,
) => x <= bounds.maxX && x + w >= bounds.minX && y <= bounds.maxY && y + h >= bounds.minY;

export const createViewportWallBounds = (
  camera: Camera,
  viewport: { w: number; h: number },
  overscanWorldPx = 240,
): WallBounds => ({
  minX: (-camera.x - overscanWorldPx) / camera.zoom,
  minY: (-camera.y - overscanWorldPx) / camera.zoom,
  maxX: (-camera.x + viewport.w + overscanWorldPx) / camera.zoom,
  maxY: (-camera.y + viewport.h + overscanWorldPx) / camera.zoom,
});

export const getAdaptiveWallOverscanWorldPx = (cameraZoom: number, defaultOverscanWorldPx = 320) => {
  if (cameraZoom <= 0.45) {
    return Math.max(120, Math.round(defaultOverscanWorldPx * 0.4));
  }
  if (cameraZoom <= 0.75) {
    return Math.max(180, Math.round(defaultOverscanWorldPx * 0.7));
  }
  if (cameraZoom >= 1.8) {
    return Math.round(defaultOverscanWorldPx * 1.35);
  }
  return defaultOverscanWorldPx;
};

export const getWallRenderDetailLevel = (cameraZoom: number, visibleNoteCount: number): WallRenderDetailLevel => {
  if (cameraZoom <= 0.4 || visibleNoteCount >= 140) {
    return "ambient";
  }
  if (cameraZoom <= 0.72 || visibleNoteCount >= 70) {
    return "summary";
  }
  return "full";
};

export const createWallRenderBudget = ({
  cameraZoom,
  visibleNoteCount,
  defaultOverscanWorldPx,
}: {
  cameraZoom: number;
  visibleNoteCount: number;
  defaultOverscanWorldPx: number;
}): WallRenderBudget => {
  const detailLevel = getWallRenderDetailLevel(cameraZoom, visibleNoteCount);

  let overscanWorldPx = defaultOverscanWorldPx;
  let maxRenderedNotes = detailLevel === "full" ? 72 : detailLevel === "summary" ? 120 : 150;
  let maxDecodedMediaNotes = detailLevel === "full" ? 18 : 0;

  if (visibleNoteCount >= 320) {
    overscanWorldPx = Math.max(96, Math.round(defaultOverscanWorldPx * 0.3));
    maxRenderedNotes = 72;
    maxDecodedMediaNotes = 0;
  } else if (visibleNoteCount >= 200) {
    overscanWorldPx = Math.max(120, Math.round(defaultOverscanWorldPx * 0.45));
    maxRenderedNotes = detailLevel === "ambient" ? 96 : 84;
    maxDecodedMediaNotes = 0;
  } else if (visibleNoteCount >= 120) {
    overscanWorldPx = Math.max(160, Math.round(defaultOverscanWorldPx * 0.65));
    maxRenderedNotes = detailLevel === "full" ? 60 : 96;
    maxDecodedMediaNotes = detailLevel === "full" ? 8 : 0;
  } else if (visibleNoteCount >= 72) {
    overscanWorldPx = Math.max(192, Math.round(defaultOverscanWorldPx * 0.8));
    maxRenderedNotes = detailLevel === "full" ? 56 : 90;
    maxDecodedMediaNotes = detailLevel === "full" ? 12 : 0;
  }

  maxRenderedNotes = Math.max(24, Math.min(visibleNoteCount, maxRenderedNotes));

  return {
    detailLevel,
    overscanWorldPx,
    maxRenderedNotes,
    maxDecodedMediaNotes,
    allowImageAutoLayout: detailLevel === "full" && visibleNoteCount <= 48,
    totalVisibleNoteCount: visibleNoteCount,
    culledNoteCount: Math.max(0, visibleNoteCount - maxRenderedNotes),
  };
};

const noteDistanceFromBoundsCenter = (note: Pick<Note, "x" | "y" | "w" | "h">, bounds: WallBounds) => {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const noteCenterX = note.x + note.w / 2;
  const noteCenterY = note.y + note.h / 2;
  return (noteCenterX - centerX) ** 2 + (noteCenterY - centerY) ** 2;
};

export const prioritizeNotesForRender = <TNote extends Pick<Note, "id" | "x" | "y" | "w" | "h" | "updatedAt">>(
  notes: TNote[],
  bounds: WallBounds,
  maxRenderedNotes: number,
  priorityNoteIds: string[] = [],
) => {
  if (notes.length <= maxRenderedNotes) {
    return notes;
  }

  const priorityRank = new Map<string, number>();
  for (const noteId of priorityNoteIds) {
    if (!noteId || priorityRank.has(noteId)) {
      continue;
    }
    priorityRank.set(noteId, priorityRank.size);
  }

  return [...notes]
    .sort((left, right) => {
      const leftPriority = priorityRank.get(left.id);
      const rightPriority = priorityRank.get(right.id);
      if (leftPriority != null || rightPriority != null) {
        if (leftPriority == null) {
          return 1;
        }
        if (rightPriority == null) {
          return -1;
        }
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
      }

      const distanceDelta = noteDistanceFromBoundsCenter(left, bounds) - noteDistanceFromBoundsCenter(right, bounds);
      if (Math.abs(distanceDelta) > 1) {
        return distanceDelta;
      }

      const areaDelta = right.w * right.h - left.w * left.h;
      if (areaDelta !== 0) {
        return areaDelta;
      }

      return right.updatedAt - left.updatedAt;
    })
    .slice(0, maxRenderedNotes);
};

export const noteIntersectsWallBounds = (note: Pick<Note, "x" | "y" | "w" | "h">, bounds: WallBounds) =>
  rectIntersectsBounds(note.x, note.y, note.w, note.h, bounds);

export const zoneIntersectsWallBounds = (zone: Pick<Zone, "x" | "y" | "w" | "h">, bounds: WallBounds) =>
  rectIntersectsBounds(zone.x, zone.y, zone.w, zone.h, bounds);

export const filterNotesToWallBounds = <TNote extends Pick<Note, "x" | "y" | "w" | "h">>(notes: TNote[], bounds: WallBounds) =>
  notes.filter((note) => noteIntersectsWallBounds(note, bounds));

export const filterZonesToWallBounds = <TZone extends Pick<Zone, "x" | "y" | "w" | "h">>(zones: TZone[], bounds: WallBounds) =>
  zones.filter((zone) => zoneIntersectsWallBounds(zone, bounds));

export const filterLinksToVisibleNoteIds = <TLink extends Pick<Link, "fromNoteId" | "toNoteId">>(
  links: TLink[],
  visibleNoteIds: Set<string>,
) => links.filter((link) => visibleNoteIds.has(link.fromNoteId) && visibleNoteIds.has(link.toNoteId));

export const alignBoundsToWallTile = (bounds: WallBounds, tileWorldPx = defaultWindowTileWorldPx): WallBounds => ({
  minX: Math.floor(bounds.minX / tileWorldPx) * tileWorldPx,
  minY: Math.floor(bounds.minY / tileWorldPx) * tileWorldPx,
  maxX: Math.ceil(bounds.maxX / tileWorldPx) * tileWorldPx,
  maxY: Math.ceil(bounds.maxY / tileWorldPx) * tileWorldPx,
});

export const wallBoundsCacheKey = (bounds: WallBounds) =>
  `${bounds.minX}:${bounds.minY}:${bounds.maxX}:${bounds.maxY}`;

const mergeEntityMapByUpdatedAt = <
  TEntity extends {
    id: string;
    updatedAt: number;
  },
>(
  base: Record<string, TEntity>,
  incoming: Record<string, TEntity>,
) => {
  const merged: Record<string, TEntity> = { ...base };

  for (const [id, nextEntity] of Object.entries(incoming)) {
    const currentEntity = base[id];
    if (!currentEntity || nextEntity.updatedAt >= currentEntity.updatedAt) {
      merged[id] = nextEntity;
    }
  }

  return merged;
};

export const mergeWallWindowIntoSnapshot = (base: PersistedWallState, windowSnapshot: PersistedWallState): PersistedWallState => ({
  notes: mergeEntityMapByUpdatedAt(base.notes, windowSnapshot.notes),
  zones: mergeEntityMapByUpdatedAt(base.zones, windowSnapshot.zones),
  zoneGroups: mergeEntityMapByUpdatedAt(base.zoneGroups, windowSnapshot.zoneGroups),
  noteGroups: mergeEntityMapByUpdatedAt(base.noteGroups, windowSnapshot.noteGroups),
  links: mergeEntityMapByUpdatedAt(base.links, windowSnapshot.links),
  camera: base.camera,
  lastColor: windowSnapshot.lastColor ?? base.lastColor,
});
