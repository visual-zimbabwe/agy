"use client";

import { useEffect, useMemo, useRef } from "react";

import { loadWallWindow } from "@/features/wall/cloud-delta";
import type { Camera, PersistedWallState, WallAssetMap, WallWindowBounds } from "@/features/wall/types";
import { alignBoundsToWallTile, createViewportWallBounds, wallBoundsCacheKey } from "@/features/wall/windowing";
import { authExpiredMessage, redirectToLoginForAuth } from "@/lib/api/client-auth";

type UseWallEntityWindowCacheOptions = {
  wallId: string | null;
  camera: Camera;
  viewport: { w: number; h: number };
  enabled?: boolean;
  overscanWorldPx?: number;
  onWindowLoaded: (payload: { snapshot: PersistedWallState; assets: WallAssetMap; syncVersion: number; updatedAt: string | null }) => void;
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
    let cancelled = false;

    const loadWindow = (bounds: WallWindowBounds, allowPrefetch: boolean) => {
      const boundsKey = wallBoundsCacheKey(bounds);
      if (loadedWindowKeysRef.current.has(boundsKey) || inflightWindowKeysRef.current.has(boundsKey)) {
        return;
      }

      inflightWindowKeysRef.current.add(boundsKey);

      void loadWallWindow(wallId, bounds)
        .then((payload) => {
          if (cancelled) {
            return;
          }
          loadedWindowKeysRef.current.add(boundsKey);
          onWindowLoaded({
            snapshot: payload.snapshot,
            assets: payload.assets,
            syncVersion: payload.syncVersion,
            updatedAt: payload.shell.updatedAt ?? null,
          });

          if (!allowPrefetch) {
            return;
          }
          for (const prefetchBounds of payload.readModel.prefetchBounds.slice(0, 2)) {
            loadWindow(prefetchBounds, false);
          }
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
          inflightWindowKeysRef.current.delete(boundsKey);
        });
    };

    loadWindow(requestBounds, true);

    return () => {
      cancelled = true;
    };
  }, [enabled, onWindowLoaded, requestBounds, viewport.h, viewport.w, wallId]);
};
