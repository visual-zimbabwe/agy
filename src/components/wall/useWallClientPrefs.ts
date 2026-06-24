"use client";

import { useEffect, useRef, useState } from "react";

import type { RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import {
  backupReminderCadenceStorageKey,
  layoutPrefsStorageKey,
  legacyBackupReminderCadenceStorageKeys,
  legacyPresentationPathsStorageKeys,
  legacyRecallStorageKeys,
  legacySpatialPrefsStorageKeys,
  presentationPathsStorageKey,
  recallStorageKey,
  spatialPrefsStorageKey,
} from "@/components/wall/wall-storage-keys";
import { accountSettingsUpdatedEventName, readStoredWallLayoutPrefs } from "@/lib/account-settings";
import { parsePresentationPathsPayload, type PresentationPath } from "@/lib/presentation-paths";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export type LayoutPreferenceKey = "showDetailsPanel" | "showContextBar" | "showNoteTags";
export type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;
export type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  dotGridSpacing: number;
};

export const defaultLayoutPrefs: LayoutPreferences = {
  showDetailsPanel: false,
  showContextBar: true,
  showNoteTags: false,
};

export const defaultSpatialPrefs: SpatialPreferences = {
  showDotMatrix: false,
  snapToGuides: true,
  snapToGrid: false,
  dotGridSpacing: 32,
};

const readInitialRecallSearches = (): SavedRecallSearch[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const recallRaw = readStorageValue(recallStorageKey, legacyRecallStorageKeys);
    if (recallRaw) {
      const parsed = JSON.parse(recallRaw) as SavedRecallSearch[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed persisted recall payloads and keep defaults.
  }
  return [];
};

const readInitialSpatialPrefs = (): SpatialPreferences => {
  if (typeof window === "undefined") {
    return defaultSpatialPrefs;
  }
  try {
    const spatialRaw = readStorageValue(spatialPrefsStorageKey, legacySpatialPrefsStorageKeys);
    if (spatialRaw) {
      const parsed = JSON.parse(spatialRaw) as Partial<SpatialPreferences>;
      const spacing = typeof parsed.dotGridSpacing === "number" ? parsed.dotGridSpacing : defaultSpatialPrefs.dotGridSpacing;
      return {
        showDotMatrix: parsed.showDotMatrix ?? defaultSpatialPrefs.showDotMatrix,
        snapToGuides: parsed.snapToGuides ?? defaultSpatialPrefs.snapToGuides,
        snapToGrid: parsed.snapToGrid ?? defaultSpatialPrefs.snapToGrid,
        dotGridSpacing: Math.max(12, Math.min(64, spacing)),
      };
    }
  } catch {
    // Ignore malformed persisted spatial payloads and keep defaults.
  }
  return defaultSpatialPrefs;
};

const readInitialPresentationPaths = (): PresentationPath[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const narrativeRaw = readStorageValue(presentationPathsStorageKey, legacyPresentationPathsStorageKeys);
    if (narrativeRaw) {
      return parsePresentationPathsPayload(narrativeRaw);
    }
  } catch {
    // Ignore malformed persisted narrative payloads and keep defaults.
  }
  return [];
};

const readInitialBackupReminderCadence = (): "off" | "daily" | "weekly" => {
  if (typeof window === "undefined") {
    return "off";
  }
  const cadenceRaw = readStorageValue(backupReminderCadenceStorageKey, legacyBackupReminderCadenceStorageKeys);
  return cadenceRaw === "daily" || cadenceRaw === "weekly" ? cadenceRaw : "off";
};

export const useWallClientPrefs = () => {
  const [layoutPrefs, setLayoutPrefs] = useState<LayoutPreferences>(() =>
    typeof window === "undefined" ? defaultLayoutPrefs : readStoredWallLayoutPrefs(),
  );
  const [spatialPrefs, setSpatialPrefs] = useState<SpatialPreferences>(readInitialSpatialPrefs);
  const [savedRecallSearches, setSavedRecallSearches] = useState<SavedRecallSearch[]>(readInitialRecallSearches);
  const [presentationPaths, setPresentationPaths] = useState<PresentationPath[]>(readInitialPresentationPaths);
  const [backupReminderCadence, setBackupReminderCadence] = useState<"off" | "daily" | "weekly">(readInitialBackupReminderCadence);
  const skipInitialPersistRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyAccountSettings = () => {
      setLayoutPrefs(readStoredWallLayoutPrefs());
    };

    window.addEventListener(accountSettingsUpdatedEventName, applyAccountSettings);
    return () => {
      window.removeEventListener(accountSettingsUpdatedEventName, applyAccountSettings);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }
    writeStorageValue(recallStorageKey, JSON.stringify(savedRecallSearches));
  }, [savedRecallSearches]);

  useEffect(() => {
    if (typeof window === "undefined" || skipInitialPersistRef.current) {
      return;
    }
    writeStorageValue(layoutPrefsStorageKey, JSON.stringify(layoutPrefs));
  }, [layoutPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || skipInitialPersistRef.current) {
      return;
    }
    writeStorageValue(spatialPrefsStorageKey, JSON.stringify(spatialPrefs));
  }, [spatialPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || skipInitialPersistRef.current) {
      return;
    }
    writeStorageValue(presentationPathsStorageKey, JSON.stringify(presentationPaths));
  }, [presentationPaths]);

  useEffect(() => {
    if (typeof window === "undefined" || skipInitialPersistRef.current) {
      return;
    }
    writeStorageValue(backupReminderCadenceStorageKey, backupReminderCadence);
  }, [backupReminderCadence]);

  return {
    layoutPrefs,
    setLayoutPrefs,
    spatialPrefs,
    setSpatialPrefs,
    savedRecallSearches,
    setSavedRecallSearches,
    presentationPaths,
    setPresentationPaths,
    backupReminderCadence,
    setBackupReminderCadence,
  };
};

export type { RecallDateFilter, SavedRecallSearch };
