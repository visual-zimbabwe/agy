"use client";

import { useCallback, useEffect, useRef } from "react";

type Camera = { x: number; y: number; zoom: number };

type AnimateCameraOptions = {
  durationMs?: number;
  onComplete?: () => void;
};

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;
const nearlyEqual = (left: number, right: number, epsilon = 0.001) => Math.abs(left - right) <= epsilon;

export const useAnimatedCamera = (camera: Camera, setCamera: (camera: Camera) => void) => {
  const frameRef = useRef<number | null>(null);
  const animationIdRef = useRef(0);
  const lastAnimatedCameraRef = useRef<Camera | null>(null);

  const stopCameraAnimation = useCallback(() => {
    animationIdRef.current += 1;
    lastAnimatedCameraRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const expected = lastAnimatedCameraRef.current;
    if (!expected) {
      return;
    }
    const matchesAnimatedFrame =
      nearlyEqual(camera.x, expected.x) &&
      nearlyEqual(camera.y, expected.y) &&
      nearlyEqual(camera.zoom, expected.zoom);
    if (!matchesAnimatedFrame) {
      stopCameraAnimation();
    }
  }, [camera, stopCameraAnimation]);

  useEffect(() => () => stopCameraAnimation(), [stopCameraAnimation]);

  const animateCamera = useCallback(
    (target: Camera, options?: AnimateCameraOptions) => {
      const durationMs = options?.durationMs ?? 280;
      if (
        nearlyEqual(camera.x, target.x) &&
        nearlyEqual(camera.y, target.y) &&
        nearlyEqual(camera.zoom, target.zoom)
      ) {
        stopCameraAnimation();
        setCamera(target);
        options?.onComplete?.();
        return;
      }

      stopCameraAnimation();
      const start = camera;
      const startedAt = performance.now();
      const animationId = animationIdRef.current + 1;
      animationIdRef.current = animationId;

      const tick = (now: number) => {
        if (animationIdRef.current !== animationId) {
          return;
        }

        const elapsed = now - startedAt;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutCubic(progress);
        const nextCamera = {
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
          zoom: start.zoom + (target.zoom - start.zoom) * eased,
        };
        lastAnimatedCameraRef.current = nextCamera;
        setCamera(nextCamera);

        if (progress >= 1) {
          frameRef.current = null;
          lastAnimatedCameraRef.current = null;
          options?.onComplete?.();
          return;
        }

        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [camera, setCamera, stopCameraAnimation],
  );

  return { animateCamera, stopCameraAnimation };
};
