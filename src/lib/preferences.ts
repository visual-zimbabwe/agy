export type ThemePreference = "system" | "light" | "dark";
export type StartupBehavior = "default_page" | "continue_last";
export type StartupPage = "/wall" | "/decks";

export type UserPreferences = {
  theme: ThemePreference;
  startupBehavior: StartupBehavior;
  startupDefaultPage: StartupPage;
  autoTimezone: boolean;
  manualTimezone: string;
};

export const preferenceStorageKeys = {
  theme: "idea-wall-pref-theme",
  startupBehavior: "idea-wall-pref-startup-behavior",
  startupDefaultPage: "idea-wall-pref-startup-default-page",
  autoTimezone: "idea-wall-pref-auto-timezone",
  manualTimezone: "idea-wall-pref-manual-timezone",
  lastVisitedPath: "idea-wall-last-visited-path",
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
      theme: normalizeThemePreference(window.localStorage.getItem(preferenceStorageKeys.theme)),
      startupBehavior: window.localStorage.getItem(preferenceStorageKeys.startupBehavior) === "default_page" ? "default_page" : "continue_last",
      startupDefaultPage: window.localStorage.getItem(preferenceStorageKeys.startupDefaultPage) === "/decks" ? "/decks" : "/wall",
      autoTimezone: window.localStorage.getItem(preferenceStorageKeys.autoTimezone) !== "false",
      manualTimezone: window.localStorage.getItem(preferenceStorageKeys.manualTimezone) || defaultPreferences.manualTimezone,
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
    window.localStorage.setItem(preferenceStorageKeys.startupBehavior, preferences.startupBehavior);
    window.localStorage.setItem(preferenceStorageKeys.startupDefaultPage, preferences.startupDefaultPage);
    window.localStorage.setItem(preferenceStorageKeys.autoTimezone, String(preferences.autoTimezone));
    window.localStorage.setItem(preferenceStorageKeys.manualTimezone, preferences.manualTimezone);
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
