import {
  type StartupBehavior,
  type StartupPage,
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
import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export const accountSettingsUpdatedEventName = `${appSlug}-account-settings-updated`;
export const accountLayoutPrefsStorageKey = `${appSlug}-layout-prefs`;
const legacyAccountLayoutPrefsStorageKey = `${legacyAppSlug}-layout-prefs`;

export type WallLayoutPrefs = {
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

export type AccountSettings = UserPreferences & {
  keyboardColorSlots: Array<string | null>;
  wallLayoutPrefs: WallLayoutPrefs;
};

export const defaultWallLayoutPrefs: WallLayoutPrefs = {
  showDetailsPanel: false,
  showContextBar: true,
  showNoteTags: false,
};

export const defaultAccountSettings = (): AccountSettings => ({
  ...readStoredPreferences(),
  keyboardColorSlots: readKeyboardColorSlots(),
  wallLayoutPrefs: readStoredWallLayoutPrefs(),
});

export const normalizeStartupBehavior = (value: unknown): StartupBehavior =>
  value === "default_page" ? "default_page" : "continue_last";

export const normalizeStartupPage = (value: unknown): StartupPage => {
  if (value === "/page" || value === "/media") {
    return "/wall";
  }
  if (value === "/decks" || value === "/settings") {
    return value;
  }
  return "/wall";
};

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
  const parsed = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    showDetailsPanel: normalizeBoolean(parsed.showDetailsPanel, defaultWallLayoutPrefs.showDetailsPanel),
    showContextBar: normalizeBoolean(parsed.showContextBar, defaultWallLayoutPrefs.showContextBar),
    showNoteTags: normalizeBoolean(parsed.showNoteTags, defaultWallLayoutPrefs.showNoteTags),
  };
};

export const normalizeAccountSettings = (value: unknown): AccountSettings => {
  const parsed = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<AccountSettings>) : {};
  return {
    startupBehavior: normalizeStartupBehavior(parsed.startupBehavior),
    startupDefaultPage: normalizeStartupPage(parsed.startupDefaultPage),
    autoTimezone: normalizeBoolean(parsed.autoTimezone, true),
    manualTimezone: normalizeTimezone(parsed.manualTimezone),
    keyboardColorSlots: normalizeKeyboardColorSlots(parsed.keyboardColorSlots),
    wallLayoutPrefs: normalizeWallLayoutPrefs(parsed.wallLayoutPrefs),
  };
};

export const readStoredWallLayoutPrefs = (): WallLayoutPrefs => {
  if (typeof window === "undefined") {
    return defaultWallLayoutPrefs;
  }
  try {
    return normalizeWallLayoutPrefs(JSON.parse(readStorageValue(accountLayoutPrefsStorageKey, [legacyAccountLayoutPrefsStorageKey]) ?? "null"));
  } catch {
    return defaultWallLayoutPrefs;
  }
};

export const persistAccountSettingsLocally = (settings: AccountSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeAccountSettings(settings);
  persistPreferences(normalized);
  applyPreferencesToDocument();
  writeKeyboardColorSlots(normalized.keyboardColorSlots);
  writeStorageValue(accountLayoutPrefsStorageKey, JSON.stringify(normalized.wallLayoutPrefs));
  window.dispatchEvent(new CustomEvent(accountSettingsUpdatedEventName));
};
