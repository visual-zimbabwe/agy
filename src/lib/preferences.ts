import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export type ThemePreference = "system" | "light" | "dark";
export type StartupBehavior = "default_page" | "continue_last";
export type StartupPage = "/wall" | "/page" | "/decks" | "/settings";

export type UserPreferences = {
  theme: ThemePreference;
  startupBehavior: StartupBehavior;
  startupDefaultPage: StartupPage;
  autoTimezone: boolean;
  manualTimezone: string;
};

const keyWithSlug = (suffix: string) => `${appSlug}-${suffix}`;
const legacyKeyWithSlug = (suffix: string) => `${legacyAppSlug}-${suffix}`;

export const preferenceStorageKeys = {
  theme: keyWithSlug("pref-theme"),
  startupBehavior: keyWithSlug("pref-startup-behavior"),
  startupDefaultPage: keyWithSlug("pref-startup-default-page"),
  autoTimezone: keyWithSlug("pref-auto-timezone"),
  manualTimezone: keyWithSlug("pref-manual-timezone"),
  lastVisitedPath: keyWithSlug("last-visited-path"),
} as const;

const legacyPreferenceStorageKeys = {
  theme: legacyKeyWithSlug("pref-theme"),
  startupBehavior: legacyKeyWithSlug("pref-startup-behavior"),
  startupDefaultPage: legacyKeyWithSlug("pref-startup-default-page"),
  autoTimezone: legacyKeyWithSlug("pref-auto-timezone"),
  manualTimezone: legacyKeyWithSlug("pref-manual-timezone"),
  lastVisitedPath: legacyKeyWithSlug("last-visited-path"),
} as const;

const defaultPreferences: UserPreferences = {
  theme: "system",
  startupBehavior: "continue_last",
  startupDefaultPage: "/wall",
  autoTimezone: true,
  manualTimezone: "UTC",
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
      theme: normalizeThemePreference(readStorageValue(preferenceStorageKeys.theme, [legacyPreferenceStorageKeys.theme])),
      startupBehavior:
        readStorageValue(preferenceStorageKeys.startupBehavior, [legacyPreferenceStorageKeys.startupBehavior]) === "default_page"
          ? "default_page"
          : "continue_last",
      startupDefaultPage: (() => {
        const value = readStorageValue(preferenceStorageKeys.startupDefaultPage, [legacyPreferenceStorageKeys.startupDefaultPage]);
        if (value === "/page" || value === "/decks" || value === "/settings") {
          return value;
        }
        return "/wall";
      })(),
      autoTimezone: readStorageValue(preferenceStorageKeys.autoTimezone, [legacyPreferenceStorageKeys.autoTimezone]) !== "false",
      manualTimezone:
        readStorageValue(preferenceStorageKeys.manualTimezone, [legacyPreferenceStorageKeys.manualTimezone]) || defaultPreferences.manualTimezone,
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
    writeStorageValue(preferenceStorageKeys.theme, preferences.theme);
    writeStorageValue(preferenceStorageKeys.startupBehavior, preferences.startupBehavior);
    writeStorageValue(preferenceStorageKeys.startupDefaultPage, preferences.startupDefaultPage);
    writeStorageValue(preferenceStorageKeys.autoTimezone, String(preferences.autoTimezone));
    writeStorageValue(preferenceStorageKeys.manualTimezone, preferences.manualTimezone);
  } catch {
    // Ignore write failures (private mode/quota constraints).
  }
};

export const applyPreferencesToDocument = (preferences: UserPreferences) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.themePreference = preferences.theme;
};
