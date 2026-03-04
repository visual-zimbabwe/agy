import Dexie, { type Table } from "dexie";

import type { PersistedPageState } from "@/features/page/types";

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

export const loadPageSnapshot = async (): Promise<PersistedPageState | null> => {
  const row = await db.pageDocs.get(defaultPageDocId);
  return row?.snapshot ?? null;
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

