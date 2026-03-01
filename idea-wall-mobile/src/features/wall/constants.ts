export const NOTE_COLORS = ["#FEEA89", "#FFD2B3", "#BCEBCB", "#BDE5FF", "#F7C6FF", "#F2F2F2"] as const;

export const ZONE_COLORS = ["#E7F6F2", "#FFF4CC", "#EDEBFF", "#FFE7EE"] as const;

export const NOTE_DEFAULTS = {
  width: 220,
  height: 160,
  minWidth: 140,
  minHeight: 110,
  textColor: "#1F2937",
  textVAlign: "top" as const,
  textSizePx: 16,
  textSize: "md" as const
} as const;

export const NOTE_TEXT_SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72] as const;

export const ZONE_DEFAULTS = {
  width: 420,
  height: 280,
  minWidth: 180,
  minHeight: 120
} as const;

export const ZONE_KIND_DEFAULTS = {
  frame: {
    width: ZONE_DEFAULTS.width,
    height: ZONE_DEFAULTS.height,
    label: "Frame"
  },
  column: {
    width: 320,
    height: 520,
    label: "Column"
  },
  swimlane: {
    width: 760,
    height: 190,
    label: "Swimlane"
  }
} as const;

export const LINK_TYPES = [
  { value: "cause_effect", label: "Cause -> Effect", color: "#EF4444" },
  { value: "dependency", label: "Dependency", color: "#2563EB" },
  { value: "idea_execution", label: "Idea -> Execution", color: "#16A34A" }
] as const;

export const TEMPLATE_TYPES = [
  { value: "brainstorm", label: "Brainstorm" },
  { value: "retro", label: "Retro" },
  { value: "strategy_map", label: "Strategy" }
] as const;

export const GROUP_COLORS = ["#FB7185", "#22C55E", "#3B82F6", "#F59E0B", "#A855F7"] as const;

export const CAMERA_DEFAULTS = {
  x: 3000,
  y: 3000,
  zoom: 1
};
