"use client";

import { useCallback } from "react";

type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };

type UseWallZoomControlsOptions = {
  camera: Camera;
  viewport: Viewport;
  setCamera: (camera: Camera) => void;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useWallZoomControls = ({ camera, viewport, setCamera }: UseWallZoomControlsOptions) => {
  const stepZoom = useCallback(
    (direction: "in" | "out") => {
      const factor = direction === "in" ? 1.2 : 1 / 1.2;
      const nextZoom = clamp(camera.zoom * factor, 0.2, 2.8);
      const centerWorldX = (viewport.w / 2 - camera.x) / camera.zoom;
      const centerWorldY = (viewport.h / 2 - camera.y) / camera.zoom;
      setCamera({
        zoom: nextZoom,
        x: viewport.w / 2 - centerWorldX * nextZoom,
        y: viewport.h / 2 - centerWorldY * nextZoom,
      });
    },
    [camera.x, camera.y, camera.zoom, setCamera, viewport.h, viewport.w],
  );

  const resetZoom = useCallback(() => {
    const centerWorldX = (viewport.w / 2 - camera.x) / camera.zoom;
    const centerWorldY = (viewport.h / 2 - camera.y) / camera.zoom;
    setCamera({
      zoom: 1,
      x: viewport.w / 2 - centerWorldX,
      y: viewport.h / 2 - centerWorldY,
    });
  }, [camera.x, camera.y, camera.zoom, setCamera, viewport.h, viewport.w]);

  return { stepZoom, resetZoom };
};
