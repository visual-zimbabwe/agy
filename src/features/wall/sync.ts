import { mergeSnapshotsLww } from "@/features/wall/cloud";
import type { PersistedWallState } from "@/features/wall/types";

export type WallSyncRequest = {
  wallId: string;
  snapshot: PersistedWallState;
};

export const shouldRejectWallSync = (expectedWallUpdatedAt?: string, currentWallUpdatedAt?: string | null) =>
  Boolean(expectedWallUpdatedAt && currentWallUpdatedAt && expectedWallUpdatedAt !== currentWallUpdatedAt);

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
