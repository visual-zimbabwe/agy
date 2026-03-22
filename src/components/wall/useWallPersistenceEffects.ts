"use client";

import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { decryptConfidentialPayload, ensureConfidentialWorkspaceConfigMatchesPassphrase, isConfidentialDecryptError, lockConfidentialWorkspace, setConfidentialRecoveryMessage } from "@/lib/confidential-workspace";
import { createJokerNote, refreshJokerNote } from "@/features/wall/commands";
import { hasContent, mergeSnapshotsLww } from "@/features/wall/cloud";
import { hasJokerCardBeenActivated, jokerErrorText, jokerLoadingText, markJokerCardActivated } from "@/features/wall/joker";
import { selectPersistedSnapshot, useWallStore } from "@/features/wall/store";
import { archiveWallRecoverySnapshot, createSnapshotSaver, createTimelineRecorder, loadTimelineEntries, loadWallSnapshot, type TimelineEntry } from "@/features/wall/storage";
import type { PersistedWallState } from "@/features/wall/types";
import { defaultWallTitle } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type UseWallPersistenceEffectsOptions = {
  hydrate: (state: PersistedWallState) => void;
  confidentialPassphrase: string;
  confidentialReady: boolean;
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
  confidentialPassphrase,
  confidentialReady,
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
    if (!confidentialReady) {
      return;
    }

    const saver = createSnapshotSaver(confidentialPassphrase, 320, {
      onSchedule: () => onLocalSaveStateChange("saving"),
      onSuccess: () => onLocalSaveStateChange("saved"),
      onError: () => onLocalSaveStateChange("error"),
    });
    const timelineRecorder = createTimelineRecorder(confidentialPassphrase, { delayMs: 1100, minIntervalMs: 1400, maxEntries: 500 });
    const timer = cloudSyncTimerRef.current;
    let cancelled = false;

    const finalizeJokerState = (snapshot: PersistedWallState, allowSeed: boolean) => {
      const jokerNotes = Object.values(snapshot.notes).filter((note) => note.noteKind === "joker");
      if (jokerNotes.length > 0) {
        markJokerCardActivated();
        jokerNotes.forEach((note) => {
          if (note.text === jokerLoadingText || note.text === jokerErrorText) {
            refreshJokerNote(note.id);
          }
        });
        return;
      }

      if (allowSeed && !publishedReadOnly && !hasJokerCardBeenActivated() && !hasContent(snapshot)) {
        createJokerNote(-120, -92, { select: false });
        lastPersistedSerializedRef.current = JSON.stringify(selectPersistedSnapshot(useWallStore.getState()));
      }
    };

    const load = async () => {
      let snapshot: PersistedWallState;
      let loadedTimeline: TimelineEntry[];

      try {
        [snapshot, loadedTimeline] = await Promise.all([
          loadWallSnapshot(confidentialPassphrase),
          loadTimelineEntries(500, confidentialPassphrase),
        ]);
        await ensureConfidentialWorkspaceConfigMatchesPassphrase(confidentialPassphrase);
      } catch (error) {
        if (!cancelled) {
          onLocalSaveStateChange("error");
          if (isConfidentialDecryptError(error)) {
            setConfidentialRecoveryMessage("This workspace was encrypted with a different passphrase than the current local config. Try the passphrase that originally unlocked this workspace.");
            lockConfidentialWorkspace();
            setSyncError(error instanceof Error ? error.message : "Unable to decrypt confidential workspace data.");
          } else {
            setSyncError(error instanceof Error ? error.message : "Unable to load local wall data.");
          }
        }
        return;
      }

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
            body: JSON.stringify({ title: defaultWallTitle }),
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

        const snapshotPayload = (await snapshotResponse.json()) as { snapshot?: PersistedWallState; secureSnapshot?: unknown };
        const serverSnapshot = snapshotPayload.secureSnapshot
          ? await decryptConfidentialPayload<PersistedWallState>(confidentialPassphrase, snapshotPayload.secureSnapshot as never)
          : snapshotPayload.snapshot ?? { notes: {}, zones: {}, zoneGroups: {}, noteGroups: {}, links: {}, camera: { x: 0, y: 0, zoom: 1 } };
        const migrationKey = `agy-cloud-imported-v1:${wallId}`;
        const legacyMigrationKey = `idea-wall-cloud-imported-v1:${wallId}`;
        const canPromptImport = typeof window !== "undefined" && !readStorageValue(migrationKey, [legacyMigrationKey]);
        const localSerialized = JSON.stringify(snapshot);
        const serverSerialized = JSON.stringify(serverSnapshot);
        const snapshotsConflict = hasContent(snapshot) && hasContent(serverSnapshot) && localSerialized !== serverSerialized;

        if (snapshotsConflict) {
          await Promise.all([
            archiveWallRecoverySnapshot(snapshot, confidentialPassphrase, {
              scope: "local",
              reason: `pre-merge-local:${wallId}`,
            }),
            archiveWallRecoverySnapshot(serverSnapshot, confidentialPassphrase, {
              scope: "cloud",
              reason: `pre-merge-cloud:${wallId}`,
            }),
          ]);
        }

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
    confidentialPassphrase,
    confidentialReady,
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

