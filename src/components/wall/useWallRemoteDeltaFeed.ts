"use client";

import { useEffect, useRef } from "react";

import { loadWallDelta } from "@/features/wall/cloud-delta";
import { applyWallDeltaChanges, hasRelevantWallDeltaChanges, sliceWallSnapshotToBounds } from "@/features/wall/sync";
import type { PersistedWallState } from "@/features/wall/types";
import type { WallBounds } from "@/features/wall/windowing";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";

type UseWallRemoteDeltaFeedOptions = {
  wallId: string | null;
  enabled?: boolean;
  getBaselineSnapshot: () => PersistedWallState | null;
  getSyncVersion: () => number;
  getViewportBounds: () => WallBounds;
  onRemoteSnapshot: (payload: {
    baselineSnapshot: PersistedWallState;
    viewportSnapshot: PersistedWallState | null;
    syncVersion: number;
  }) => void;
};

const foregroundPollMs = 4_000;
const backgroundPollMs = 12_000;

export const useWallRemoteDeltaFeed = ({
  wallId,
  enabled = true,
  getBaselineSnapshot,
  getSyncVersion,
  getViewportBounds,
  onRemoteSnapshot,
}: UseWallRemoteDeltaFeedOptions) => {
  const getBaselineSnapshotRef = useRef(getBaselineSnapshot);
  const getSyncVersionRef = useRef(getSyncVersion);
  const getViewportBoundsRef = useRef(getViewportBounds);
  const onRemoteSnapshotRef = useRef(onRemoteSnapshot);

  useEffect(() => {
    getBaselineSnapshotRef.current = getBaselineSnapshot;
  }, [getBaselineSnapshot]);

  useEffect(() => {
    getSyncVersionRef.current = getSyncVersion;
  }, [getSyncVersion]);

  useEffect(() => {
    getViewportBoundsRef.current = getViewportBounds;
  }, [getViewportBounds]);

  useEffect(() => {
    onRemoteSnapshotRef.current = onRemoteSnapshot;
  }, [onRemoteSnapshot]);

  useEffect(() => {
    if (!enabled || !wallId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextPoll = () => {
      if (cancelled) {
        return;
      }
      const pollMs = typeof document !== "undefined" && document.visibilityState === "visible" ? foregroundPollMs : backgroundPollMs;
      timer = setTimeout(poll, pollMs);
    };

    const poll = async () => {
      const baselineSnapshot = getBaselineSnapshotRef.current();
      const syncVersion = getSyncVersionRef.current();
      if (!baselineSnapshot || syncVersion <= 0) {
        scheduleNextPoll();
        return;
      }

      try {
        const deltaPayload = await loadWallDelta(wallId, syncVersion);
        if (cancelled || deltaPayload.currentVersion <= syncVersion || deltaPayload.changes.length === 0) {
          scheduleNextPoll();
          return;
        }

        const nextBaselineSnapshot = applyWallDeltaChanges(baselineSnapshot, deltaPayload.changes);
        const viewportBounds = getViewportBoundsRef.current();
        const viewportSnapshot = hasRelevantWallDeltaChanges(deltaPayload.changes, viewportBounds)
          ? sliceWallSnapshotToBounds(nextBaselineSnapshot, viewportBounds)
          : null;

        onRemoteSnapshotRef.current({
          baselineSnapshot: nextBaselineSnapshot,
          viewportSnapshot,
          syncVersion: deltaPayload.currentVersion,
        });
      } catch (error) {
        if (!cancelled && error instanceof Error && error.message === authExpiredMessage) {
          redirectToLoginForAuth("/wall");
          return;
        }
      }

      scheduleNextPoll();
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [enabled, wallId]);
};
