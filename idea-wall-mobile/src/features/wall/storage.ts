import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PersistedWallState } from "./types";

const STORAGE_KEY = "idea-wall-mobile/v1";

export const loadWallSnapshot = async (): Promise<PersistedWallState | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PersistedWallState;
    return parsed;
  } catch {
    return null;
  }
};

export const saveWallSnapshot = async (snapshot: PersistedWallState): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};
