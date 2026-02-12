export const NOTE_COLORS = [
  "#FEEA89",
  "#FFD2B3",
  "#BCEBCB",
  "#BDE5FF",
  "#F7C6FF",
  "#F2F2F2",
] as const;

export const ZONE_COLORS = ["#E7F6F2", "#FFF4CC", "#EDEBFF", "#FFE7EE"] as const;

export const NOTE_DEFAULTS = {
  width: 220,
  height: 160,
  minWidth: 140,
  minHeight: 110,
  textSize: "md" as const,
};

export const NOTE_TEXT_SIZES = [
  { value: "sm", label: "S", fontSize: 14, lineHeight: 1.32 },
  { value: "md", label: "M", fontSize: 17, lineHeight: 1.35 },
  { value: "lg", label: "L", fontSize: 20, lineHeight: 1.36 },
] as const;

export const NOTE_TEXT_FONTS = [
  { value: "nunito", label: "Nunito", family: "\"Nunito\", \"Trebuchet MS\", sans-serif" },
  { value: "merriweather", label: "Merriweather", family: "\"Merriweather\", \"Palatino Linotype\", serif" },
  { value: "jetbrains_mono", label: "JetBrains Mono", family: "\"JetBrains Mono\", \"Cascadia Code\", monospace" },
  { value: "patrick_hand", label: "Patrick Hand", family: "\"Patrick Hand\", \"Bradley Hand\", cursive" },
] as const;

export const ZONE_DEFAULTS = {
  width: 420,
  height: 280,
  minWidth: 180,
  minHeight: 120,
};

export const ZONE_KIND_DEFAULTS = {
  frame: {
    width: ZONE_DEFAULTS.width,
    height: ZONE_DEFAULTS.height,
    label: "Frame",
  },
  column: {
    width: 320,
    height: 520,
    label: "Column",
  },
  swimlane: {
    width: 760,
    height: 190,
    label: "Swimlane",
  },
} as const;

export const LINK_TYPES = [
  { value: "cause_effect", label: "Cause -> Effect", color: "#ef4444" },
  { value: "dependency", label: "Dependency", color: "#2563eb" },
  { value: "idea_execution", label: "Idea -> Execution", color: "#16a34a" },
] as const;

export const TEMPLATE_TYPES = [
  { value: "brainstorm", label: "Brainstorm" },
  { value: "retro", label: "Retro" },
  { value: "strategy_map", label: "Strategy Map" },
] as const;

export const GROUP_COLORS = ["#FB7185", "#22C55E", "#3B82F6", "#F59E0B", "#A855F7"] as const;
