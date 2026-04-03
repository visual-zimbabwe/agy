"use client";

import { useEffect, useMemo, useRef } from "react";

import { loadWallWindow } from "@/features/wall/cloud-delta";
import type { Camera, PersistedWallState, WallWindowBounds } from "@/features/wall/types";
import { alignBoundsToWallTile, createViewportWallBounds, wallBoundsCacheKey } from "@/features/wall/windowing";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";

type UseWallEntityWindowCacheOptions = {
  wallId: string | null;
  camera: Camera;
  viewport: { w: number; h: number };
  enabled?: boolean;
  overscanWorldPx?: number;
  onWindowLoaded: (payload: { snapshot: PersistedWallState; syncVersion: number; updatedAt: string | null }) => void;
};

const defaultWindowOverscanWorldPx = 640;

export const useWallEntityWindowCache = ({
  wallId,
  camera,
  viewport,
  enabled = true,
  overscanWorldPx = defaultWindowOverscanWorldPx,
  onWindowLoaded,
}: UseWallEntityWindowCacheOptions) => {
  const loadedWindowKeysRef = useRef<Set<string>>(new Set());
  const inflightWindowKeysRef = useRef<Set<string>>(new Set());
  const previousWallIdRef = useRef<string | null>(null);

  const requestBounds = useMemo<WallWindowBounds>(() => {
    const viewportBounds = createViewportWallBounds(camera, viewport, overscanWorldPx);
    return alignBoundsToWallTile(viewportBounds);
  }, [camera, overscanWorldPx, viewport]);

  const requestKey = useMemo(() => wallBoundsCacheKey(requestBounds), [requestBounds]);

  useEffect(() => {
    if (previousWallIdRef.current !== wallId) {
      previousWallIdRef.current = wallId;
      loadedWindowKeysRef.current.clear();
      inflightWindowKeysRef.current.clear();
    }
  }, [wallId]);

  useEffect(() => {
    if (!enabled || !wallId || viewport.w <= 0 || viewport.h <= 0) {
      return;
    }
    if (loadedWindowKeysRef.current.has(requestKey) || inflightWindowKeysRef.current.has(requestKey)) {
      return;
    }

    let cancelled = false;
    inflightWindowKeysRef.current.add(requestKey);

    void loadWallWindow(wallId, requestBounds)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        loadedWindowKeysRef.current.add(requestKey);
        onWindowLoaded({
          snapshot: payload.snapshot,
          syncVersion: payload.syncVersion,
          updatedAt: payload.shell.updatedAt ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (error instanceof Error && error.message === authExpiredMessage) {
          redirectToLoginForAuth("/wall");
        }
      })
      .finally(() => {
        inflightWindowKeysRef.current.delete(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, onWindowLoaded, requestBounds, requestKey, viewport.h, viewport.w, wallId]);
};
