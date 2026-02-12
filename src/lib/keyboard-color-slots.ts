import { NOTE_COLORS } from "@/features/wall/constants";

export const MAX_KEYBOARD_COLOR_SLOTS = 9;
export const keyboardColorSlotsStorageKey = "idea-wall-keyboard-color-slots-v1";

const normalizeHexColor = (raw: string) => {
  const trimmed = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return null;
};

export const defaultKeyboardColorSlots = Array.from({ length: MAX_KEYBOARD_COLOR_SLOTS }, (_, index) => NOTE_COLORS[index] ?? null);

export const readKeyboardColorSlots = () => {
  if (typeof window === "undefined") {
    return [...defaultKeyboardColorSlots];
  }

  try {
    const raw = window.localStorage.getItem(keyboardColorSlotsStorageKey);
    if (!raw) {
      return [...defaultKeyboardColorSlots];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...defaultKeyboardColorSlots];
    }

    const next = Array.from({ length: MAX_KEYBOARD_COLOR_SLOTS }, (_, index) => {
      const value = parsed[index];
      if (typeof value !== "string") {
        return null;
      }
      return normalizeHexColor(value);
    });
    return next;
  } catch {
    return [...defaultKeyboardColorSlots];
  }
};

export const writeKeyboardColorSlots = (slots: Array<string | null>) => {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = Array.from({ length: MAX_KEYBOARD_COLOR_SLOTS }, (_, index) => {
    const value = slots[index];
    if (!value) {
      return null;
    }
    return normalizeHexColor(value);
  });
  try {
    window.localStorage.setItem(keyboardColorSlotsStorageKey, JSON.stringify(normalized));
  } catch {
    // Ignore storage write failures.
  }
};
