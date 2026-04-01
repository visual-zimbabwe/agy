"use client";

import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { createJokerNote } from "@/features/wall/commands";
import { hasContent, hasMeaningfulContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import { hasJokerCardBeenActivated, markJokerCardActivated } from "@/features/wall/joker";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { createSnapshotSaver, createTimelineRecorder, loadTimelineEntries, loadWallSnapshot, type TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState } from "@/features/wall/types";
import { defaultWallTitle } from "@/lib/brand";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

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

const lastCloudWallStorageKey = "agy-last-cloud-wall-id";

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
  const lastPersistedSerializedRef = useRef("");

  useEffect(() => {
    const saver = createSnapshotSaver(320, {
      onSchedule: () => onLocalSaveStateChange("saving"),
      onSuccess: () => onLocalSaveStateChange("saved"),
      onError: () => onLocalSaveStateChange("error"),
    });
    const timelineRecorder = createTimelineRecorder({ delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    const timer = cloudSyncTimerRef.current;
    let cancelled = false;

    const fetchCloudSnapshot = async (wallId: string) => {
      const snapshotResponse = await fetch(`/api/walls/${wallId}`, { cache: "no-store" });
      if (snapshotResponse.status === 401) {
        throw new Error(authExpiredMessage);
      }
      if (!snapshotResponse.ok) {
        const payload = (await snapshotResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load cloud snapshot");
      }

      return (await snapshotResponse.json()) as { snapshot: PersistedWallState };
    };

    const finalizeJokerState = (snapshot: PersistedWallState, allowSeed: boolean) => {
      const jokerNotes = Object.values(snapshot.notes).filter((note) => note.noteKind === "joker");
      if (jokerNotes.length > 0) {
        markJokerCardActivated();
        return;
      }

      if (allowSeed && !publishedReadOnly && !hasJokerCardBeenActivated() && !hasContent(snapshot)) {
        createJokerNote(-120, -92, { select: false });
        lastPersistedSerializedRef.current = JSON.stringify(selectPersistedSnapshot(useWallStore.getState()));
      }
    };

    const load = async () => {
      const [snapshot, loadedTimeline] = await Promise.all([loadWallSnapshot(), loadTimelineEntries(500)]);
      lastPersistedSerializedRef.current = JSON.stringify(snapshot);

      if (!cancelled) {
        hydrate(snapshot);
        finalizeJokerState(snapshot, false);
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
        if (listResponse.status === 401) {
          throw new Error(authExpiredMessage);
        }
        if (!listResponse.ok) {
          const payload = (await listResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to load walls");
        }

        const listPayload = (await listResponse.json()) as { walls: Array<{ id: string }> };
        const listedWallIds = listPayload.walls.map((wall) => wall.id);
        let wallId = listedWallIds[0];

        if (!wallId) {
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
          wallId = createdPayload.wall.id;
        }

        if (!wallId) {
          throw new Error("No wall available");
        }

        let serverSnapshot: PersistedWallState | null = null;

        if (listedWallIds.length <= 1) {
          const snapshotPayload = await fetchCloudSnapshot(wallId);
          serverSnapshot = snapshotPayload.snapshot;
        } else {
          const preferredWallId = readStorageValue(lastCloudWallStorageKey);
          const orderedWallIds = [
            ...(preferredWallId && listedWallIds.includes(preferredWallId) ? [preferredWallId] : []),
            ...listedWallIds.filter((id) => id !== preferredWallId),
          ];
          let fallbackSelection: { wallId: string; snapshot: PersistedWallState } | null = null;

          for (const candidateWallId of orderedWallIds) {
            const snapshotPayload = await fetchCloudSnapshot(candidateWallId);
            if (!fallbackSelection) {
              fallbackSelection = { wallId: candidateWallId, snapshot: snapshotPayload.snapshot };
            }

            if (hasMeaningfulContent(snapshotPayload.snapshot)) {
              wallId = candidateWallId;
              serverSnapshot = snapshotPayload.snapshot;
              break;
            }
          }

          if (!serverSnapshot) {
            wallId = fallbackSelection?.wallId ?? wallId;
            serverSnapshot = fallbackSelection?.snapshot ?? (await fetchCloudSnapshot(wallId)).snapshot;
          }
        }

        setCloudWallId(wallId);
        writeStorageValue(lastCloudWallStorageKey, wallId);
        const migrationKey = `agy-cloud-imported-v1:${wallId}`;
        const legacyMigrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !readStorageValue(migrationKey, [legacyMigrationKey]);
        let nextSnapshot = mergeSnapshotsLww(serverSnapshot, snapshot);

        if (hasContent(snapshot) && !hasContent(serverSnapshot) && canPromptImport && typeof window !== "undefined") {
          const importLocal = window.confirm("Import your existing local wall data to your cloud account now?");
          if (importLocal) {
            nextSnapshot = snapshot;
            await syncSnapshotToCloud(wallId, snapshot);
          }
          writeStorageValue(migrationKey, "1");
        } else if (JSON.stringify(nextSnapshot) !== JSON.stringify(serverSnapshot)) {
          await syncSnapshotToCloud(wallId, nextSnapshot);
        }

        lastPersistedSerializedRef.current = JSON.stringify(nextSnapshot);

        if (!cancelled) {
          hydrate(nextSnapshot);
          finalizeJokerState(nextSnapshot, true);
          cloudReadyRef.current = true;
          setSyncError(null);
        }
      } catch (error) {
        if (!cancelled) {
          finalizeJokerState(snapshot, true);
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
    setCloudWallId,
    setSyncError,
    setTimelineEntries,
    setTimelineIndex,
    syncSnapshotToCloud,
  ]);
};




