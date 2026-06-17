"use client";

import { useCallback, useRef, useState } from "react";

import { loadWallBootstrap, loadWallDelta, pushWallDelta } from "@/features/wall/cloud-delta";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { saveWallCloudBaselineSnapshot, saveWallSyncVersion } from "@/features/wall/storage";
import {
  applyWallDeltaChanges,
  buildWallDeltaSyncRequest,
  hasWallDeltaChanges,
  rebaseLocalWallSnapshot,
  stageWallSyncRequest,
  takeNextQueuedWallSync,
  type WallSyncRequest,
} from "@/features/wall/sync";
import type { PersistedWallState } from "@/features/wall/types";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";

type UseWallCloudSyncOptions = {
  publishedReadOnly: boolean;
  hydrate: (snapshot: PersistedWallState) => void;
};

export const useWallCloudSync = ({ publishedReadOnly, hydrate }: UseWallCloudSyncOptions) => {
  const [cloudWallId, setCloudWallId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localSaveState, setLocalSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [hasPendingSync, setHasPendingSync] = useState(false);

  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSyncInFlightRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const queuedCloudSyncRef = useRef<WallSyncRequest | null>(null);
  const cloudWallUpdatedAtRef = useRef<string | null>(null);
  const acknowledgedCloudSnapshotRef = useRef<PersistedWallState | null>(null);
  const cloudSyncVersionRef = useRef(0);
  const lastCloudSyncedAtRef = useRef<number>(0);

  const fetchLatestCloudSnapshot = useCallback(async (wallId: string) => {
    if (acknowledgedCloudSnapshotRef.current && cloudSyncVersionRef.current > 0) {
      try {
        const deltaPayload = await loadWallDelta(wallId, cloudSyncVersionRef.current);
        return {
          snapshot: applyWallDeltaChanges(acknowledgedCloudSnapshotRef.current, deltaPayload.changes),
          syncVersion: deltaPayload.currentVersion,
        };
      } catch (error) {
        if (error instanceof Error && error.message === authExpiredMessage) {
          throw error;
        }
      }
    }

    return await loadWallBootstrap(wallId);
  }, []);

  const syncSnapshotToCloud = useCallback(
    async (wallId: string, snapshot: PersistedWallState) => {
      if (publishedReadOnly) {
        return;
      }

      const stagedRequest = stageWallSyncRequest({
        inFlight: cloudSyncInFlightRef.current,
        next: { wallId, snapshot },
      });
      if (!stagedRequest.active) {
        queuedCloudSyncRef.current = stagedRequest.queued;
        setHasPendingSync(true);
        return;
      }

      cloudSyncInFlightRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const delta = buildWallDeltaSyncRequest({
          baseVersion: cloudSyncVersionRef.current,
          baseline: acknowledgedCloudSnapshotRef.current,
          current: snapshot,
        });
        if (!hasWallDeltaChanges(delta)) {
          acknowledgedCloudSnapshotRef.current = snapshot;
          await Promise.all([
            saveWallSyncVersion(cloudSyncVersionRef.current),
            saveWallCloudBaselineSnapshot(snapshot),
          ]);
          setHasPendingSync(false);
          return;
        }

        const response = await pushWallDelta(wallId, delta);

        if (response.status === 401) {
          setSyncError(authExpiredMessage);
          redirectToLoginForAuth("/wall");
          return;
        }

        if (response.status === 409) {
          const latestPayload = await fetchLatestCloudSnapshot(wallId);
          cloudSyncVersionRef.current = latestPayload.syncVersion;
          acknowledgedCloudSnapshotRef.current = latestPayload.snapshot;
          await Promise.all([
            saveWallSyncVersion(latestPayload.syncVersion),
            saveWallCloudBaselineSnapshot(latestPayload.snapshot),
          ]);

          const latestLocalSnapshot = selectPersistedSnapshot(useWallStore.getState());
          const rebasedSnapshot = rebaseLocalWallSnapshot(latestPayload.snapshot, latestLocalSnapshot);
          const serverSerialized = JSON.stringify(latestPayload.snapshot);
          const rebasedSerialized = JSON.stringify(rebasedSnapshot);

          hydrate(rebasedSnapshot);

          if (rebasedSerialized !== serverSerialized) {
            queuedCloudSyncRef.current = { wallId, snapshot: rebasedSnapshot };
            setHasPendingSync(true);
          } else {
            const syncedAt = Date.now();
            lastCloudSyncedAtRef.current = syncedAt;
            setLastSyncedAt(syncedAt);
            setHasPendingSync(false);
          }

          setSyncError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(response.payload.error ?? "Cloud sync failed");
        }

        cloudSyncVersionRef.current = response.payload.currentVersion ?? cloudSyncVersionRef.current;
        acknowledgedCloudSnapshotRef.current = snapshot;
        await Promise.all([
          saveWallSyncVersion(cloudSyncVersionRef.current),
          saveWallCloudBaselineSnapshot(snapshot),
        ]);
        const syncedAt = Date.now();
        lastCloudSyncedAtRef.current = syncedAt;
        setLastSyncedAt(syncedAt);
        setHasPendingSync(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cloud sync failed";
        setSyncError(message);
        if (message === authExpiredMessage) {
          redirectToLoginForAuth("/wall");
        }
      } finally {
        cloudSyncInFlightRef.current = false;
        const queued = takeNextQueuedWallSync(queuedCloudSyncRef.current);
        queuedCloudSyncRef.current = queued.queued;
        if (queued.next) {
          void syncSnapshotToCloud(queued.next.wallId, queued.next.snapshot);
          return;
        }
        setIsSyncing(false);
      }
    },
    [fetchLatestCloudSnapshot, hydrate, publishedReadOnly],
  );

  const scheduleCloudSync = useCallback(
    (snapshot: PersistedWallState) => {
      if (!cloudWallId || !cloudReadyRef.current || publishedReadOnly) {
        return;
      }

      setHasPendingSync(true);
      setSyncError(null);

      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }

      cloudSyncTimerRef.current = setTimeout(() => {
        void syncSnapshotToCloud(cloudWallId, snapshot);
      }, 1400);
    },
    [cloudWallId, publishedReadOnly, syncSnapshotToCloud],
  );

  const syncNow = useCallback(() => {
    if (!cloudWallId) {
      return;
    }
    const snapshot = selectPersistedSnapshot(useWallStore.getState());
    void syncSnapshotToCloud(cloudWallId, snapshot);
  }, [cloudWallId, syncSnapshotToCloud]);

  const handleLocalSaveStateChange = useCallback((state: "saving" | "saved" | "error") => {
    if (state === "saving") {
      setLocalSaveState("saving");
      return;
    }
    if (state === "error") {
      setLocalSaveState("error");
      return;
    }
    setLocalSaveState("idle");
  }, []);

  return {
    cloudWallId,
    setCloudWallId,
    syncError,
    setSyncError,
    lastSyncedAt,
    isSyncing,
    localSaveState,
    hasPendingSync,
    cloudSyncTimerRef,
    cloudSyncInFlightRef,
    cloudReadyRef,
    queuedCloudSyncRef,
    cloudWallUpdatedAtRef,
    acknowledgedCloudSnapshotRef,
    cloudSyncVersionRef,
    scheduleCloudSync,
    syncSnapshotToCloud,
    syncNow,
    handleLocalSaveStateChange,
  };
};
