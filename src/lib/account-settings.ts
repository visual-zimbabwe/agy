import {
  type StartupBehavior,
  type StartupPage,
  type ThemePreference,
  applyPreferencesToDocument,
  persistPreferences,
  readStoredPreferences,
  type UserPreferences,
} from "@/lib/preferences";
import {
  defaultKeyboardColorSlots,
  MAX_KEYBOARD_COLOR_SLOTS,
  readKeyboardColorSlots,
  writeKeyboardColorSlots,
} from "@/lib/keyboard-color-slots";

export const accountSettingsUpdatedEventName = "idea-wall-account-settings-updated";
export const accountLayoutPrefsStorageKey = "idea-wall-layout-prefs";
export const accountControlsModeStorageKey = "idea-wall-controls-mode";

export type WallLayoutPrefs = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

export type ControlsMode = "basic" | "advanced";

export type AccountSettings = UserPreferences & {
  keyboardColorSlots: Array<string | null>;
  wallLayoutPrefs: WallLayoutPrefs;
  controlsMode: ControlsMode;
};

export const defaultWallLayoutPrefs: WallLayoutPrefs = {
  showToolsPanel: true,
  showDetailsPanel: true,
  showContextBar: false,
  showNoteTags: false,
};

export const defaultAccountSettings = (): AccountSettings => ({
  ...readStoredPreferences(),
  keyboardColorSlots: readKeyboardColorSlots(),
  wallLayoutPrefs: readStoredWallLayoutPrefs(),
  controlsMode: readStoredControlsMode(),
});

export const normalizeThemePreference = (value: unknown): ThemePreference =>
  value === "light" || value === "dark" || value === "system" ? value : "system";

export const normalizeStartupBehavior = (value: unknown): StartupBehavior =>
  value === "default_page" ? "default_page" : "continue_last";

export const normalizeStartupPage = (value: unknown): StartupPage =>
  value === "/decks" ? "/decks" : "/wall";

export const normalizeControlsMode = (value: unknown): ControlsMode =>
  value === "advanced" ? "advanced" : "basic";

const normalizeBoolean = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

const normalizeTimezone = (value: unknown) => (typeof value === "string" && value.trim() ? value : "UTC");

const normalizeHexColor = (raw: string) => {
  const trimmed = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return null;
};

export const normalizeKeyboardColorSlots = (value: unknown) =>
  Array.from({ length: MAX_KEYBOARD_COLOR_SLOTS }, (_, index) => {
    if (!Array.isArray(value)) {
      return defaultKeyboardColorSlots[index] ?? null;
    }
    const entry = value[index];
    return typeof entry === "string" ? normalizeHexColor(entry) : null;
  });

export const normalizeWallLayoutPrefs = (value: unknown): WallLayoutPrefs => {
  const parsed = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<WallLayoutPrefs>) : {};
  return {
    showToolsPanel: normalizeBoolean(parsed.showToolsPanel, defaultWallLayoutPrefs.showToolsPanel),
    showDetailsPanel: normalizeBoolean(parsed.showDetailsPanel, defaultWallLayoutPrefs.showDetailsPanel),
    showContextBar: normalizeBoolean(parsed.showContextBar, defaultWallLayoutPrefs.showContextBar),
    showNoteTags: normalizeBoolean(parsed.showNoteTags, defaultWallLayoutPrefs.showNoteTags),
  };
};

export const normalizeAccountSettings = (value: unknown): AccountSettings => {
  const parsed = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<AccountSettings>) : {};
  return {
    theme: normalizeThemePreference(parsed.theme),
    startupBehavior: normalizeStartupBehavior(parsed.startupBehavior),
    startupDefaultPage: normalizeStartupPage(parsed.startupDefaultPage),
    autoTimezone: normalizeBoolean(parsed.autoTimezone, true),
    manualTimezone: normalizeTimezone(parsed.manualTimezone),
    keyboardColorSlots: normalizeKeyboardColorSlots(parsed.keyboardColorSlots),
    wallLayoutPrefs: normalizeWallLayoutPrefs(parsed.wallLayoutPrefs),
    controlsMode: normalizeControlsMode(parsed.controlsMode),
  };
};

export const readStoredWallLayoutPrefs = (): WallLayoutPrefs => {
  if (typeof window === "undefined") {
    return defaultWallLayoutPrefs;
  }
  try {
    return normalizeWallLayoutPrefs(JSON.parse(window.localStorage.getItem(accountLayoutPrefsStorageKey) ?? "null"));
  } catch {
    return defaultWallLayoutPrefs;
  }
};

export const readStoredControlsMode = (): ControlsMode => {
  if (typeof window === "undefined") {
    return "basic";
  }
  return normalizeControlsMode(window.localStorage.getItem(accountControlsModeStorageKey));
};

export const persistAccountSettingsLocally = (settings: AccountSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeAccountSettings(settings);
  persistPreferences(normalized);
  applyPreferencesToDocument(normalized);
  writeKeyboardColorSlots(normalized.keyboardColorSlots);
  window.localStorage.setItem(accountLayoutPrefsStorageKey, JSON.stringify(normalized.wallLayoutPrefs));
  window.localStorage.setItem(accountControlsModeStorageKey, normalized.controlsMode);
  window.dispatchEvent(new CustomEvent(accountSettingsUpdatedEventName));
};
