"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { hasContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { createSnapshotSaver, createTimelineRecorder, loadTimelineEntries, loadWallSnapshot, type TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState } from "@/features/wall/types";

type UseWallPersistenceEffectsOptions = {
  hydrate: (state: PersistedWallState) => void;
  publishedReadOnly: boolean;
  scheduleCloudSync: (snapshot: PersistedWallState) => void;
  syncSnapshotToCloud: (cloudWallId: string, snapshot: PersistedWallState) => Promise<void>;
  setCloudWallId: (id: string | null) => void;
  setTimelineEntries: Dispatch<SetStateAction<TimelineEntry[]>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  setSyncError: (value: string | null) => void;
  onLocalSaveStateChange: (state: "saving" | "saved" | "error") => void;
  cloudReadyRef: MutableRefObject<boolean>;
  cloudSyncTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastTimelineSerialized: MutableRefObject<string>;
  lastTimelineRecordedAt: MutableRefObject<number>;
};

export const useWallPersistenceEffects = ({
  hydrate,
  publishedReadOnly,
  scheduleCloudSync,
  syncSnapshotToCloud,
  setCloudWallId,
  setTimelineEntries,
  setTimelineIndex,
  setSyncError,
  onLocalSaveStateChange,
  cloudReadyRef,
  cloudSyncTimerRef,
  lastTimelineSerialized,
  lastTimelineRecordedAt,
}: UseWallPersistenceEffectsOptions) => {
  useEffect(() => {
    const saver = createSnapshotSaver(320, {
      onSchedule: () => onLocalSaveStateChange("saving"),
      onSuccess: () => onLocalSaveStateChange("saved"),
      onError: () => onLocalSaveStateChange("error"),
    });
    const timelineRecorder = createTimelineRecorder({ delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    let cancelled = false;

    const load = async () => {
      const [snapshot, loadedTimeline] = await Promise.all([loadWallSnapshot(), loadTimelineEntries(500)]);
      if (!cancelled) {
        hydrate(snapshot);
        setTimelineEntries(loadedTimeline);
        if (loadedTimeline.length > 0) {
          setTimelineIndex(loadedTimeline.length - 1);
        }
      }

      if (publishedReadOnly || cancelled) {
        return;
      }

      try {
        const listResponse = await fetch("/api/walls", { cache: "no-store" });
        if (!listResponse.ok) {
          const payload = (await listResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to load walls");
        }

        const listPayload = (await listResponse.json()) as { walls: Array<{ id: string }> };
        let wallId = listPayload.walls[0]?.id;

        if (!wallId) {
          const createResponse = await fetch("/api/walls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "My Wall" }),
          });
          if (!createResponse.ok) {
            const payload = (await createResponse.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error ?? "Unable to create wall");
          }
          const createdPayload = (await createResponse.json()) as { wall: { id: string } };
          wallId = createdPayload.wall.id;
        }

        if (!wallId) {
          throw new Error("No wall available");
        }

        setCloudWallId(wallId);

        const snapshotResponse = await fetch(`/api/walls/${wallId}`, { cache: "no-store" });
        if (!snapshotResponse.ok) {
          const payload = (await snapshotResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to load cloud snapshot");
        }

        const snapshotPayload = (await snapshotResponse.json()) as { snapshot: PersistedWallState };
        const serverSnapshot = snapshotPayload.snapshot;
        const migrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !window.localStorage.getItem(migrationKey);
        let nextSnapshot = mergeSnapshotsLww(serverSnapshot, snapshot);

        if (hasContent(snapshot) && !hasContent(serverSnapshot) && canPromptImport && typeof window !== "undefined") {
          const importLocal = window.confirm("Import your existing local wall data to your cloud account now?");
          if (importLocal) {
            nextSnapshot = snapshot;
            await syncSnapshotToCloud(wallId, snapshot);
          }
          window.localStorage.setItem(migrationKey, "1");
        } else if (JSON.stringify(nextSnapshot) !== JSON.stringify(serverSnapshot)) {
          await syncSnapshotToCloud(wallId, nextSnapshot);
        }

        if (!cancelled) {
          hydrate(nextSnapshot);
          cloudReadyRef.current = true;
          setSyncError(null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Cloud sync unavailable";
          setSyncError(message);
          cloudReadyRef.current = false;
        }
      }
    };

    void load();

    const unsubscribe = useWallStore.subscribe((state) => {
      if (!state.hydrated) {
        return;
      }
      const snapshot = selectPersistedSnapshot(state);
      saver.schedule(snapshot);
      timelineRecorder.schedule(snapshot);
      scheduleCloudSync(snapshot);

      const serialized = JSON.stringify(snapshot);
      const now = Date.now();
      if (serialized !== lastTimelineSerialized.current && now - lastTimelineRecordedAt.current > 1400) {
        lastTimelineSerialized.current = serialized;
        lastTimelineRecordedAt.current = now;
        setTimelineEntries((previous) => {
          const next = [...previous, { ts: now, snapshot }];
          if (next.length > 500) {
            next.splice(0, next.length - 500);
          }
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      cloudReadyRef.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timer = cloudSyncTimerRef.current;
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
    publishedReadOnly,
    scheduleCloudSync,
    setCloudWallId,
    setSyncError,
    setTimelineEntries,
    setTimelineIndex,
    onLocalSaveStateChange,
    syncSnapshotToCloud,
  ]);
};

