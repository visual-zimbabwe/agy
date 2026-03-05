import Dexie, { type Table } from "dexie";

import type { PageBlock, PersistedPageState } from "@/features/page/types";

type PageDocRecord = {
  id: string;
  snapshot: PersistedPageState;
  updatedAt: number;
};

class IdeaWallPageDatabase extends Dexie {
  pageDocs!: Table<PageDocRecord, string>;

  constructor() {
    super("idea-wall-page-db");
    this.version(1).stores({
      pageDocs: "id, updatedAt",
    });
  }
}

const defaultPageDocId = "default";
const db = new IdeaWallPageDatabase();
const defaultCamera = { x: 0, y: 0, zoom: 1 } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeBlock = (value: unknown, index: number): PageBlock | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" && value.id.length > 0 ? value.id : `blk_${Math.random().toString(36).slice(2, 10)}`;
  const type = typeof value.type === "string" ? value.type : "text";
  const content = typeof value.content === "string" ? value.content : "";
  const x = typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 80;
  const y = typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 80 + index * 86;
  const w = typeof value.w === "number" && Number.isFinite(value.w) ? value.w : 360;
  const h = typeof value.h === "number" && Number.isFinite(value.h) ? value.h : 88;
  const indent = typeof value.indent === "number" && Number.isFinite(value.indent) ? Math.max(0, Math.floor(value.indent)) : undefined;
  const textColor = typeof value.textColor === "string" ? value.textColor : undefined;
  const backgroundColor = typeof value.backgroundColor === "string" ? value.backgroundColor : undefined;
  const checked = typeof value.checked === "boolean" ? value.checked : undefined;
  const expanded = typeof value.expanded === "boolean" ? value.expanded : undefined;

  const fileValue = value.file;
  const file = isRecord(fileValue) &&
    typeof fileValue.path === "string" &&
    typeof fileValue.name === "string" &&
    typeof fileValue.size === "number" &&
    typeof fileValue.mimeType === "string"
      ? {
          path: fileValue.path,
          name: fileValue.name,
          size: fileValue.size,
          mimeType: fileValue.mimeType,
          displayName: typeof fileValue.displayName === "string" && fileValue.displayName.trim().length > 0 ? fileValue.displayName : fileValue.name,
        }
      : undefined;

  return {
    id,
    type: type as PageBlock["type"],
    content,
    x,
    y,
    w,
    h,
    indent,
    textColor,
    backgroundColor,
    checked,
    expanded,
    file,
  };
};

const normalizeSnapshot = (value: unknown): PersistedPageState | null => {
  if (!isRecord(value)) {
    return null;
  }

  const blocksRaw = Array.isArray(value.blocks) ? value.blocks : [];
  const blocks = blocksRaw.map((entry, index) => normalizeBlock(entry, index)).filter((entry): entry is PageBlock => Boolean(entry));

  const cameraValue = value.camera;
  const camera =
    isRecord(cameraValue) &&
    typeof cameraValue.x === "number" &&
    typeof cameraValue.y === "number" &&
    typeof cameraValue.zoom === "number"
      ? { x: cameraValue.x, y: cameraValue.y, zoom: cameraValue.zoom }
      : defaultCamera;

  const updatedAt = typeof value.updatedAt === "number" ? value.updatedAt : Date.now();

  return {
    blocks,
    camera,
    updatedAt,
  };
};

export const loadPageSnapshot = async (): Promise<PersistedPageState | null> => {
  const row = await db.pageDocs.get(defaultPageDocId);
  if (!row?.snapshot) {
    return null;
  }
  return normalizeSnapshot(row.snapshot);
};

export const savePageSnapshot = async (snapshot: PersistedPageState): Promise<void> => {
  await db.pageDocs.put({
    id: defaultPageDocId,
    snapshot,
    updatedAt: Date.now(),
  });
};

export const createPageSnapshotSaver = (delayMs = 300) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PersistedPageState | undefined;

  const flush = async () => {
    if (!latest) {
      return;
    }
    const snapshot = latest;
    latest = undefined;
    await savePageSnapshot(snapshot);
  };

  const schedule = (snapshot: PersistedPageState) => {
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
