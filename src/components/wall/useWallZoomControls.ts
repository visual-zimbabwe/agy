"use client";

import { useCallback } from "react";

type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type UseWallZoomControlsOptions = {
  camera: Camera;
  viewport: Viewport;
  animateCamera: (camera: Camera, options?: { durationMs?: number; onComplete?: () => void }) => void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useWallZoomControls = ({ camera, viewport, animateCamera }: UseWallZoomControlsOptions) => {
  const stepZoom = useCallback(
    (direction: "in" | "out") => {
      const factor = direction === "in" ? 1.2 : 1 / 1.2;
      const nextZoom = clamp(camera.zoom * factor, 0.2, 2.8);
      const centerWorldX = (viewport.w / 2 - camera.x) / camera.zoom;
      const centerWorldY = (viewport.h / 2 - camera.y) / camera.zoom;
      animateCamera({
        zoom: nextZoom,
        x: viewport.w / 2 - centerWorldX * nextZoom,
        y: viewport.h / 2 - centerWorldY * nextZoom,
      }, { durationMs: 180 });
    },
    [animateCamera, camera.x, camera.y, camera.zoom, viewport.h, viewport.w],
  );

  const resetZoom = useCallback(() => {
    const centerWorldX = (viewport.w / 2 - camera.x) / camera.zoom;
    const centerWorldY = (viewport.h / 2 - camera.y) / camera.zoom;
    animateCamera({
      zoom: 1,
      x: viewport.w / 2 - centerWorldX,
      y: viewport.h / 2 - centerWorldY,
    }, { durationMs: 200 });
  }, [animateCamera, camera.x, camera.y, camera.zoom, viewport.h, viewport.w]);

  return { stepZoom, resetZoom };
};
