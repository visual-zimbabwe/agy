"use client";

import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { hasContent, hasMeaningfulContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import { loadWallBootstrap, loadWallDelta, loadWallShell } from "@/features/wall/cloud-delta";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { applyWallDeltaChanges } from "@/features/wall/sync";
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
const emptyWallSnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

const createShellPreviewSnapshot = ({
  baseSnapshot,
  shellCamera,
  shellLastColor,
  preferShellCamera,
}: {
  baseSnapshot: PersistedWallState;
  shellCamera: Camera;
  shellLastColor?: string;
  preferShellCamera: boolean;
}): PersistedWallState => ({
  ...baseSnapshot,
  camera: preferShellCamera ? shellCamera : baseSnapshot.camera,
  lastColor: baseSnapshot.lastColor ?? shellLastColor,
});

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
  const skippedRemoteSerializedRef = useRef<string | null>(null);
  const persistenceReadyRef = useRef(false);
  const inMemoryTimelineLimit = 120;

  useEffect(() => {
    const saver = createSnapshotSaver(320, {
      onSchedule: () => onLocalSaveStateChange("saving"),
      onSuccess: () => onLocalSaveStateChange("saved"),
      onError: () => onLocalSaveStateChange("error"),
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
        hydrate(snapshot);
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
      const loadStartedAt = performance.now();
      recordWallStartupCheckpoint("local-bootstrap-started");

      const fullLocalBootstrapTask = loadWallLocalStateWithRepair()
        .then((value) => ({
          status: "resolved" as const,
          value: [value.snapshot, value.cloudBaselineSnapshot, value.syncVersion] as const,
        }))
        .catch((error) => ({ status: "rejected" as const, error }));

      const localBootstrapTask = loadWallCameraState()
        .then(({ camera }) => loadWallWindowSnapshot(getViewportWindowBounds(camera)))
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

      if (publishedReadOnly || cancelled) {
        return;
      }

      try {
        const cloudBootstrapStartedAt = performance.now();
        recordWallStartupCheckpoint("cloud-bootstrap-started", degradedLocalBootstrap ? { detail: "degraded-local-bootstrap" } : undefined);
        let localBaselineSnapshot: PersistedWallState | null = null;
        let localSyncVersion = 0;
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

        const hydrateCloudWindowPreview = async (candidateWallId: string) => {
          const shell = await loadWallShell(candidateWallId);
          const previewCamera = degradedLocalBootstrap || !hasContent(snapshot) ? shell.camera : snapshot.camera;
          const previewSnapshot = createShellPreviewSnapshot({
            baseSnapshot:
              degradedLocalBootstrap || !hasContent(snapshot)
                ? { ...emptyWallSnapshot }
                : snapshot,
            shellCamera: previewCamera,
            shellLastColor: shell.lastColor,
            preferShellCamera: degradedLocalBootstrap || !hasContent(snapshot),
          });
          lastPersistedSerializedRef.current = JSON.stringify(previewSnapshot);

          if (!cancelled) {
            hydrate(previewSnapshot);
            setCloudWallId(candidateWallId);
            setCloudSyncVersion(shell.syncVersion);
            setCloudWallUpdatedAt(shell.updatedAt ?? null);
          }

          return {
            shell,
            snapshot: previewSnapshot,
          };
        };

        const loadCloudState = async (candidateWallId: string, knownWallIds: string[]) => {
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

        let serverSnapshot: PersistedWallState | null = null;
        let serverSyncVersion = 0;
        let wallId = preferredWallId;
        let listedWallIdsCache: string[] | null = null;

        if (preferredWallId) {
          try {
            await hydrateCloudWindowPreview(preferredWallId);
            writeStorageValue(lastCloudWallStorageKey, preferredWallId);
          } catch (error) {
            if (error instanceof Error && error.message === authExpiredMessage) {
              throw error;
            }
          }
        }

        const fullLocalBootstrapResult = await fullLocalBootstrapTask;
        if (fullLocalBootstrapResult.status === "resolved") {
          const [fullLocalSnapshot, loadedBaselineSnapshot, loadedSyncVersion] = fullLocalBootstrapResult.value;
          localBaselineSnapshot = loadedBaselineSnapshot;
          localSyncVersion = loadedSyncVersion;

          const mergedLocalSnapshot = mergeSnapshotsLww(fullLocalSnapshot, selectPersistedSnapshot(useWallStore.getState()));
          const mergedSerialized = JSON.stringify(mergedLocalSnapshot);
          skippedRemoteSerializedRef.current = mergedSerialized;
          lastPersistedSerializedRef.current = mergedSerialized;
          persistenceReadyRef.current = true;
          saver.markCommittedSnapshot(mergedLocalSnapshot);
          timelineRecorder.markCommittedSnapshot(mergedLocalSnapshot);
          useWallStore.getState().mergeHydratedSnapshot(fullLocalSnapshot, {
            updateCamera: false,
            updateLastColor: true,
          });
          snapshot = mergedLocalSnapshot;
        }

        if (preferredWallId) {
          try {
            const snapshotPayload = await loadCloudState(preferredWallId, [preferredWallId]);
            serverSnapshot = snapshotPayload.snapshot;
            serverSyncVersion = snapshotPayload.syncVersion;
            setCloudWallUpdatedAt(null);
          } catch (error) {
            if (error instanceof Error && error.message === authExpiredMessage) {
              throw error;
            }
            wallId = null;
          }
        }

        if (!serverSnapshot) {
          const listedWallIds = listedWallIdsCache ?? (await listWalls());
          listedWallIdsCache = listedWallIds;
          wallId = listedWallIds[0] ?? null;

          if (!wallId) {
            wallId = await createWall();
          }

          if (wallId && wallId !== preferredWallId) {
            try {
              await hydrateCloudWindowPreview(wallId);
              writeStorageValue(lastCloudWallStorageKey, wallId);
            } catch (error) {
              if (error instanceof Error && error.message === authExpiredMessage) {
                throw error;
              }
            }
          }

          if (!wallId) {
            throw new Error("No wall available");
          }

          if (listedWallIds.length <= 1) {
            const snapshotPayload = await loadCloudState(wallId, listedWallIds.length > 0 ? listedWallIds : [wallId]);
            serverSnapshot = snapshotPayload.snapshot;
            serverSyncVersion = snapshotPayload.syncVersion;
            setCloudWallUpdatedAt(null);
          } else {
            const orderedWallIds = [
              ...(preferredWallId && listedWallIds.includes(preferredWallId) ? [preferredWallId] : []),
              ...listedWallIds.filter((id) => id !== preferredWallId),
            ];
            let fallbackSelection: { wallId: string; snapshot: PersistedWallState; syncVersion: number } | null = null;

            for (const candidateWallId of orderedWallIds) {
              const snapshotPayload = await loadCloudState(candidateWallId, listedWallIds);
              if (!fallbackSelection) {
                fallbackSelection = {
                  wallId: candidateWallId,
                  snapshot: snapshotPayload.snapshot,
                  syncVersion: snapshotPayload.syncVersion,
                };
              }

              if (hasMeaningfulContent(snapshotPayload.snapshot)) {
                wallId = candidateWallId;
                serverSnapshot = snapshotPayload.snapshot;
                serverSyncVersion = snapshotPayload.syncVersion;
                setCloudWallUpdatedAt(null);
                break;
              }
            }

            if (!serverSnapshot) {
              wallId = fallbackSelection?.wallId ?? wallId;
              if (fallbackSelection) {
                serverSnapshot = fallbackSelection.snapshot;
                serverSyncVersion = fallbackSelection.syncVersion;
                setCloudWallUpdatedAt(null);
              } else {
                const fallbackPayload = await loadCloudState(wallId, listedWallIds);
                serverSnapshot = fallbackPayload.snapshot;
                serverSyncVersion = fallbackPayload.syncVersion;
                setCloudWallUpdatedAt(null);
              }
            }
          }
        }

        if (!wallId || !serverSnapshot) {
          throw new Error("No wall available");
        }

        setCloudWallId(wallId);
        setCloudSyncVersion(serverSyncVersion);
        await Promise.all([
          saveWallSyncVersion(serverSyncVersion),
          saveWallCloudBaselineSnapshot(serverSnapshot),
        ]);
        writeStorageValue(lastCloudWallStorageKey, wallId);
        const migrationKey = `agy-cloud-imported-v1:${wallId}`;
        const legacyMigrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !readStorageValue(migrationKey, [legacyMigrationKey]);
        const latestLocalSnapshot = selectPersistedSnapshot(useWallStore.getState());
        let nextSnapshot = mergeSnapshotsLww(serverSnapshot, latestLocalSnapshot);

        if (hasContent(latestLocalSnapshot) && !hasContent(serverSnapshot) && canPromptImport && typeof window !== "undefined") {
          const importLocal = window.confirm("Import your existing local wall data to your cloud account now?");
          if (importLocal) {
            nextSnapshot = latestLocalSnapshot;
            setAcknowledgedCloudSnapshot(serverSnapshot);
            await syncSnapshotToCloud(wallId, latestLocalSnapshot);
          }
          writeStorageValue(migrationKey, "1");
        } else if (JSON.stringify(nextSnapshot) !== JSON.stringify(serverSnapshot)) {
          setAcknowledgedCloudSnapshot(serverSnapshot);
          await syncSnapshotToCloud(wallId, nextSnapshot);
        } else {
          setAcknowledgedCloudSnapshot(nextSnapshot);
          await Promise.all([
            saveWallSyncVersion(serverSyncVersion),
            saveWallCloudBaselineSnapshot(nextSnapshot),
          ]);
        }

        lastPersistedSerializedRef.current = JSON.stringify(nextSnapshot);
        await saveWallSnapshot(nextSnapshot, latestLocalSnapshot);
        saver.markCommittedSnapshot(nextSnapshot);
        timelineRecorder.markCommittedSnapshot(nextSnapshot);
        const cloudBootstrapDurationMs = performance.now() - cloudBootstrapStartedAt;
        recordWallTelemetryMetric("startupCloudBootstrapMs", cloudBootstrapDurationMs);
        recordWallStartupCheckpoint("cloud-bootstrap-completed", {
          durationMs: cloudBootstrapDurationMs,
          detail: degradedLocalBootstrap ? "recovered-from-degraded-local-bootstrap" : undefined,
        });

        if (!cancelled) {
          persistenceReadyRef.current = true;
          hydrate(nextSnapshot);
          cloudReadyRef.current = true;
          setSyncError(null);
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "cloud-bootstrap-failed";
        recordWallStartupCheckpoint("cloud-bootstrap-failed", { detail });
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Cloud sync unavailable";
          setSyncError(message);
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
        if (serialized === skippedRemoteSerializedRef.current) {
          skippedRemoteSerializedRef.current = null;
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
      scheduleCloudSync(snapshot);

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
    hydrate,
    lastTimelineRecordedAt,
    lastTimelineSerialized,
    onLocalSaveStateChange,
    publishedReadOnly,
    scheduleCloudSync,
    setAcknowledgedCloudSnapshot,
    setCloudSyncVersion,
    setCloudWallUpdatedAt,
    setCloudWallId,
    setWallAssets,
    setSyncError,
    setTimelineEntries,
    setTimelineIndex,
    syncSnapshotToCloud,
    getViewportWindowBounds,
  ]);

  const mergeRemoteWindowSnapshot = useCallback(
    (snapshot: PersistedWallState, options?: { syncVersion?: number; updatedAt?: string | null }) => {
      const state = useWallStore.getState();
      const nextSnapshot = mergeWallWindowIntoSnapshot(selectPersistedSnapshot(state), snapshot);
      skippedRemoteSerializedRef.current = JSON.stringify(nextSnapshot);
      state.mergeHydratedSnapshot(snapshot, { updateCamera: false });
      if (typeof options?.syncVersion === "number") {
        setCloudSyncVersion(options.syncVersion);
      }
      if (Object.prototype.hasOwnProperty.call(options ?? {}, "updatedAt")) {
        setCloudWallUpdatedAt(options?.updatedAt ?? null);
      }
    },
    [setCloudSyncVersion, setCloudWallUpdatedAt],
  );

  return { mergeRemoteWindowSnapshot };
};
