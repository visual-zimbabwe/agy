"use client";

import { ControlTooltip } from "@/components/wall/WallControls";
import { NOTE_COLORS } from "@/features/wall/constants";
import { useMemo, useState } from "react";

type NoteSwatchesProps = {
  value?: string;
  onSelect: (color: string) => void;
  sortMode?: "recency" | "luminance";
  showCustomColorAdd?: boolean;
};

const RECENT_COLORS_KEY = "idea-wall-note-color-recency";

const COLOR_NAMES: Record<string, string> = {
  "#FEEA89": "Yellow",
  "#BCEBCB": "Mint",
  "#BDE5FF": "Sky Blue",
  "#F7C6FF": "Lavender",
  "#FFD2B3": "Peach",
  "#F2F2F2": "Gray",
};

const normalizeHex = (color: string) => color.trim().toUpperCase();

const hexToRgb = (hexColor: string) => {
  const hex = normalizeHex(hexColor).replace("#", "");
  if (hex.length !== 6) {
    return null;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null;
  }
  return { r, g, b };
};

const channelToLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hexColor: string) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return 0;
  }
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (l1: number, l2: number) => {
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};

const ringColorForSwatch = (swatchColor: string) => {
  const swatchL = relativeLuminance(swatchColor);
  const whiteL = 1;
  const blackL = 0;
  const whiteContrast = contrastRatio(swatchL, whiteL);
  const blackContrast = contrastRatio(swatchL, blackL);
  return whiteContrast >= blackContrast ? "#FFFFFF" : "#0F172A";
};

const dedupeAndFilterPalette = (palette: readonly string[]) => {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const color of palette) {
    const normalized = normalizeHex(color);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(normalized);
  }
  return deduped;
};

const readRecentColors = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }
  try {
    const raw = window.localStorage.getItem(RECENT_COLORS_KEY);
    if (!raw) {
      return [] as string[];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }
    return parsed.filter((value): value is string => typeof value === "string").map(normalizeHex);
  } catch {
    return [] as string[];
  }
};

const writeRecentColors = (colors: string[]) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors));
  } catch {
    // Ignore storage quota/privacy mode failures; chips still work.
  }
};

export const NoteSwatches = ({ value, onSelect, sortMode = "recency", showCustomColorAdd = false }: NoteSwatchesProps) => {
  const [recentColors, setRecentColors] = useState<string[]>(() => readRecentColors());
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const sortedColors = useMemo(() => {
    const palette = dedupeAndFilterPalette(NOTE_COLORS);
    if (sortMode === "luminance") {
      return [...palette].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
    }

    const rank = new Map<string, number>();
    recentColors.forEach((color, index) => {
      rank.set(color, index);
    });
    return [...palette].sort((a, b) => {
      const aRank = rank.get(a);
      const bRank = rank.get(b);
      if (aRank != null && bRank != null) {
        return aRank - bRank;
      }
      if (aRank != null) {
        return -1;
      }
      if (bRank != null) {
        return 1;
      }
      return relativeLuminance(a) - relativeLuminance(b);
    });
  }, [recentColors, sortMode]);

  const applyColor = (rawColor: string) => {
    const color = normalizeHex(rawColor);
    onSelect(color);
    setRecentColors((previous) => {
      const next = [color, ...previous.filter((entry) => entry !== color)].slice(0, NOTE_COLORS.length);
      writeRecentColors(next);
      return next;
    });
  };

  const selected = value ? normalizeHex(value) : undefined;

  return (
    <div className="flex items-center gap-2">
      {sortedColors.map((color) => {
        const colorName = COLOR_NAMES[color] ?? color;
        const isSelected = selected === color;
        const ringColor = ringColorForSwatch(color);

        return (
          <ControlTooltip key={color} label={colorName} side="top">
            <button
              type="button"
              aria-label={colorName}
              className="h-9 w-9 rounded-full border border-black/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 motion-reduce:transform-none motion-reduce:transition-none"
              style={{
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 0 2px ${ringColor}` : "none",
              }}
              onClick={() => applyColor(color)}
            />
          </ControlTooltip>
        );
      })}
      {showCustomColorAdd && (
        <ControlTooltip label="Custom Color" side="top">
          <label className="relative">
            <span className="sr-only">Add custom color</span>
            <input
              type="color"
              className="sr-only"
              value={selected ?? NOTE_COLORS[0]}
              onClick={() => setCustomPickerOpen(true)}
              onBlur={() => setCustomPickerOpen(false)}
              onChange={(event) => applyColor(event.target.value)}
            />
            <span
              aria-hidden="true"
              className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs leading-none text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] motion-reduce:transition-none ${customPickerOpen ? "ring-2 ring-[var(--color-focus)] ring-offset-1" : ""}`}
            >
              +
            </span>
          </label>
        </ControlTooltip>
      )}
    </div>
  );
};
