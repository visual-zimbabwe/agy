import Dexie, { type Table } from "dexie";

import type { Camera, Link, Note, PersistedWallState, Zone, ZoneGroup } from "@/features/wall/types";

type MetaRecord = {
  key: string;
  value: string;
};

type TimelineSnapshotRecord = {
  id?: number;
  ts: number;
  payload: string;
};

class IdeaWallDatabase extends Dexie {
  notes!: Table<Note, string>;
  zones!: Table<Zone, string>;
  zoneGroups!: Table<ZoneGroup, string>;
  links!: Table<Link, string>;
  meta!: Table<MetaRecord, string>;
  timelineSnapshots!: Table<TimelineSnapshotRecord, number>;

  constructor() {
    super("idea-wall-db");
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
  }
}

const db = new IdeaWallDatabase();

const defaultCamera: Camera = { x: 0, y: 0, zoom: 1 };

export const loadWallSnapshot = async (): Promise<PersistedWallState> => {
  const [notesList, zonesList, zoneGroupsList, linksList, cameraMeta, lastColorMeta] = await Promise.all([
    db.notes.toArray(),
    db.zones.toArray(),
    db.zoneGroups.toArray(),
    db.links.toArray(),
    db.meta.get("camera"),
    db.meta.get("lastColor"),
  ]);

  const notes = Object.fromEntries(notesList.map((note) => [note.id, { ...note, tags: note.tags ?? [] }]));
  const zones = Object.fromEntries(zonesList.map((zone) => [zone.id, zone]));
  const zoneGroups = Object.fromEntries(zoneGroupsList.map((group) => [group.id, group]));
  const links = Object.fromEntries(linksList.map((link) => [link.id, link]));

  return {
    notes,
    zones,
    zoneGroups,
    links,
    camera: cameraMeta ? (JSON.parse(cameraMeta.value) as Camera) : defaultCamera,
    lastColor: lastColorMeta?.value,
  };
};

export const saveWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
  await db.transaction("rw", [db.notes, db.zones, db.zoneGroups, db.links, db.meta], async () => {
    const notes = Object.values(snapshot.notes);
    const zones = Object.values(snapshot.zones);
    const zoneGroups = Object.values(snapshot.zoneGroups);
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

export const createSnapshotSaver = (delayMs = 350) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PersistedWallState | undefined;

  const flush = async () => {
    if (!latest) {
      return;
    }

    const snapshot = latest;
    latest = undefined;
    await saveWallSnapshot(snapshot);
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

export type TimelineEntry = {
  ts: number;
  snapshot: PersistedWallState;
};

const parseTimelinePayload = (payload: string): PersistedWallState => {
  const parsed = JSON.parse(payload) as PersistedWallState;
  const notes = Object.fromEntries(
    Object.entries(parsed.notes).map(([id, note]) => [id, { ...note, tags: note.tags ?? [] }]),
  );

  return {
    ...parsed,
    notes,
    zoneGroups: parsed.zoneGroups ?? {},
    links: parsed.links ?? {},
  };
};

export const loadTimelineEntries = async (limit = 500): Promise<TimelineEntry[]> => {
  const rows = await db.timelineSnapshots.orderBy("ts").reverse().limit(limit).toArray();
  return rows
    .reverse()
    .map((row) => ({
      ts: row.ts,
      snapshot: parseTimelinePayload(row.payload),
    }));
};

const persistTimelineSnapshot = async (snapshot: PersistedWallState, maxEntries: number) => {
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
    await persistTimelineSnapshot(snapshot, maxEntries);
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
