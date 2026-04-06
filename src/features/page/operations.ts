import type { PageBlock, PageCamera, PageCover, PersistedPageState } from "@/features/page/types";

export type PageOperation =
  | {
      type: "replace_blocks";
      blocks: PageBlock[];
    }
  | {
      type: "set_camera";
      camera: PageCamera;
    }
  | {
      type: "set_cover";
      cover?: PageCover;
    };

export type CloudPageDocument = {
  docId: string;
  snapshot: PersistedPageState;
  revision: number;
  updatedAt: string | null;
  createdAt: string | null;
};

type StoredCloudPageSnapshot =
  | PersistedPageState
  | {
      state?: PersistedPageState;
      revision?: number;
    };

export const emptyPageSnapshot: PersistedPageState = {
  blocks: [],
  camera: { x: 0, y: 0, zoom: 1 },
  updatedAt: 0,
  cover: undefined,
};

export const parseStoredCloudPageSnapshot = (
  value: StoredCloudPageSnapshot | null | undefined,
): { snapshot: PersistedPageState | null; revision: number } => {
  if (!value || typeof value !== "object") {
    return { snapshot: null, revision: 0 };
  }

  if ("state" in value && value.state && typeof value.revision === "number") {
    return {
      snapshot: value.state,
      revision: Math.max(0, Math.trunc(value.revision)),
    };
  }

  return {
    snapshot: value as PersistedPageState,
    revision: 0,
  };
};

export const buildStoredCloudPageSnapshot = (snapshot: PersistedPageState, revision: number) => ({
  state: snapshot,
  revision,
});

export const derivePageOperations = (
  previousSnapshot: PersistedPageState | null,
  nextSnapshot: PersistedPageState,
): PageOperation[] => {
  const operations: PageOperation[] = [];
  const previous = previousSnapshot ?? emptyPageSnapshot;

  if (JSON.stringify(previous.blocks) !== JSON.stringify(nextSnapshot.blocks)) {
    operations.push({ type: "replace_blocks", blocks: nextSnapshot.blocks });
  }

  if (JSON.stringify(previous.camera) !== JSON.stringify(nextSnapshot.camera)) {
    operations.push({ type: "set_camera", camera: nextSnapshot.camera });
  }

  if (JSON.stringify(previous.cover ?? null) !== JSON.stringify(nextSnapshot.cover ?? null)) {
    operations.push({ type: "set_cover", cover: nextSnapshot.cover });
  }

  return operations;
};

export const applyPageOperations = (
  baseSnapshot: PersistedPageState | null,
  operations: PageOperation[],
): PersistedPageState => {
  const nextSnapshot: PersistedPageState = {
    ...(baseSnapshot ?? emptyPageSnapshot),
    blocks: baseSnapshot?.blocks ?? [],
    camera: baseSnapshot?.camera ?? emptyPageSnapshot.camera,
    cover: baseSnapshot?.cover,
    updatedAt: Date.now(),
  };

  for (const operation of operations) {
    switch (operation.type) {
      case "replace_blocks":
        nextSnapshot.blocks = operation.blocks;
        break;
      case "set_camera":
        nextSnapshot.camera = operation.camera;
        break;
      case "set_cover":
        nextSnapshot.cover = operation.cover;
        break;
    }
  }

  nextSnapshot.updatedAt = Date.now();
  return nextSnapshot;
};
