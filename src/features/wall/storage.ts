import Dexie, { type Table } from "dexie";

import { decryptConfidentialPayload, encryptConfidentialPayload, isConfidentialEnvelope } from "@/lib/confidential-workspace";
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

type SecureRecord = {
  key: string;
  payload: string;
  updatedAt: number;
};

type SecureTimelineSnapshotRecord = {
  id?: number;
  ts: number;
  payload: string;
};

const wallDatabaseName = `${appSlug}-db`;
const legacyWallDatabaseName = `${legacyAppSlug}-db`;
const secureSnapshotKey = "secure-snapshot-v1";

class WallDatabase extends Dexie {
  notes!: Table<Note, string>;
  zones!: Table<Zone, string>;
  zoneGroups!: Table<ZoneGroup, string>;
  noteGroups!: Table<NoteGroup, string>;
  links!: Table<Link, string>;
  meta!: Table<MetaRecord, string>;
  timelineSnapshots!: Table<TimelineSnapshotRecord, number>;
  secure!: Table<SecureRecord, string>;
  secureTimelineSnapshots!: Table<SecureTimelineSnapshotRecord, number>;

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
      notes: "id, updatedAt",
      zones: "id, groupId, updatedAt",
      zoneGroups: "id, updatedAt",
      noteGroups: "id, updatedAt",
      links: "id, fromNoteId, toNoteId, updatedAt",
      meta: "key",
      timelineSnapshots: "++id, ts",
      secure: "key, updatedAt",
      secureTimelineSnapshots: "++id, ts",
    });
  }
}

const db = new WallDatabase(wallDatabaseName);
const legacyDb = new WallDatabase(legacyWallDatabaseName);
let migrationPromise: Promise<void> | null = null;

const defaultCamera: Camera = { x: 0, y: 0, zoom: 1 };

const databaseHasData = async (database: WallDatabase) => {
  const counts = await Promise.all([
    database.notes.count(),
    database.zones.count(),
    database.zoneGroups.count(),
    database.noteGroups.count(),
    database.links.count(),
    database.meta.count(),
    database.timelineSnapshots.count(),
    database.secure.count(),
    database.secureTimelineSnapshots.count(),
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

      const [notes, zones, zoneGroups, noteGroups, links, meta, timelineSnapshots, secure, secureTimelineSnapshots] = await Promise.all([
        legacyDb.notes.toArray(),
        legacyDb.zones.toArray(),
        legacyDb.zoneGroups.toArray(),
        legacyDb.noteGroups.toArray(),
        legacyDb.links.toArray(),
        legacyDb.meta.toArray(),
        legacyDb.timelineSnapshots.toArray(),
        legacyDb.secure.toArray().catch(() => []),
        legacyDb.secureTimelineSnapshots.toArray().catch(() => []),
      ]);

      await db.transaction(
        "rw",
        [db.notes, db.zones, db.zoneGroups, db.noteGroups, db.links, db.meta, db.timelineSnapshots, db.secure, db.secureTimelineSnapshots],
        async () => {
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
          if (secure.length > 0) {
            await db.secure.bulkPut(secure);
          }
          if (secureTimelineSnapshots.length > 0) {
            await db.secureTimelineSnapshots.bulkPut(secureTimelineSnapshots);
          }
        },
      );
    })();
  }

  await migrationPromise;
};

const loadLegacyWallSnapshot = async (): Promise<PersistedWallState> => {
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

const loadSecureWallSnapshot = async (passphrase: string): Promise<PersistedWallState | null> => {
  const row = await db.secure.get(secureSnapshotKey);
  if (!row) {
    return null;
  }

  const parsed = JSON.parse(row.payload) as unknown;
  if (!isConfidentialEnvelope(parsed)) {
    return null;
  }

  const decrypted = await decryptConfidentialPayload<PersistedWallState>(passphrase, parsed);
  return normalizePersistedWallState(decrypted) ?? { notes: {}, zones: {}, zoneGroups: {}, noteGroups: {}, links: {}, camera: defaultCamera };
};

export const hasLocalSecureWallSnapshot = async (): Promise<boolean> => {
  await migrateLegacyWallDatabaseIfNeeded();
  return Boolean(await db.secure.get(secureSnapshotKey));
};

export const verifyLocalWallSnapshotPassphrase = async (passphrase: string): Promise<boolean> => {
  await migrateLegacyWallDatabaseIfNeeded();

  const row = await db.secure.get(secureSnapshotKey);
  if (!row) {
    return false;
  }

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    if (!isConfidentialEnvelope(parsed)) {
      return false;
    }

    await decryptConfidentialPayload<PersistedWallState>(passphrase, parsed);
    return true;
  } catch {
    return false;
  }
};

const saveLegacyWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
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

const saveSecureWallSnapshot = async (snapshot: PersistedWallState, passphrase: string) => {
  const envelope = await encryptConfidentialPayload(passphrase, snapshot);
  await db.secure.put({
    key: secureSnapshotKey,
    payload: JSON.stringify(envelope),
    updatedAt: envelope.updatedAt,
  });
};

const loadLegacyTimelineEntries = async (limit: number): Promise<TimelineEntry[]> => {
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

const loadSecureTimelineEntries = async (limit: number, passphrase: string): Promise<TimelineEntry[]> => {
  const rows = await db.secureTimelineSnapshots.orderBy("ts").reverse().limit(limit).toArray();
  const entries = await Promise.all(
    rows.reverse().map(async (row) => {
      try {
        const parsed = JSON.parse(row.payload) as unknown;
        if (!isConfidentialEnvelope(parsed)) {
          return null;
        }
        const snapshot = await decryptConfidentialPayload<PersistedWallState>(passphrase, parsed);
        return { ts: row.ts, snapshot };
      } catch {
        return null;
      }
    }),
  );

  return entries.filter((entry): entry is TimelineEntry => Boolean(entry));
};

const migrateLegacyWallSnapshotToSecure = async (snapshot: PersistedWallState, passphrase?: string) => {
  if (!passphrase) {
    return;
  }

  const existing = await db.secure.get(secureSnapshotKey);
  if (!existing) {
    await saveSecureWallSnapshot(snapshot, passphrase);
  }
};

const migrateLegacyTimelineToSecure = async (entries: TimelineEntry[], passphrase?: string) => {
  if (!passphrase || entries.length === 0) {
    return;
  }

  const secureCount = await db.secureTimelineSnapshots.count();
  if (secureCount > 0) {
    return;
  }

  const payloads = await Promise.all(
    entries.map(async (entry) => ({
      ts: entry.ts,
      payload: JSON.stringify(await encryptConfidentialPayload(passphrase, entry.snapshot)),
    })),
  );
  if (payloads.length > 0) {
    await db.secureTimelineSnapshots.bulkPut(payloads);
  }
};

export const loadWallSnapshot = async (passphrase?: string): Promise<PersistedWallState> => {
  await migrateLegacyWallDatabaseIfNeeded();

  if (passphrase) {
    const secureSnapshot = await loadSecureWallSnapshot(passphrase);
    if (secureSnapshot) {
      return secureSnapshot;
    }
  }

  const legacySnapshot = await loadLegacyWallSnapshot();
  await migrateLegacyWallSnapshotToSecure(legacySnapshot, passphrase);
  return legacySnapshot;
};

export const saveWallSnapshot = async (snapshot: PersistedWallState, passphrase?: string): Promise<void> => {
  await migrateLegacyWallDatabaseIfNeeded();

  if (passphrase) {
    await saveSecureWallSnapshot(snapshot, passphrase);
    return;
  }

  await saveLegacyWallSnapshot(snapshot);
};

export const createSnapshotSaver = (
  passphrase?: string,
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
      await saveWallSnapshot(snapshot, passphrase);
      pendingWrites = Math.max(0, pendingWrites - 1);
      if (pendingWrites === 0) {
        callbacks?.onSuccess?.();
      }
    } catch (error) {
      pendingWrites = Math.max(0, pendingWrites - 1);
      callbacks?.onError?.(error);
      throw error;
    }
  };

  const schedule = (snapshot: PersistedWallState) => {
    latest = snapshot;
    callbacks?.onSchedule?.();

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      void flush();
    }, delayMs);
  };

  return { schedule, flush };
};

export type TimelineEntry = {
  ts: number;
  snapshot: PersistedWallState;
};

export const loadTimelineEntries = async (limit = 500, passphrase?: string): Promise<TimelineEntry[]> => {
  await migrateLegacyWallDatabaseIfNeeded();

  if (passphrase) {
    const secureEntries = await loadSecureTimelineEntries(limit, passphrase);
    if (secureEntries.length > 0) {
      return secureEntries;
    }
  }

  const legacyEntries = await loadLegacyTimelineEntries(limit);
  await migrateLegacyTimelineToSecure(legacyEntries, passphrase);
  return legacyEntries;
};

const persistTimelineSnapshot = async (snapshot: PersistedWallState, maxEntries: number, passphrase?: string) => {
  await migrateLegacyWallDatabaseIfNeeded();

  if (passphrase) {
    await db.secureTimelineSnapshots.add({
      ts: Date.now(),
      payload: JSON.stringify(await encryptConfidentialPayload(passphrase, snapshot)),
    });

    const count = await db.secureTimelineSnapshots.count();
    if (count > maxEntries) {
      const overflow = count - maxEntries;
      const keys = await db.secureTimelineSnapshots.orderBy("ts").limit(overflow).primaryKeys();
      if (keys.length > 0) {
        await db.secureTimelineSnapshots.bulkDelete(keys);
      }
    }
    return;
  }

  await db.timelineSnapshots.add({
    ts: Date.now(),
    payload: JSON.stringify(snapshot),
  });

  const count = await db.timelineSnapshots.count();
  if (count > maxEntries) {
    const overflow = count - maxEntries;
    const keys = await db.timelineSnapshots.orderBy("ts").limit(overflow).primaryKeys();
    if (keys.length > 0) {
      await db.timelineSnapshots.bulkDelete(keys);
    }
  }
};

export const createTimelineRecorder = (passphrase?: string, options?: { delayMs?: number; minIntervalMs?: number; maxEntries?: number }) => {
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
    await persistTimelineSnapshot(snapshot, maxEntries, passphrase);
    lastSerialized = serialized;
    lastWrittenAt = now;
  };

  const schedule = (snapshot: PersistedWallState) => {
    latest = snapshot;
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      void flush();
    }, delayMs);
  };

  return { schedule, flush };
};

