import { hasContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import type { DeltaLink, DeltaNote, DeltaNoteGroup, DeltaSyncRequest, DeltaZone, DeltaZoneGroup } from "@/features/wall/delta-sync";
import type { Link, Note, NoteGroup, PersistedWallState, Zone, ZoneGroup } from "@/features/wall/types";
import { filterLinksToVisibleNoteIds, filterNotesToWallBounds, filterZonesToWallBounds, type WallBounds } from "@/features/wall/windowing";

export type WallSyncRequest = {
  wallId: string;
  snapshot: PersistedWallState;
};

export const snapshotsEqual = (left: PersistedWallState | null | undefined, right: PersistedWallState | null | undefined) =>
  JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

export const shouldRejectWallSync = (expectedWallUpdatedAt?: string, currentWallUpdatedAt?: string | null) =>
  Boolean(expectedWallUpdatedAt && currentWallUpdatedAt && expectedWallUpdatedAt !== currentWallUpdatedAt);

const cloneSnapshot = (snapshot: PersistedWallState): PersistedWallState => ({
  notes: { ...snapshot.notes },
  zones: { ...snapshot.zones },
  zoneGroups: { ...snapshot.zoneGroups },
  noteGroups: { ...snapshot.noteGroups },
  links: { ...snapshot.links },
  camera: { ...snapshot.camera },
  lastColor: snapshot.lastColor,
});

const entityChanged = <T extends { updatedAt: number; revision?: number }>(baseline?: T, current?: T) => {
  if (!baseline || !current) {
    return baseline !== current;
  }
  return JSON.stringify(baseline) !== JSON.stringify(current);
};

const toDeletedNote = (baseline: Note, deletedAt: number): DeltaNote => ({
  ...baseline,
  revision: baseline.revision,
  deletedAt,
  updatedAt: Math.max(baseline.updatedAt, deletedAt),
});

const toDeletedZone = (baseline: Zone, deletedAt: number): DeltaZone => ({
  ...baseline,
  revision: baseline.revision,
  deletedAt,
  updatedAt: Math.max(baseline.updatedAt, deletedAt),
});

const toDeletedZoneGroup = (baseline: ZoneGroup, deletedAt: number): DeltaZoneGroup => ({
  ...baseline,
  revision: baseline.revision,
  deletedAt,
  updatedAt: Math.max(baseline.updatedAt, deletedAt),
});

const toDeletedNoteGroup = (baseline: NoteGroup, deletedAt: number): DeltaNoteGroup => ({
  ...baseline,
  revision: baseline.revision,
  deletedAt,
  updatedAt: Math.max(baseline.updatedAt, deletedAt),
});

const toDeletedLink = (baseline: Link, deletedAt: number): DeltaLink => ({
  ...baseline,
  revision: baseline.revision,
  deletedAt,
  updatedAt: Math.max(baseline.updatedAt, deletedAt),
});

const computeEntityDelta = <
  T extends { id: string; updatedAt: number; revision?: number },
  TDelta extends { id: string; deletedAt?: number },
>(
  baselineMap: Record<string, T>,
  currentMap: Record<string, T>,
  toDeleted: (baseline: T, deletedAt: number) => TDelta,
) => {
  const delta: TDelta[] = [];

  for (const [id, current] of Object.entries(currentMap)) {
    const baseline = baselineMap[id];
    if (entityChanged(baseline, current)) {
      delta.push(current as unknown as TDelta);
    }
  }

  const deletedAt = Date.now();
  for (const [id, baseline] of Object.entries(baselineMap)) {
    if (!(id in currentMap)) {
      delta.push(toDeleted(baseline, deletedAt));
    }
  }

  return delta;
};

export const buildWallDeltaSyncRequest = ({
  baseVersion,
  baseline,
  current,
}: {
  baseVersion: number;
  baseline: PersistedWallState | null;
  current: PersistedWallState;
}): DeltaSyncRequest => {
  const safeBaseline =
    baseline ??
    ({
      notes: {},
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: { x: 0, y: 0, zoom: 1 },
    } satisfies PersistedWallState);

  return {
    baseVersion,
    camera:
      JSON.stringify(safeBaseline.camera) !== JSON.stringify(current.camera)
        ? current.camera
        : undefined,
    lastColor: safeBaseline.lastColor !== current.lastColor ? current.lastColor : undefined,
    notes: computeEntityDelta<Note, DeltaNote>(safeBaseline.notes, current.notes, toDeletedNote),
    zones: computeEntityDelta<Zone, DeltaZone>(safeBaseline.zones, current.zones, toDeletedZone),
    zoneGroups: computeEntityDelta<ZoneGroup, DeltaZoneGroup>(safeBaseline.zoneGroups, current.zoneGroups, toDeletedZoneGroup),
    noteGroups: computeEntityDelta<NoteGroup, DeltaNoteGroup>(safeBaseline.noteGroups, current.noteGroups, toDeletedNoteGroup),
    links: computeEntityDelta<Link, DeltaLink>(safeBaseline.links, current.links, toDeletedLink),
  };
};

export const hasWallDeltaChanges = (delta: DeltaSyncRequest) =>
  Boolean(
    delta.camera ||
      delta.lastColor !== undefined ||
      delta.notes.length > 0 ||
      delta.zones.length > 0 ||
      delta.zoneGroups.length > 0 ||
      delta.noteGroups.length > 0 ||
      delta.links.length > 0,
  );

export const applyWallDeltaChanges = (snapshot: PersistedWallState, changes: Array<{ entity_type: string; entity_id: string; deleted: boolean; payload: unknown }>) => {
  const next = cloneSnapshot(snapshot);

  for (const change of changes) {
    if (change.entity_type === "wall") {
      const wallPayload = change.payload as { camera?: PersistedWallState["camera"]; lastColor?: string | undefined };
      if (wallPayload.camera) {
        next.camera = wallPayload.camera;
      }
      if ("lastColor" in wallPayload) {
        next.lastColor = wallPayload.lastColor;
      }
      continue;
    }

    if (change.entity_type === "note") {
      if (change.deleted) {
        delete next.notes[change.entity_id];
      } else {
        next.notes[change.entity_id] = change.payload as Note;
      }
      continue;
    }

    if (change.entity_type === "zone") {
      if (change.deleted) {
        delete next.zones[change.entity_id];
      } else {
        next.zones[change.entity_id] = change.payload as Zone;
      }
      continue;
    }

    if (change.entity_type === "zone_group") {
      if (change.deleted) {
        delete next.zoneGroups[change.entity_id];
      } else {
        next.zoneGroups[change.entity_id] = change.payload as ZoneGroup;
      }
      continue;
    }

    if (change.entity_type === "note_group") {
      if (change.deleted) {
        delete next.noteGroups[change.entity_id];
      } else {
        next.noteGroups[change.entity_id] = change.payload as NoteGroup;
      }
      continue;
    }

    if (change.entity_type === "link") {
      if (change.deleted) {
        delete next.links[change.entity_id];
      } else {
        next.links[change.entity_id] = change.payload as Link;
      }
    }
  }

  return next;
};

export const sliceWallSnapshotToBounds = (snapshot: PersistedWallState, bounds: WallBounds): PersistedWallState => {
  const visibleNotes = filterNotesToWallBounds(Object.values(snapshot.notes), bounds);
  const visibleZones = filterZonesToWallBounds(Object.values(snapshot.zones), bounds);
  const visibleNoteIds = new Set(visibleNotes.map((note) => note.id));
  const visibleZoneIds = new Set(visibleZones.map((zone) => zone.id));
  const visibleLinks = filterLinksToVisibleNoteIds(Object.values(snapshot.links), visibleNoteIds);
  const visibleZoneGroups = Object.values(snapshot.zoneGroups).filter((group) => group.zoneIds.some((zoneId) => visibleZoneIds.has(zoneId)));
  const visibleNoteGroups = Object.values(snapshot.noteGroups).filter((group) => group.noteIds.some((noteId) => visibleNoteIds.has(noteId)));

  return {
    notes: Object.fromEntries(visibleNotes.map((note) => [note.id, note])),
    zones: Object.fromEntries(visibleZones.map((zone) => [zone.id, zone])),
    zoneGroups: Object.fromEntries(visibleZoneGroups.map((group) => [group.id, group])),
    noteGroups: Object.fromEntries(visibleNoteGroups.map((group) => [group.id, group])),
    links: Object.fromEntries(visibleLinks.map((link) => [link.id, link])),
    camera: snapshot.camera,
    lastColor: snapshot.lastColor,
  };
};

export const hasRelevantWallDeltaChanges = (
  changes: Array<{ entity_type: string; entity_id: string; deleted: boolean; payload: unknown }>,
  bounds: WallBounds,
) => {
  for (const change of changes) {
    if (change.entity_type === "wall" || change.entity_type === "link" || change.entity_type === "zone_group" || change.entity_type === "note_group") {
      return true;
    }

    if (change.entity_type === "note") {
      if (change.deleted) {
        return true;
      }
      const note = change.payload as Note;
      if (filterNotesToWallBounds([note], bounds).length > 0) {
        return true;
      }
      continue;
    }

    if (change.entity_type === "zone") {
      if (change.deleted) {
        return true;
      }
      const zone = change.payload as Zone;
      if (filterZonesToWallBounds([zone], bounds).length > 0) {
        return true;
      }
    }
  }

  return false;
};

export const stageWallSyncRequest = ({
  inFlight,
  next,
}: {
  inFlight: boolean;
  next: WallSyncRequest;
}) => ({
  active: inFlight ? null : next,
  queued: inFlight ? next : null,
});

export const takeNextQueuedWallSync = (queued: WallSyncRequest | null) => ({
  next: queued,
  queued: null as WallSyncRequest | null,
});

export const rebaseLocalWallSnapshot = (serverSnapshot: PersistedWallState, localSnapshot: PersistedWallState) =>
  mergeSnapshotsLww(serverSnapshot, localSnapshot);

export const resolveWallBootstrapSnapshot = ({
  serverSnapshot,
  fullLocalSnapshot,
  localBaselineSnapshot,
  latestLocalSnapshot,
  localSyncVersion,
  serverSyncVersion,
}: {
  serverSnapshot: PersistedWallState;
  fullLocalSnapshot: PersistedWallState | null;
  localBaselineSnapshot: PersistedWallState | null;
  latestLocalSnapshot: PersistedWallState;
  localSyncVersion: number;
  serverSyncVersion: number;
}) => {
  const hasUnsyncedLocalShadow =
    fullLocalSnapshot !== null &&
    hasContent(fullLocalSnapshot) &&
    localSyncVersion === serverSyncVersion &&
    !snapshotsEqual(fullLocalSnapshot, localBaselineSnapshot) &&
    snapshotsEqual(latestLocalSnapshot, fullLocalSnapshot);

  return {
    hasUnsyncedLocalShadow,
    nextSnapshot: hasUnsyncedLocalShadow ? latestLocalSnapshot : serverSnapshot,
    replaySnapshot: hasUnsyncedLocalShadow ? latestLocalSnapshot : null,
  };
};
