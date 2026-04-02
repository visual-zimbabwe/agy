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

export const mergeWallWindowIntoSnapshot = (base: PersistedWallState, windowSnapshot: PersistedWallState): PersistedWallState => ({
  notes: {
    ...base.notes,
    ...windowSnapshot.notes,
  },
  zones: {
    ...base.zones,
    ...windowSnapshot.zones,
  },
  zoneGroups: {
    ...base.zoneGroups,
    ...windowSnapshot.zoneGroups,
  },
  noteGroups: {
    ...base.noteGroups,
    ...windowSnapshot.noteGroups,
  },
  links: {
    ...base.links,
    ...windowSnapshot.links,
  },
  camera: windowSnapshot.camera,
  lastColor: windowSnapshot.lastColor ?? base.lastColor,
});
