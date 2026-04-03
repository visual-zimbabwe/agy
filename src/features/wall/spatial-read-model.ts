import { deriveWallAssetRecords } from "@/features/wall/asset-records";
import { rowsToSnapshot } from "@/features/wall/cloud";
import type { WallShellState, WallWindowReadModel, WallWindowResponse } from "@/features/wall/types";
import {
  filterLinksToVisibleNoteIds,
  filterNotesToWallBounds,
  filterZonesToWallBounds,
  type WallBounds,
} from "@/features/wall/windowing";

type SnapshotArgs = Parameters<typeof rowsToSnapshot>[0];

const buildAdjacentBounds = (bounds: WallBounds): WallBounds[] => {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);

  return [
    {
      minX: bounds.minX - width,
      minY: bounds.minY,
      maxX: bounds.maxX - width,
      maxY: bounds.maxY,
    },
    {
      minX: bounds.minX + width,
      minY: bounds.minY,
      maxX: bounds.maxX + width,
      maxY: bounds.maxY,
    },
    {
      minX: bounds.minX,
      minY: bounds.minY - height,
      maxX: bounds.maxX,
      maxY: bounds.maxY - height,
    },
    {
      minX: bounds.minX,
      minY: bounds.minY + height,
      maxX: bounds.maxX,
      maxY: bounds.maxY + height,
    },
  ];
};

export const buildWindowCandidateBounds = (bounds: WallBounds, margin: number): WallBounds => ({
  minX: bounds.minX - margin,
  minY: bounds.minY - margin,
  maxX: bounds.maxX + margin,
  maxY: bounds.maxY + margin,
});

export const createWallWindowReadModel = ({
  bounds,
  candidateBounds,
  candidateNotesCount,
  candidateZonesCount,
  visibleNotesCount,
  visibleZonesCount,
  visibleLinksCount,
  visibleZoneGroupsCount,
  visibleNoteGroupsCount,
}: {
  bounds: WallBounds;
  candidateBounds: WallBounds;
  candidateNotesCount: number;
  candidateZonesCount: number;
  visibleNotesCount: number;
  visibleZonesCount: number;
  visibleLinksCount: number;
  visibleZoneGroupsCount: number;
  visibleNoteGroupsCount: number;
}): WallWindowReadModel => ({
  tileKey: `${bounds.minX}:${bounds.minY}:${bounds.maxX}:${bounds.maxY}`,
  queryBounds: bounds,
  candidateBounds,
  prefetchBounds: buildAdjacentBounds(bounds),
  counts: {
    candidateNotes: candidateNotesCount,
    candidateZones: candidateZonesCount,
    visibleNotes: visibleNotesCount,
    visibleZones: visibleZonesCount,
    visibleLinks: visibleLinksCount,
    visibleZoneGroups: visibleZoneGroupsCount,
    visibleNoteGroups: visibleNoteGroupsCount,
  },
});

const linkRowsToLinks = (wall: SnapshotArgs["wall"], links: SnapshotArgs["links"]) =>
  Object.values(
    rowsToSnapshot({
      wall,
      notes: [],
      zones: [],
      zoneGroups: [],
      noteGroups: [],
      links,
    }).links,
  );

export const createWallWindowResponse = ({
  shell,
  wall,
  bounds,
  candidateBounds,
  notes,
  zones,
  zoneGroups,
  noteGroups,
  links,
}: {
  shell: WallShellState;
  wall: SnapshotArgs["wall"];
  bounds: WallBounds;
  candidateBounds: WallBounds;
  notes: SnapshotArgs["notes"];
  zones: SnapshotArgs["zones"];
  zoneGroups: SnapshotArgs["zoneGroups"];
  noteGroups: SnapshotArgs["noteGroups"];
  links: SnapshotArgs["links"];
}): WallWindowResponse => {
  const fullWindowSnapshot = rowsToSnapshot({
    wall,
    notes,
    zones,
    zoneGroups,
    noteGroups,
    links: [],
  });

  const filteredNotes = filterNotesToWallBounds(Object.values(fullWindowSnapshot.notes), bounds);
  const filteredZones = filterZonesToWallBounds(Object.values(fullWindowSnapshot.zones), bounds);
  const filteredNoteIds = new Set(filteredNotes.map((note) => note.id));
  const filteredZoneIds = new Set(filteredZones.map((zone) => zone.id));
  const filteredLinks = filterLinksToVisibleNoteIds(linkRowsToLinks(wall, links), filteredNoteIds);

  const snapshot = rowsToSnapshot({
    wall,
    notes: notes.filter((row) => filteredNoteIds.has(row.id)),
    zones: zones.filter((row) => filteredZoneIds.has(row.id)),
    zoneGroups: zoneGroups.filter((group) => {
      const zoneIds = Array.isArray(group.zone_ids) ? (group.zone_ids as string[]) : [];
      return zoneIds.some((zoneId) => filteredZoneIds.has(zoneId));
    }),
    noteGroups: noteGroups.filter((group) => {
      const noteIds = Array.isArray(group.note_ids) ? (group.note_ids as string[]) : [];
      return noteIds.some((noteId) => filteredNoteIds.has(noteId));
    }),
    links: filteredLinks.map((link) => ({
      id: link.id,
      revision: link.revision,
      from_note_id: link.fromNoteId,
      to_note_id: link.toNoteId,
      type: link.type,
      label: link.label,
      created_at: new Date(link.createdAt).toISOString(),
      updated_at: new Date(link.updatedAt).toISOString(),
    })),
  });

  return {
    shell,
    bounds,
    snapshot,
    assets: deriveWallAssetRecords(snapshot.notes),
    readModel: createWallWindowReadModel({
      bounds,
      candidateBounds,
      candidateNotesCount: notes.length,
      candidateZonesCount: zones.length,
      visibleNotesCount: filteredNotes.length,
      visibleZonesCount: filteredZones.length,
      visibleLinksCount: filteredLinks.length,
      visibleZoneGroupsCount: Object.keys(snapshot.zoneGroups).length,
      visibleNoteGroupsCount: Object.keys(snapshot.noteGroups).length,
    }),
    syncVersion: shell.syncVersion,
  };
};
