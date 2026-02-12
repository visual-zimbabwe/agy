"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  loadWallTelemetrySnapshot,
  recordWallTelemetryMetric,
  type WallTelemetryMetricKey,
} from "@/features/wall/telemetry";

type UseWallTelemetryOptions = {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  isSearchOpen: boolean;
  isExportOpen: boolean;
  isShortcutsOpen: boolean;
};

export const useWallTelemetry = ({
  leftPanelOpen,
  rightPanelOpen,
  isSearchOpen,
  isExportOpen,
  isShortcutsOpen,
}: UseWallTelemetryOptions) => {
  const mountedAtRef = useRef(0);
  const initialInteractionTrackedRef = useRef(false);
  const pendingIntentRef = useRef<Partial<Record<WallTelemetryMetricKey, number>>>({});
  const telemetryRef = useRef<ReturnType<typeof loadWallTelemetrySnapshot>>(null);

  const commitIntent = useCallback((metric: WallTelemetryMetricKey) => {
    const startedAt = pendingIntentRef.current[metric];
    if (!startedAt) {
      return;
    }
    delete pendingIntentRef.current[metric];

    requestAnimationFrame(() => {
      const value = Math.max(0, performance.now() - startedAt);
      telemetryRef.current = recordWallTelemetryMetric(metric, value);
    });
  }, []);

  const markOpenIntent = useCallback((metric: WallTelemetryMetricKey) => {
    pendingIntentRef.current[metric] = performance.now();
  }, []);

  useEffect(() => {
    telemetryRef.current = loadWallTelemetrySnapshot();
  }, []);

  useEffect(() => {
    if (!leftPanelOpen) {
      return;
    }
    commitIntent("toolsPanelOpenMs");
  }, [commitIntent, leftPanelOpen]);

  useEffect(() => {
    if (!rightPanelOpen) {
      return;
    }
    commitIntent("detailsPanelOpenMs");
  }, [commitIntent, rightPanelOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    commitIntent("searchOpenMs");
  }, [commitIntent, isSearchOpen]);

  useEffect(() => {
    if (!isExportOpen) {
      return;
    }
    commitIntent("exportOpenMs");
  }, [commitIntent, isExportOpen]);

  useEffect(() => {
    if (!isShortcutsOpen) {
      return;
    }
    commitIntent("shortcutsOpenMs");
  }, [commitIntent, isShortcutsOpen]);

  useEffect(() => {
    mountedAtRef.current = performance.now();

    const recordInitialInteraction = () => {
      if (initialInteractionTrackedRef.current) {
        return;
      }
      initialInteractionTrackedRef.current = true;
      const value = Math.max(0, performance.now() - mountedAtRef.current);
      telemetryRef.current = recordWallTelemetryMetric("initialInteractMs", value);
    };

    window.addEventListener("pointerdown", recordInitialInteraction, { passive: true });
    window.addEventListener("keydown", recordInitialInteraction);
    return () => {
      window.removeEventListener("pointerdown", recordInitialInteraction);
      window.removeEventListener("keydown", recordInitialInteraction);
    };
  }, []);

  return { markOpenIntent };
};
