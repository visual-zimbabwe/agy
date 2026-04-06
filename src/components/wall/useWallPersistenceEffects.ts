"use client";

import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { hasContent, hasMeaningfulContent } from "@/features/wall/cloud";
import { loadWallBootstrap, loadWallDelta, loadWallShell, loadWallWindow } from "@/features/wall/cloud-delta";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { applyWallDeltaChanges, createSkippedRemoteSnapshotTracker, resolveWallBootstrapSnapshot } from "@/features/wall/sync";
import { mergeWallWindowIntoSnapshot } from "@/features/wall/windowing";
import {
  createSnapshotSaver,
  createTimelineRecorder,
  loadWallCameraState,
  loadWallLocalStateWithRepair,
  loadWallWindowSnapshot,
  saveWallSnapshot,
  saveWallCloudBaselineSnapshot,
  saveWallSyncVersion,
  type TimelineEntry,
} from "@/features/wall/storage";
import { recordWallStartupCheckpoint, recordWallTelemetryMetric } from "@/features/wall/telemetry";
import type { Camera, PersistedWallState, WallAssetMap, WallWindowBounds } from "@/features/wall/types";
import { defaultWallTitle } from "@/lib/brand";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type UseWallPersistenceEffectsOptions = {
  hydrate: (state: PersistedWallState) => void;
  publishedReadOnly: boolean;
  scheduleCloudSync: (snapshot: PersistedWallState) => void;
  syncSnapshotToCloud: (cloudWallId: string, snapshot: PersistedWallState) => Promise<void>;
  setAcknowledgedCloudSnapshot: (snapshot: PersistedWallState | null) => void;
  setCloudSyncVersion: (value: number) => void;
  setCloudWallUpdatedAt: (value: string | null) => void;
  setCloudWallId: (id: string | null) => void;
  setWallAssets: (assets: WallAssetMap) => void;
  setTimelineEntries: Dispatch<SetStateAction<TimelineEntry[]>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  setSyncError: (value: string | null) => void;
  onLocalSaveStateChange: (state: "saving" | "saved" | "error") => void;
  cloudReadyRef: MutableRefObject<boolean>;
  cloudSyncTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastTimelineSerialized: MutableRefObject<string>;
  lastTimelineRecordedAt: MutableRefObject<number>;
  getViewportWindowBounds: (camera: Camera) => WallWindowBounds;
};

const lastCloudWallStorageKey = "agy-last-cloud-wall-id";
const localBootstrapTimeoutMs = 3000;
const emptyWallIdList: string[] = [];
const emptyWallSnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

const chooseInitialWallId = ({
  preferredWallId,
  listedWallIds,
}: {
  preferredWallId: string | null;
  listedWallIds: string[];
}) => {
  if (preferredWallId && listedWallIds.includes(preferredWallId)) {
    return preferredWallId;
  }

  return listedWallIds[0] ?? null;
};

export const useWallPersistenceEffects = ({
  hydrate,
  publishedReadOnly,
  scheduleCloudSync,
  syncSnapshotToCloud,
  setAcknowledgedCloudSnapshot,
  setCloudSyncVersion,
  setCloudWallUpdatedAt,
  setCloudWallId,
  setWallAssets,
  setTimelineEntries,
  setTimelineIndex,
  setSyncError,
  onLocalSaveStateChange,
  cloudReadyRef,
  cloudSyncTimerRef,
  lastTimelineSerialized,
  lastTimelineRecordedAt,
  getViewportWindowBounds,
}: UseWallPersistenceEffectsOptions) => {
  const lastPersistedSerializedRef = useRef("");
  const skippedRemoteSnapshotsRef = useRef(createSkippedRemoteSnapshotTracker());
  const persistenceReadyRef = useRef(false);
  const inMemoryTimelineLimit = 120;
  const hydrateRef = useRef(hydrate);
  const scheduleCloudSyncRef = useRef(scheduleCloudSync);
  const setAcknowledgedCloudSnapshotRef = useRef(setAcknowledgedCloudSnapshot);
  const setCloudSyncVersionRef = useRef(setCloudSyncVersion);
  const setCloudWallUpdatedAtRef = useRef(setCloudWallUpdatedAt);
  const setCloudWallIdRef = useRef(setCloudWallId);
  const setSyncErrorRef = useRef(setSyncError);
  const onLocalSaveStateChangeRef = useRef(onLocalSaveStateChange);
  const getViewportWindowBoundsRef = useRef(getViewportWindowBounds);

  useEffect(() => {
    hydrateRef.current = hydrate;
    scheduleCloudSyncRef.current = scheduleCloudSync;
    setAcknowledgedCloudSnapshotRef.current = setAcknowledgedCloudSnapshot;
    setCloudSyncVersionRef.current = setCloudSyncVersion;
    setCloudWallUpdatedAtRef.current = setCloudWallUpdatedAt;
    setCloudWallIdRef.current = setCloudWallId;
    setSyncErrorRef.current = setSyncError;
    onLocalSaveStateChangeRef.current = onLocalSaveStateChange;
    getViewportWindowBoundsRef.current = getViewportWindowBounds;
  }, [
    getViewportWindowBounds,
    hydrate,
    onLocalSaveStateChange,
    scheduleCloudSync,
    setAcknowledgedCloudSnapshot,
    setCloudSyncVersion,
    setCloudWallId,
    setCloudWallUpdatedAt,
    setSyncError,
  ]);

  useEffect(() => {
    const saver = createSnapshotSaver(320, {
      onSchedule: () => onLocalSaveStateChangeRef.current("saving"),
      onSuccess: () => onLocalSaveStateChangeRef.current("saved"),
      onError: () => onLocalSaveStateChangeRef.current("error"),
    });
    const timelineRecorder = createTimelineRecorder({ delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    const timer = cloudSyncTimerRef.current;
    let cancelled = false;

    const markHydrated = (
      snapshot: PersistedWallState,
      options?: { degraded?: boolean; loadStartedAt?: number; complete?: boolean },
    ) => {
      lastPersistedSerializedRef.current = JSON.stringify(snapshot);
      persistenceReadyRef.current = Boolean(options?.complete);
      if (options?.complete) {
        saver.markCommittedSnapshot(snapshot);
        timelineRecorder.markCommittedSnapshot(snapshot);
      }

      if (!cancelled) {
        hydrateRef.current(snapshot);
      }

      if (typeof options?.loadStartedAt === "number") {
        const durationMs = performance.now() - options.loadStartedAt;
        recordWallTelemetryMetric(options.degraded ? "startupRecoveryMs" : "startupHydrateMs", durationMs);
        recordWallStartupCheckpoint("hydrate-completed", {
          durationMs,
          detail: options.degraded ? "degraded-local-bootstrap" : "local-bootstrap",
        });
      }
    };

    const load = async () => {
      // Published read-only snapshots have nothing to do with private local state.
      // Exit immediately so we never touch IndexedDB, mutate the store, or record
      // local-bootstrap telemetry on behalf of a public/shared viewer.
      if (publishedReadOnly || cancelled) {
        if (!cancelled) {
          hydrateRef.current(emptyWallSnapshot);
        }
        return;
      }

      const loadStartedAt = performance.now();
      recordWallStartupCheckpoint("local-bootstrap-started");

      const fullLocalBootstrapTask = loadWallLocalStateWithRepair()
        .then((value) => ({
          status: "resolved" as const,
          value: [value.snapshot, value.cloudBaselineSnapshot, value.syncVersion] as const,
        }))
        .catch((error) => ({ status: "rejected" as const, error }));

      const localBootstrapTask = loadWallCameraState()
        .then(({ camera }) => loadWallWindowSnapshot(getViewportWindowBoundsRef.current(camera)))
        .then((value) => ({ status: "resolved" as const, value }))
        .catch((error) => ({ status: "rejected" as const, error }));

      const localBootstrapResult = await Promise.race([
        localBootstrapTask,
        new Promise<{ status: "timeout" }>((resolve) => {
          setTimeout(() => resolve({ status: "timeout" }), localBootstrapTimeoutMs);
        }),
      ]);

      let snapshot = emptyWallSnapshot;
      let degradedLocalBootstrap = false;

      if (localBootstrapResult.status === "resolved") {
        snapshot = localBootstrapResult.value;
        const durationMs = performance.now() - loadStartedAt;
        recordWallTelemetryMetric("startupLocalBootstrapMs", durationMs);
        recordWallStartupCheckpoint("local-bootstrap-completed", { durationMs });
        markHydrated(snapshot, { loadStartedAt, complete: false });
      } else {
        degradedLocalBootstrap = true;
        const durationMs = performance.now() - loadStartedAt;
        if (localBootstrapResult.status === "timeout") {
          recordWallStartupCheckpoint("local-bootstrap-timeout", {
            durationMs,
            detail: `exceeded-${localBootstrapTimeoutMs}ms`,
          });
        } else {
          const detail = localBootstrapResult.error instanceof Error ? localBootstrapResult.error.message : "unknown-local-bootstrap-error";
          recordWallStartupCheckpoint("local-bootstrap-failed", { durationMs, detail });
        }
        markHydrated(emptyWallSnapshot, { degraded: true, loadStartedAt, complete: false });
      }

      if (cancelled) {
        return;
      }

      try {
        const cloudBootstrapStartedAt = performance.now();
        recordWallStartupCheckpoint("cloud-bootstrap-started", degradedLocalBootstrap ? { detail: "degraded-local-bootstrap" } : undefined);
        let localBaselineSnapshot: PersistedWallState | null = null;
        let localSyncVersion = 0;
        let fullLocalSnapshot: PersistedWallState | null = null;
        const preferredWallId = readStorageValue(lastCloudWallStorageKey);
        const listWalls = async () => {
          const listResponse = await fetch("/api/walls", { cache: "no-store" });
          if (listResponse.status === 401) {
            throw new Error(authExpiredMessage);
          }
          if (!listResponse.ok) {
            const payload = (await listResponse.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error ?? "Unable to load walls");
          }

          const listPayload = (await listResponse.json()) as { walls: Array<{ id: string }> };
          return listPayload.walls.map((wall) => wall.id);
        };

        const createWall = async () => {
          const createResponse = await fetch("/api/walls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: defaultWallTitle }),
          });
          if (createResponse.status === 401) {
            throw new Error(authExpiredMessage);
          }
          if (!createResponse.ok) {
            const payload = (await createResponse.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error ?? "Unable to create wall");
          }
          const createdPayload = (await createResponse.json()) as { wall: { id: string } };
          return createdPayload.wall.id;
        };

        const loadCloudBaselineState = async (candidateWallId: string, knownWallIds: string[]) => {
          const canUseStoredDelta =
            localBaselineSnapshot &&
            localSyncVersion > 0 &&
            (knownWallIds.length <= 1 || candidateWallId === preferredWallId);

          if (canUseStoredDelta) {
            try {
              const baselineSnapshot = localBaselineSnapshot;
              const deltaPayload = await loadWallDelta(candidateWallId, localSyncVersion);
              return {
                snapshot: applyWallDeltaChanges(baselineSnapshot!, deltaPayload.changes),
                syncVersion: deltaPayload.currentVersion,
              };
            } catch (error) {
              if (error instanceof Error && error.message === authExpiredMessage) {
                throw error;
              }
            }
          }

          return await loadWallBootstrap(candidateWallId);
        };

        const fullLocalBootstrapResult = await fullLocalBootstrapTask;
        if (fullLocalBootstrapResult.status === "resolved") {
          const [loadedFullLocalSnapshot, loadedBaselineSnapshot, loadedSyncVersion] = fullLocalBootstrapResult.value;
          fullLocalSnapshot = loadedFullLocalSnapshot;
          localBaselineSnapshot = loadedBaselineSnapshot;
          localSyncVersion = loadedSyncVersion;

          const localSerialized = JSON.stringify(loadedFullLocalSnapshot);
          skippedRemoteSnapshotsRef.current.remember(localSerialized);
          lastPersistedSerializedRef.current = localSerialized;
          persistenceReadyRef.current = true;
          saver.markCommittedSnapshot(loadedFullLocalSnapshot);
          timelineRecorder.markCommittedSnapshot(loadedFullLocalSnapshot);
          useWallStore.getState().mergeHydratedSnapshot(loadedFullLocalSnapshot, {
            updateCamera: false,
            updateLastColor: true,
          });
          snapshot = loadedFullLocalSnapshot;
        }
        const listedWallIds = await listWalls().catch((error) => {
          if (error instanceof Error && error.message === authExpiredMessage) {
            throw error;
          }
          return emptyWallIdList;
        });

        let wallId = chooseInitialWallId({
          preferredWallId: preferredWallId ?? null,
          listedWallIds,
        });

        if (!wallId) {
          wallId = await createWall();
        }

        if (!wallId) {
          throw new Error("No wall available");
        }

        const shell = await loadWallShell(wallId);
        const interactiveBounds = getViewportWindowBoundsRef.current(useWallStore.getState().camera);
        const interactiveWindow = await loadWallWindow(wallId, interactiveBounds);
        const interactiveState = useWallStore.getState();
        const interactiveSnapshot = mergeWallWindowIntoSnapshot(
          selectPersistedSnapshot(interactiveState),
          interactiveWindow.snapshot,
        );

        writeStorageValue(lastCloudWallStorageKey, wallId);
        setCloudWallIdRef.current(wallId);
        setCloudSyncVersionRef.current(shell.syncVersion);
        setCloudWallUpdatedAtRef.current(shell.updatedAt ?? null);

        if (!cancelled) {
          skippedRemoteSnapshotsRef.current.remember(JSON.stringify(interactiveSnapshot));
          interactiveState.mergeHydratedSnapshot(interactiveWindow.snapshot, {
            updateCamera: false,
            updateLastColor: true,
          });
          setSyncErrorRef.current(null);
        }

        const knownWallIds = listedWallIds.length > 0 ? listedWallIds : [wallId];
        const baselinePayload = await loadCloudBaselineState(wallId, knownWallIds);
        const serverSnapshot = baselinePayload.snapshot;
        const serverSyncVersion = baselinePayload.syncVersion;
        const migrationKey = `agy-cloud-imported-v1:${wallId}`;
        const legacyMigrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !readStorageValue(migrationKey, [legacyMigrationKey]);
        const latestLocalSnapshot = selectPersistedSnapshot(useWallStore.getState());
        const { hasUnsyncedLocalShadow, nextSnapshot, replaySnapshot: initialReplaySnapshot } = resolveWallBootstrapSnapshot({
          serverSnapshot,
          fullLocalSnapshot,
          localBaselineSnapshot,
          latestLocalSnapshot,
          localSyncVersion,
          serverSyncVersion,
        });
        let replaySnapshot: PersistedWallState | null = initialReplaySnapshot;

        setAcknowledgedCloudSnapshotRef.current(serverSnapshot);
        await Promise.all([
          saveWallSyncVersion(serverSyncVersion),
          saveWallCloudBaselineSnapshot(serverSnapshot),
        ]);

        if (hasUnsyncedLocalShadow) {
          writeStorageValue(migrationKey, "1");
        } else if (hasContent(latestLocalSnapshot) && !hasContent(serverSnapshot) && canPromptImport && typeof window !== "undefined") {
          const importLocal = window.confirm("Import your existing local wall data to your cloud account now?");
          if (importLocal) {
            replaySnapshot = latestLocalSnapshot;
          }
          writeStorageValue(migrationKey, "1");
        }

        lastPersistedSerializedRef.current = JSON.stringify(nextSnapshot);
        await saveWallSnapshot(nextSnapshot, fullLocalSnapshot ?? latestLocalSnapshot);
        saver.markCommittedSnapshot(nextSnapshot);
        timelineRecorder.markCommittedSnapshot(nextSnapshot);
        const cloudBootstrapDurationMs = performance.now() - cloudBootstrapStartedAt;
        recordWallTelemetryMetric("startupCloudBootstrapMs", cloudBootstrapDurationMs);
        recordWallStartupCheckpoint("cloud-bootstrap-completed", {
          durationMs: cloudBootstrapDurationMs,
          detail: degradedLocalBootstrap ? "recovered-from-degraded-local-bootstrap" : "window-first-bootstrap",
        });

        if (!cancelled) {
          if (!hasContent(fullLocalSnapshot ?? emptyWallSnapshot) && hasMeaningfulContent(serverSnapshot)) {
            skippedRemoteSnapshotsRef.current.remember(JSON.stringify(serverSnapshot));
            useWallStore.getState().mergeHydratedSnapshot(serverSnapshot, {
              updateCamera: false,
              updateLastColor: true,
            });
          }
          cloudReadyRef.current = true;
          setCloudSyncVersionRef.current(serverSyncVersion);
          setCloudWallUpdatedAtRef.current(null);
          setSyncErrorRef.current(null);
          if (replaySnapshot) {
            scheduleCloudSyncRef.current(replaySnapshot);
          }
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "cloud-bootstrap-failed";
        recordWallStartupCheckpoint("cloud-bootstrap-failed", { detail });
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Cloud sync unavailable";
          setSyncErrorRef.current(message);
          cloudReadyRef.current = false;
          if (message === authExpiredMessage) {
            redirectToLoginForAuth("/wall");
          }
        }
      }
    };

    void load();

    const unsubscribe = useWallStore.subscribe((state) => {
      if (!state.hydrated) {
        return;
      }

      const snapshot = selectPersistedSnapshot(state);
      const serialized = JSON.stringify(snapshot);
      if (skippedRemoteSnapshotsRef.current.consume(serialized)) {
        lastPersistedSerializedRef.current = serialized;
        if (persistenceReadyRef.current) {
          saver.markCommittedSnapshot(snapshot);
          timelineRecorder.markCommittedSnapshot(snapshot);
        }
        return;
      }
      if (!persistenceReadyRef.current) {
        lastPersistedSerializedRef.current = serialized;
        return;
      }
      if (serialized === lastPersistedSerializedRef.current) {
        return;
      }

      lastPersistedSerializedRef.current = serialized;
      saver.schedule(snapshot);
      timelineRecorder.schedule(snapshot);
      scheduleCloudSyncRef.current(snapshot);

      const now = Date.now();
      if (serialized !== lastTimelineSerialized.current && now - lastTimelineRecordedAt.current > 1400) {
        lastTimelineSerialized.current = serialized;
        lastTimelineRecordedAt.current = now;
        setTimelineEntries((previous) => {
          const next = [...previous, { ts: now, snapshot }];
          if (next.length > inMemoryTimelineLimit) {
            next.splice(0, next.length - inMemoryTimelineLimit);
          }
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      cloudReadyRef.current = false;
      if (timer) {
        clearTimeout(timer);
      }
      void saver.flush();
      void timelineRecorder.flush();
    };
  }, [
    cloudReadyRef,
    cloudSyncTimerRef,
    lastTimelineRecordedAt,
    lastTimelineSerialized,
    publishedReadOnly,
    setWallAssets,
    setTimelineEntries,
    setTimelineIndex,
    syncSnapshotToCloud,
  ]);

  const mergeRemoteWindowSnapshot = useCallback(
    (snapshot: PersistedWallState, options?: { syncVersion?: number; updatedAt?: string | null }) => {
      const state = useWallStore.getState();
      const nextSnapshot = mergeWallWindowIntoSnapshot(selectPersistedSnapshot(state), snapshot);
      skippedRemoteSnapshotsRef.current.remember(JSON.stringify(nextSnapshot));
      state.mergeHydratedSnapshot(snapshot, { updateCamera: false });
      if (typeof options?.syncVersion === "number") {
        setCloudSyncVersionRef.current(options.syncVersion);
      }
      if (Object.prototype.hasOwnProperty.call(options ?? {}, "updatedAt")) {
        setCloudWallUpdatedAtRef.current(options?.updatedAt ?? null);
      }
    },
    [],
  );

  return { mergeRemoteWindowSnapshot };
};
