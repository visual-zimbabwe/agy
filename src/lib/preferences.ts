import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export type StartupBehavior = "default_page" | "continue_last";
export type StartupPage = "/wall" | "/decks" | "/settings";

export const allowedStartupPaths = new Set<StartupPage | "/help">(["/wall", "/decks", "/settings", "/help"]);

const removedStartupPaths = new Set(["/page", "/media"]);

const normalizeStartupDefaultPage = (value: string | null): StartupPage => {
  if (value && removedStartupPaths.has(value)) {
    return "/wall";
  }
  if (value === "/decks" || value === "/settings") {
    return value;
  }
  return "/wall";
};

export type UserPreferences = {
  startupBehavior: StartupBehavior;
  startupDefaultPage: StartupPage;
  autoTimezone: boolean;
  manualTimezone: string;
};

const keyWithSlug = (suffix: string) => `${appSlug}-${suffix}`;
const legacyKeyWithSlug = (suffix: string) => `${legacyAppSlug}-${suffix}`;

export const preferenceStorageKeys = {
  startupBehavior: keyWithSlug("pref-startup-behavior"),
  startupDefaultPage: keyWithSlug("pref-startup-default-page"),
  autoTimezone: keyWithSlug("pref-auto-timezone"),
  manualTimezone: keyWithSlug("pref-manual-timezone"),
  lastVisitedPath: keyWithSlug("last-visited-path"),
} as const;

const legacyPreferenceStorageKeys = {
  startupBehavior: legacyKeyWithSlug("pref-startup-behavior"),
  startupDefaultPage: legacyKeyWithSlug("pref-startup-default-page"),
  autoTimezone: legacyKeyWithSlug("pref-auto-timezone"),
  manualTimezone: legacyKeyWithSlug("pref-manual-timezone"),
  lastVisitedPath: legacyKeyWithSlug("last-visited-path"),
} as const;

export { legacyPreferenceStorageKeys };

const defaultPreferences: UserPreferences = {
  startupBehavior: "continue_last",
  startupDefaultPage: "/wall",
  autoTimezone: true,
  manualTimezone: "UTC",
};

export const readStoredPreferences = (): UserPreferences => {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    return {
      startupBehavior:
        readStorageValue(preferenceStorageKeys.startupBehavior, [legacyPreferenceStorageKeys.startupBehavior]) === "default_page"
          ? "default_page"
          : "continue_last",
      startupDefaultPage: (() => {
        const value = readStorageValue(preferenceStorageKeys.startupDefaultPage, [legacyPreferenceStorageKeys.startupDefaultPage]);
        const normalized = normalizeStartupDefaultPage(value);
        if (value && value !== normalized) {
          writeStorageValue(preferenceStorageKeys.startupDefaultPage, normalized);
        }
        return normalized;
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
    writeStorageValue(preferenceStorageKeys.startupBehavior, preferences.startupBehavior);
    writeStorageValue(preferenceStorageKeys.startupDefaultPage, preferences.startupDefaultPage);
    writeStorageValue(preferenceStorageKeys.autoTimezone, String(preferences.autoTimezone));
    writeStorageValue(preferenceStorageKeys.manualTimezone, preferences.manualTimezone);
  } catch {
    // Ignore write failures (private mode/quota constraints).
  }
};

export const applyPreferencesToDocument = () => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.themePreference = "light";
};

const sanitizeLastVisitedPath = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (value === "/media" || value === "/page") {
    return "/wall";
  }

  return allowedStartupPaths.has(value as StartupPage | "/help") ? value : null;
};

export const readLastVisitedPath = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = readStorageValue(preferenceStorageKeys.lastVisitedPath, [legacyPreferenceStorageKeys.lastVisitedPath]);
  const sanitized = sanitizeLastVisitedPath(raw);

  if (raw && sanitized !== raw) {
    try {
      writeStorageValue(preferenceStorageKeys.lastVisitedPath, sanitized ?? "/wall");
    } catch {
      // Ignore write failures (private mode/quota constraints).
    }
  }

  return sanitized;
};

export const persistLastVisitedPath = (pathname: string) => {
  if (typeof window === "undefined" || !allowedStartupPaths.has(pathname as StartupPage | "/help")) {
    return;
  }

  try {
    writeStorageValue(preferenceStorageKeys.lastVisitedPath, pathname);
  } catch {
    // Ignore write failures (private mode/quota constraints).
  }
};
