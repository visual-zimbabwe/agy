import Dexie, { type Table } from "dexie";

import type { Camera, Link, Note, NoteGroup, PersistedWallState, WallWindowBounds, Zone, ZoneGroup } from "@/features/wall/types";
import { normalizePersistedWallState, parseTimelinePayload } from "@/features/wall/storage-migrations";
import { filterLinksToVisibleNoteIds, noteIntersectsWallBounds, zoneIntersectsWallBounds } from "@/features/wall/windowing";
import { appSlug, legacyAppSlug } from "@/lib/brand";

type MetaRecord = {
  key: string;
  value: string;
};

type TimelineSnapshotRecord = {
  id?: number;
  ts: number;
  payload: string;
};

type TimelineDeltaPayload = {
  notes?: Record<string, Note>;
  deletedNoteIds?: string[];
  zones?: Record<string, Zone>;
  deletedZoneIds?: string[];
  zoneGroups?: Record<string, ZoneGroup>;
  deletedZoneGroupIds?: string[];
  noteGroups?: Record<string, NoteGroup>;
  deletedNoteGroupIds?: string[];
  links?: Record<string, Link>;
  deletedLinkIds?: string[];
  camera?: Camera;
  lastColor?: string;
};

type TimelineRecordPayload =
  | {
      kind: "checkpoint";
      snapshot: PersistedWallState;
    }
  | {
      kind: "delta";
      delta: TimelineDeltaPayload;
    };

type SnapshotCollections = Pick<PersistedWallState, "notes" | "zones" | "zoneGroups" | "noteGroups" | "links">;

type SnapshotWritePlan = {
  notesToPut: Note[];
  noteIdsToDelete: string[];
  zonesToPut: Zone[];
  zoneIdsToDelete: string[];
  zoneGroupsToPut: ZoneGroup[];
  zoneGroupIdsToDelete: string[];
  noteGroupsToPut: NoteGroup[];
  noteGroupIdsToDelete: string[];
  linksToPut: Link[];
  linkIdsToDelete: string[];
  cameraChanged: boolean;
  lastColorChanged: boolean;
  nextCamera: Camera;
  nextLastColor?: string;
};

const wallDatabaseName = `${appSlug}-db`;
const legacyWallDatabaseName = `${legacyAppSlug}-db`;

class WallDatabase extends Dexie {
  notes!: Table<Note, string>;
  zones!: Table<Zone, string>;
  zoneGroups!: Table<ZoneGroup, string>;
  noteGroups!: Table<NoteGroup, string>;
  links!: Table<Link, string>;
  meta!: Table<MetaRecord, string>;
  timelineSnapshots!: Table<TimelineSnapshotRecord, number>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      notes: "id, updatedAt",
      zones: "id, updatedAt",
      meta: "key",
    });
    this.version(2).stores({
      notes: "id, updatedAt",
      zones: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
    });
    this.version(3).stores({
      notes: "id, updatedAt",
      zones: "id, groupId, updatedAt",
      zoneGroups: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
    });
    this.version(4).stores({
      notes: "id, updatedAt",
      zones: "id, groupId, updatedAt",
      zoneGroups: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
      timelineSnapshots: "++id, ts",
    });
    this.version(5).stores({
      notes: "id, updatedAt",
      zones: "id, groupId, updatedAt",
      zoneGroups: "id, updatedAt",
      noteGroups: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
      timelineSnapshots: "++id, ts",
    });
    this.version(6).stores({
      notes: "id, updatedAt, x, y",
      zones: "id, groupId, updatedAt, x, y",
      zoneGroups: "id, updatedAt",
      noteGroups: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
      timelineSnapshots: "++id, ts",
    });
  }
}

const db = new WallDatabase(wallDatabaseName);
const legacyDb = new WallDatabase(legacyWallDatabaseName);
let migrationPromise: Promise<void> | null = null;

const defaultCamera: Camera = { x: 0, y: 0, zoom: 1 };
const defaultLocalWindowCandidateMargin = 1600;

const isQuotaExceededError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  return name.includes("quota") || name.includes("abort") || message.includes("quotaexceeded") || message.includes("quota exceeded");
};

const emptyCollections: SnapshotCollections = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
};

const serializeValue = (value: unknown) => JSON.stringify(value);
const timelineCheckpointInterval = 12;

const collectEntityUpserts = <T extends { id: string }>(
  previous: Record<string, T>,
  next: Record<string, T>,
) =>
  Object.values(next).filter((entity) => {
    const previousEntity = previous[entity.id];
    return !previousEntity || serializeValue(previousEntity) !== serializeValue(entity);
  });

const collectDeletedEntityIds = <T extends { id: string }>(
  previous: Record<string, T>,
  next: Record<string, T>,
) => Object.keys(previous).filter((id) => !(id in next));

export const createWallSnapshotWritePlan = (
  previousSnapshot: PersistedWallState | null,
  nextSnapshot: PersistedWallState,
): SnapshotWritePlan => {
  const previousCollections = previousSnapshot ?? { ...emptyCollections, camera: defaultCamera };

  return {
    notesToPut: collectEntityUpserts(previousCollections.notes, nextSnapshot.notes),
    noteIdsToDelete: collectDeletedEntityIds(previousCollections.notes, nextSnapshot.notes),
    zonesToPut: collectEntityUpserts(previousCollections.zones, nextSnapshot.zones),
    zoneIdsToDelete: collectDeletedEntityIds(previousCollections.zones, nextSnapshot.zones),
    zoneGroupsToPut: collectEntityUpserts(previousCollections.zoneGroups, nextSnapshot.zoneGroups),
    zoneGroupIdsToDelete: collectDeletedEntityIds(previousCollections.zoneGroups, nextSnapshot.zoneGroups),
    noteGroupsToPut: collectEntityUpserts(previousCollections.noteGroups, nextSnapshot.noteGroups),
    noteGroupIdsToDelete: collectDeletedEntityIds(previousCollections.noteGroups, nextSnapshot.noteGroups),
    linksToPut: collectEntityUpserts(previousCollections.links, nextSnapshot.links),
    linkIdsToDelete: collectDeletedEntityIds(previousCollections.links, nextSnapshot.links),
    cameraChanged: !previousSnapshot || serializeValue(previousCollections.camera) !== serializeValue(nextSnapshot.camera),
    lastColorChanged: !previousSnapshot || previousSnapshot.lastColor !== nextSnapshot.lastColor,
    nextCamera: nextSnapshot.camera,
    nextLastColor: nextSnapshot.lastColor,
  };
};


const databaseHasData = async (database: WallDatabase) => {
  const counts = await Promise.all([
    database.notes.count(),
    database.zones.count(),
    database.zoneGroups.count(),
    database.noteGroups.count(),
    database.links.count(),
    database.meta.count(),
    database.timelineSnapshots.count(),
  ]);
  return counts.some((count) => count > 0);
};

const migrateLegacyWallDatabaseIfNeeded = async () => {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const legacyExists = await Dexie.exists(legacyWallDatabaseName);
      if (!legacyExists) {
        return;
      }

      await Promise.all([db.open(), legacyDb.open()]);
      const [nextHasData, legacyHasData] = await Promise.all([databaseHasData(db), databaseHasData(legacyDb)]);
      if (nextHasData || !legacyHasData) {
        return;
      }

      const [notes, zones, zoneGroups, noteGroups, links, meta, timelineSnapshots] = await Promise.all([
        legacyDb.notes.toArray(),
        legacyDb.zones.toArray(),
        legacyDb.zoneGroups.toArray(),
        legacyDb.noteGroups.toArray(),
        legacyDb.links.toArray(),
        legacyDb.meta.toArray(),
        legacyDb.timelineSnapshots.toArray(),
      ]);

      await db.transaction("rw", [db.notes, db.zones, db.zoneGroups, db.noteGroups, db.links, db.meta, db.timelineSnapshots], async () => {
        if (notes.length > 0) {
          await db.notes.bulkPut(notes);
        }
        if (zones.length > 0) {
          await db.zones.bulkPut(zones);
        }
        if (zoneGroups.length > 0) {
          await db.zoneGroups.bulkPut(zoneGroups);
        }
        if (noteGroups.length > 0) {
          await db.noteGroups.bulkPut(noteGroups);
        }
        if (links.length > 0) {
          await db.links.bulkPut(links);
        }
        if (meta.length > 0) {
          await db.meta.bulkPut(meta);
        }
        if (timelineSnapshots.length > 0) {
          await db.timelineSnapshots.bulkPut(timelineSnapshots);
        }
      });
    })();
  }

  await migrationPromise;
};

export const loadWallSnapshot = async (): Promise<PersistedWallState> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const [notesList, zonesList, zoneGroupsList, noteGroupsList, linksList, cameraMeta, lastColorMeta] = await Promise.all([
    db.notes.toArray(),
    db.zones.toArray(),
    db.zoneGroups.toArray(),
    db.noteGroups.toArray(),
    db.links.toArray(),
    db.meta.get("camera"),
    db.meta.get("lastColor"),
  ]);

  const notes = Object.fromEntries(notesList.map((note) => [note.id, note]));
  const zones = Object.fromEntries(zonesList.map((zone) => [zone.id, zone]));
  const zoneGroups = Object.fromEntries(zoneGroupsList.map((group) => [group.id, group]));
  const noteGroups = Object.fromEntries(noteGroupsList.map((group) => [group.id, group]));
  const links = Object.fromEntries(linksList.map((link) => [link.id, link]));

  const normalized = normalizePersistedWallState({
    notes,
    zones,
    zoneGroups,
    noteGroups,
    links,
    camera: cameraMeta ? (JSON.parse(cameraMeta.value) as Camera) : defaultCamera,
    lastColor: lastColorMeta?.value,
  });

  return normalized ?? { notes: {}, zones: {}, zoneGroups: {}, noteGroups: {}, links: {}, camera: defaultCamera };
};

const parseStoredCamera = (cameraMeta?: MetaRecord) => {
  if (!cameraMeta?.value) {
    return defaultCamera;
  }

  try {
    const parsed = JSON.parse(cameraMeta.value) as Camera;
    if (
      typeof parsed?.x === "number" &&
      Number.isFinite(parsed.x) &&
      typeof parsed?.y === "number" &&
      Number.isFinite(parsed.y) &&
      typeof parsed?.zoom === "number" &&
      Number.isFinite(parsed.zoom) &&
      parsed.zoom > 0
    ) {
      return parsed;
    }
  } catch {
    return defaultCamera;
  }

  return defaultCamera;
};

export const loadWallCameraState = async (): Promise<{ camera: Camera; lastColor?: string }> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const [cameraMeta, lastColorMeta] = await Promise.all([db.meta.get("camera"), db.meta.get("lastColor")]);
  return {
    camera: parseStoredCamera(cameraMeta),
    lastColor: lastColorMeta?.value,
  };
};

export const loadWallWindowSnapshot = async (
  bounds: WallWindowBounds,
  options?: { candidateMargin?: number },
): Promise<PersistedWallState> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const candidateMargin = Math.max(0, options?.candidateMargin ?? defaultLocalWindowCandidateMargin);
  const minX = bounds.minX - candidateMargin;
  const maxX = bounds.maxX;

  const [cameraState, noteCandidates, zoneCandidates, zoneGroupsList, noteGroupsList] = await Promise.all([
    loadWallCameraState(),
    db.notes.where("x").between(minX, maxX, true, true).toArray(),
    db.zones.where("x").between(minX, maxX, true, true).toArray(),
    db.zoneGroups.toArray(),
    db.noteGroups.toArray(),
  ]);

  const visibleNotes = noteCandidates.filter((note) => noteIntersectsWallBounds(note, bounds));
  const visibleZones = zoneCandidates.filter((zone) => zoneIntersectsWallBounds(zone, bounds));
  const visibleNoteIds = new Set(visibleNotes.map((note) => note.id));
  const visibleZoneIds = new Set(visibleZones.map((zone) => zone.id));

  const linkCandidates =
    visibleNoteIds.size > 0 ? await db.links.where("fromNoteId").anyOf([...visibleNoteIds]).toArray() : [];
  const visibleLinks = filterLinksToVisibleNoteIds(linkCandidates, visibleNoteIds);
  const visibleZoneGroups = zoneGroupsList.filter((group) => group.zoneIds.some((zoneId) => visibleZoneIds.has(zoneId)));
  const visibleNoteGroups = noteGroupsList.filter((group) => group.noteIds.some((noteId) => visibleNoteIds.has(noteId)));

  return (
    normalizePersistedWallState({
      notes: Object.fromEntries(visibleNotes.map((note) => [note.id, note])),
      zones: Object.fromEntries(visibleZones.map((zone) => [zone.id, zone])),
      zoneGroups: Object.fromEntries(visibleZoneGroups.map((group) => [group.id, group])),
      noteGroups: Object.fromEntries(visibleNoteGroups.map((group) => [group.id, group])),
      links: Object.fromEntries(visibleLinks.map((link) => [link.id, link])),
      camera: cameraState.camera,
      lastColor: cameraState.lastColor,
    }) ?? {
      notes: {},
      zones: {},
      zoneGroups: {},
      noteGroups: {},
      links: {},
      camera: cameraState.camera,
      lastColor: cameraState.lastColor,
    }
  );
};

export const loadWallSyncVersion = async () => {
  await migrateLegacyWallDatabaseIfNeeded();
  const syncVersionMeta = await db.meta.get("cloudSyncVersion");
  const numeric = syncVersionMeta ? Number(syncVersionMeta.value) : 0;
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

export const saveWallSyncVersion = async (syncVersion: number) => {
  await migrateLegacyWallDatabaseIfNeeded();
  await db.meta.put({ key: "cloudSyncVersion", value: String(Math.max(0, Math.trunc(syncVersion))) });
};

export const loadWallCloudBaselineSnapshot = async (): Promise<PersistedWallState | null> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const baselineMeta = await db.meta.get("cloudBaselineSnapshot");
  if (!baselineMeta?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(baselineMeta.value) as PersistedWallState;
    return normalizePersistedWallState(parsed);
  } catch {
    return null;
  }
};

export const saveWallCloudBaselineSnapshot = async (snapshot: PersistedWallState | null) => {
  await migrateLegacyWallDatabaseIfNeeded();
  if (!snapshot) {
    await db.meta.delete("cloudBaselineSnapshot");
    return;
  }

  await db.meta.put({ key: "cloudBaselineSnapshot", value: JSON.stringify(snapshot) });
};

const writeWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
  await db.transaction("rw", [db.notes, db.zones, db.zoneGroups, db.noteGroups, db.links, db.meta], async () => {
    const notes = Object.values(snapshot.notes);
    const zones = Object.values(snapshot.zones);
    const zoneGroups = Object.values(snapshot.zoneGroups);
    const noteGroups = Object.values(snapshot.noteGroups);
    const links = Object.values(snapshot.links);

    await db.notes.clear();
    if (notes.length > 0) {
      await db.notes.bulkPut(notes);
    }

    await db.zones.clear();
    if (zones.length > 0) {
      await db.zones.bulkPut(zones);
    }

    await db.zoneGroups.clear();
    if (zoneGroups.length > 0) {
      await db.zoneGroups.bulkPut(zoneGroups);
    }

    await db.noteGroups.clear();
    if (noteGroups.length > 0) {
      await db.noteGroups.bulkPut(noteGroups);
    }

    await db.links.clear();
    if (links.length > 0) {
      await db.links.bulkPut(links);
    }

    await db.meta.put({ key: "camera", value: JSON.stringify(snapshot.camera) });

    if (snapshot.lastColor) {
      await db.meta.put({ key: "lastColor", value: snapshot.lastColor });
    }
  });
};

const writeWallSnapshotIncremental = async (snapshot: PersistedWallState, previousSnapshot: PersistedWallState): Promise<void> => {
  const plan = createWallSnapshotWritePlan(previousSnapshot, snapshot);

  await db.transaction("rw", [db.notes, db.zones, db.zoneGroups, db.noteGroups, db.links, db.meta], async () => {
    if (plan.notesToPut.length > 0) {
      await db.notes.bulkPut(plan.notesToPut);
    }
    if (plan.noteIdsToDelete.length > 0) {
      await db.notes.bulkDelete(plan.noteIdsToDelete);
    }

    if (plan.zonesToPut.length > 0) {
      await db.zones.bulkPut(plan.zonesToPut);
    }
    if (plan.zoneIdsToDelete.length > 0) {
      await db.zones.bulkDelete(plan.zoneIdsToDelete);
    }

    if (plan.zoneGroupsToPut.length > 0) {
      await db.zoneGroups.bulkPut(plan.zoneGroupsToPut);
    }
    if (plan.zoneGroupIdsToDelete.length > 0) {
      await db.zoneGroups.bulkDelete(plan.zoneGroupIdsToDelete);
    }

    if (plan.noteGroupsToPut.length > 0) {
      await db.noteGroups.bulkPut(plan.noteGroupsToPut);
    }
    if (plan.noteGroupIdsToDelete.length > 0) {
      await db.noteGroups.bulkDelete(plan.noteGroupIdsToDelete);
    }

    if (plan.linksToPut.length > 0) {
      await db.links.bulkPut(plan.linksToPut);
    }
    if (plan.linkIdsToDelete.length > 0) {
      await db.links.bulkDelete(plan.linkIdsToDelete);
    }

    if (plan.cameraChanged) {
      await db.meta.put({ key: "camera", value: JSON.stringify(plan.nextCamera) });
    }

    if (plan.lastColorChanged) {
      if (plan.nextLastColor) {
        await db.meta.put({ key: "lastColor", value: plan.nextLastColor });
      } else {
        await db.meta.delete("lastColor");
      }
    }
  });
};

export const saveWallSnapshot = async (snapshot: PersistedWallState, previousSnapshot?: PersistedWallState): Promise<void> => {
  await migrateLegacyWallDatabaseIfNeeded();

  try {
    if (previousSnapshot) {
      await writeWallSnapshotIncremental(snapshot, previousSnapshot);
    } else {
      await writeWallSnapshot(snapshot);
    }
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    await db.timelineSnapshots.clear();
    if (previousSnapshot) {
      await writeWallSnapshotIncremental(snapshot, previousSnapshot);
    } else {
      await writeWallSnapshot(snapshot);
    }
  }
};

export const createSnapshotSaver = (
  delayMs = 350,
  callbacks?: {
    onSchedule?: () => void;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  },
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PersistedWallState | undefined;
  let pendingWrites = 0;
  let committedSnapshot: PersistedWallState | undefined;

  const flush = async () => {
    if (!latest) {
      return;
    }

    const snapshot = latest;
    latest = undefined;
    pendingWrites += 1;

    try {
      await saveWallSnapshot(snapshot, committedSnapshot);
      committedSnapshot = snapshot;
      pendingWrites = Math.max(0, pendingWrites - 1);
      if (pendingWrites === 0) {
        callbacks?.onSuccess?.();
      }
    } catch (error) {
      pendingWrites = Math.max(0, pendingWrites - 1);
      callbacks?.onError?.(error);
    }
  };

  const schedule = (snapshot: PersistedWallState) => {
    latest = snapshot;
    callbacks?.onSchedule?.();

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      void flush().catch(() => undefined);
    }, delayMs);
  };

  const markCommittedSnapshot = (snapshot: PersistedWallState) => {
    committedSnapshot = snapshot;
  };

  return { schedule, flush, markCommittedSnapshot };
};

export type TimelineEntry = {
  ts: number;
  snapshot: PersistedWallState;
};

const toEntityRecord = <TEntity extends { id: string }>(entities: TEntity[]) =>
  Object.fromEntries(entities.map((entity) => [entity.id, entity])) as Record<string, TEntity>;

const buildTimelineDeltaPayload = (
  previousSnapshot: PersistedWallState,
  nextSnapshot: PersistedWallState,
): TimelineDeltaPayload => {
  const plan = createWallSnapshotWritePlan(previousSnapshot, nextSnapshot);

  return {
    notes: plan.notesToPut.length > 0 ? toEntityRecord(plan.notesToPut) : undefined,
    deletedNoteIds: plan.noteIdsToDelete.length > 0 ? plan.noteIdsToDelete : undefined,
    zones: plan.zonesToPut.length > 0 ? toEntityRecord(plan.zonesToPut) : undefined,
    deletedZoneIds: plan.zoneIdsToDelete.length > 0 ? plan.zoneIdsToDelete : undefined,
    zoneGroups: plan.zoneGroupsToPut.length > 0 ? toEntityRecord(plan.zoneGroupsToPut) : undefined,
    deletedZoneGroupIds: plan.zoneGroupIdsToDelete.length > 0 ? plan.zoneGroupIdsToDelete : undefined,
    noteGroups: plan.noteGroupsToPut.length > 0 ? toEntityRecord(plan.noteGroupsToPut) : undefined,
    deletedNoteGroupIds: plan.noteGroupIdsToDelete.length > 0 ? plan.noteGroupIdsToDelete : undefined,
    links: plan.linksToPut.length > 0 ? toEntityRecord(plan.linksToPut) : undefined,
    deletedLinkIds: plan.linkIdsToDelete.length > 0 ? plan.linkIdsToDelete : undefined,
    camera: plan.cameraChanged ? nextSnapshot.camera : undefined,
    lastColor: plan.lastColorChanged ? nextSnapshot.lastColor : undefined,
  };
};

const applyTimelineDeltaPayload = (
  snapshot: PersistedWallState,
  delta: TimelineDeltaPayload,
): PersistedWallState => {
  const next: PersistedWallState = {
    notes: { ...snapshot.notes, ...(delta.notes ?? {}) },
    zones: { ...snapshot.zones, ...(delta.zones ?? {}) },
    zoneGroups: { ...snapshot.zoneGroups, ...(delta.zoneGroups ?? {}) },
    noteGroups: { ...snapshot.noteGroups, ...(delta.noteGroups ?? {}) },
    links: { ...snapshot.links, ...(delta.links ?? {}) },
    camera: delta.camera ?? snapshot.camera,
    lastColor: Object.prototype.hasOwnProperty.call(delta, "lastColor") ? delta.lastColor : snapshot.lastColor,
  };

  for (const id of delta.deletedNoteIds ?? []) {
    delete next.notes[id];
  }
  for (const id of delta.deletedZoneIds ?? []) {
    delete next.zones[id];
  }
  for (const id of delta.deletedZoneGroupIds ?? []) {
    delete next.zoneGroups[id];
  }
  for (const id of delta.deletedNoteGroupIds ?? []) {
    delete next.noteGroups[id];
  }
  for (const id of delta.deletedLinkIds ?? []) {
    delete next.links[id];
  }

  return next;
};

const parseTimelineRecordPayload = (
  payload: string,
): { kind: "checkpoint"; snapshot: PersistedWallState } | { kind: "delta"; delta: TimelineDeltaPayload } | null => {
  const legacySnapshot = parseTimelinePayload(payload);
  if (legacySnapshot) {
    return { kind: "checkpoint", snapshot: legacySnapshot };
  }

  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Partial<TimelineRecordPayload>;
    if (record.kind === "checkpoint" && record.snapshot) {
      const snapshot = normalizePersistedWallState(record.snapshot);
      return snapshot ? { kind: "checkpoint", snapshot } : null;
    }
    if (record.kind === "delta" && record.delta && typeof record.delta === "object" && !Array.isArray(record.delta)) {
      return { kind: "delta", delta: record.delta as TimelineDeltaPayload };
    }
  } catch {
    return null;
  }

  return null;
};

export const loadTimelineEntries = async (limit = 500): Promise<TimelineEntry[]> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const rows = await db.timelineSnapshots.orderBy("ts").toArray();
  const entries: TimelineEntry[] = [];
  let currentSnapshot: PersistedWallState | null = null;

  for (const row of rows) {
    const parsed = parseTimelineRecordPayload(row.payload);
    if (!parsed) {
      continue;
    }

    if (parsed.kind === "checkpoint") {
      currentSnapshot = parsed.snapshot;
    } else if (currentSnapshot) {
      currentSnapshot = applyTimelineDeltaPayload(currentSnapshot, parsed.delta);
    } else {
      continue;
    }

    entries.push({
      ts: row.ts,
      snapshot: currentSnapshot,
    });
  }

  return entries.slice(-limit);
};

const trimTimelineSnapshots = async (keepCount: number) => {
  const total = await db.timelineSnapshots.count();
  const overflow = Math.max(0, total - keepCount);
  if (overflow <= 0) {
    return;
  }

  const keys = await db.timelineSnapshots.orderBy("ts").limit(overflow).primaryKeys();
  if (keys.length > 0) {
    await db.timelineSnapshots.bulkDelete(keys);
  }
};

const persistTimelineSnapshot = async (
  snapshot: PersistedWallState,
  maxEntries: number,
  options?: { previousSnapshot?: PersistedWallState; entryIndex?: number },
) => {
  await migrateLegacyWallDatabaseIfNeeded();

  const shouldWriteCheckpoint =
    !options?.previousSnapshot ||
    typeof options.entryIndex !== "number" ||
    options.entryIndex % timelineCheckpointInterval === 0;
  const previousSnapshot = options?.previousSnapshot;
  const payload: TimelineRecordPayload = shouldWriteCheckpoint
    ? {
        kind: "checkpoint",
        snapshot,
      }
    : {
        kind: "delta",
        delta: buildTimelineDeltaPayload(previousSnapshot!, snapshot),
      };

  try {
    await db.timelineSnapshots.add({
      ts: Date.now(),
      payload: JSON.stringify(payload),
    });
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    await trimTimelineSnapshots(Math.max(25, Math.floor(maxEntries * 0.25)));
    return;
  }

  await trimTimelineSnapshots(maxEntries);
};

export const createTimelineRecorder = (options?: { delayMs?: number; minIntervalMs?: number; maxEntries?: number }) => {
  const delayMs = options?.delayMs ?? 1200;
  const minIntervalMs = options?.minIntervalMs ?? 1400;
  const maxEntries = options?.maxEntries ?? 500;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PersistedWallState | undefined;
  let lastSerialized = "";
  let lastWrittenAt = 0;
  let committedSnapshot: PersistedWallState | undefined;
  let entryIndex = 0;

  const flush = async () => {
    if (!latest) {
      return;
    }

    const serialized = JSON.stringify(latest);
    const now = Date.now();
    if (serialized === lastSerialized || now - lastWrittenAt < minIntervalMs) {
      return;
    }

    const snapshot = latest;
    latest = undefined;

    try {
      await persistTimelineSnapshot(snapshot, maxEntries, {
        previousSnapshot: committedSnapshot,
        entryIndex,
      });
      committedSnapshot = snapshot;
      entryIndex += 1;
      lastSerialized = serialized;
      lastWrittenAt = now;
    } catch {
      latest = snapshot;
    }
  };

  const schedule = (snapshot: PersistedWallState) => {
    latest = snapshot;
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      void flush().catch(() => undefined);
    }, delayMs);
  };

  const markCommittedSnapshot = (snapshot: PersistedWallState) => {
    committedSnapshot = snapshot;
  };

  return { schedule, flush, markCommittedSnapshot };
};

export const __test__ = {
  buildTimelineDeltaPayload,
  applyTimelineDeltaPayload,
  parseTimelineRecordPayload,
};
