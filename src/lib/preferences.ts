export type ThemePreference = "system" | "light" | "dark";

export type UserPreferences = {
  theme: ThemePreference;
  reduceMotion: boolean;
  compactMode: boolean;
};

export const preferenceStorageKeys = {
  theme: "idea-wall-pref-theme",
  reduceMotion: "idea-wall-pref-reduced-motion",
  compactMode: "idea-wall-pref-compact-mode",
} as const;

const defaultPreferences: UserPreferences = {
  theme: "system",
  reduceMotion: false,
  compactMode: false,
};

const normalizeThemePreference = (value: string | null): ThemePreference => {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
};

export const readStoredPreferences = (): UserPreferences => {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    return {
      theme: normalizeThemePreference(window.localStorage.getItem(preferenceStorageKeys.theme)),
      reduceMotion: window.localStorage.getItem(preferenceStorageKeys.reduceMotion) === "true",
      compactMode: window.localStorage.getItem(preferenceStorageKeys.compactMode) === "true",
    };
  } catch {
    return defaultPreferences;
  }
};

export const persistPreferences = (preferences: UserPreferences) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(preferenceStorageKeys.theme, preferences.theme);
    window.localStorage.setItem(preferenceStorageKeys.reduceMotion, String(preferences.reduceMotion));
    window.localStorage.setItem(preferenceStorageKeys.compactMode, String(preferences.compactMode));
  } catch {
    // Ignore write failures (private mode/quota constraints).
  }
};

export const applyPreferencesToDocument = (preferences: UserPreferences) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.themePreference = preferences.theme;
  document.documentElement.classList.toggle("motion-reduce", preferences.reduceMotion);
  document.documentElement.classList.toggle("compact-mode", preferences.compactMode);
};
