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
