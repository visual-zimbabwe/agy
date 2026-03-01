import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PersistedWallState } from "./types";
import { CAMERA_DEFAULTS } from "./constants";

const STORAGE_KEY = "idea-wall-mobile/v1";

export const loadWallSnapshot = async (): Promise<PersistedWallState | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWallState> & { notes?: Record<string, unknown> };
    return {
      notes: (parsed.notes as PersistedWallState["notes"]) ?? {},
      zones: parsed.zones ?? {},
      zoneGroups: parsed.zoneGroups ?? {},
      noteGroups: parsed.noteGroups ?? {},
      links: parsed.links ?? {},
      camera: parsed.camera ?? CAMERA_DEFAULTS,
      lastColor: parsed.lastColor
    };
  } catch {
    return null;
  }
};

export const saveWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};
