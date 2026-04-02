import Dexie, { type Table } from "dexie";

import type { Camera, Link, Note, NoteGroup, PersistedWallState, Zone, ZoneGroup } from "@/features/wall/types";
import { normalizePersistedWallState, parseTimelinePayload } from "@/features/wall/storage-migrations";
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
  }
}

const db = new WallDatabase(wallDatabaseName);
const legacyDb = new WallDatabase(legacyWallDatabaseName);
let migrationPromise: Promise<void> | null = null;

const defaultCamera: Camera = { x: 0, y: 0, zoom: 1 };

const isQuotaExceededError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  return name.includes("quota") || name.includes("abort") || message.includes("quotaexceeded") || message.includes("quota exceeded");
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

export const saveWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
  await migrateLegacyWallDatabaseIfNeeded();

  try {
    await writeWallSnapshot(snapshot);
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    await db.timelineSnapshots.clear();
    await writeWallSnapshot(snapshot);
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

  const flush = async () => {
    if (!latest) {
      return;
    }

    const snapshot = latest;
    latest = undefined;
    pendingWrites += 1;

    try {
      await saveWallSnapshot(snapshot);
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

  return { schedule, flush };
};

export type TimelineEntry = {
  ts: number;
  snapshot: PersistedWallState;
};

export const loadTimelineEntries = async (limit = 500): Promise<TimelineEntry[]> => {
  await migrateLegacyWallDatabaseIfNeeded();
  const rows = await db.timelineSnapshots.orderBy("ts").reverse().limit(limit).toArray();
  return rows
    .reverse()
    .map((row) => {
      const snapshot = parseTimelinePayload(row.payload);
      if (!snapshot) {
        return null;
      }
      return { ts: row.ts, snapshot };
    })
    .filter((entry): entry is TimelineEntry => Boolean(entry));
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

const persistTimelineSnapshot = async (snapshot: PersistedWallState, maxEntries: number) => {
  await migrateLegacyWallDatabaseIfNeeded();

  try {
    await db.timelineSnapshots.add({
      ts: Date.now(),
      payload: JSON.stringify(snapshot),
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
      await persistTimelineSnapshot(snapshot, maxEntries);
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

  return { schedule, flush };
};
