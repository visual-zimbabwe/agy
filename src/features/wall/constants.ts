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
  textColor: "#1F2937",
  textVAlign: "top" as const,
  textSizePx: 16,
  textSize: "md" as const,
};

export const JOURNAL_NOTE_DEFAULTS = {
  color: "#FFFFFF",
  width: 250,
  height: 208,
  textColor: "#1C1C19",
  textFont: "newsreader" as const,
  textSizePx: 18,
};

export const EISENHOWER_NOTE_DEFAULTS = {
  color: "#F4EFE7",
  width: 340,
  height: 284,
  textColor: "#1F2937",
  textFont: "work_sans" as const,
  textSizePx: 14,
};

export const JOKER_NOTE_DEFAULTS = {
  color: "#D6FF57",
  width: 240,
  height: 184,
  textColor: "#2E1065",
  textFont: "nunito" as const,
  textSizePx: 17,
};

export const THRONE_NOTE_DEFAULTS = {
  color: "#FF2400",
  width: 240,
  height: 184,
  textColor: "#FFF5E6",
  textFont: "nunito" as const,
  textSizePx: 17,
};

export const CURRENCY_NOTE_DEFAULTS = {
  color: "#4B3F72",
  width: 332,
  height: 224,
  textColor: "#F8F7FF",
  textFont: "work_sans" as const,
  textSizePx: 15,
};

export const POETRY_NOTE_DEFAULTS = {
  color: "#B73A3A",
  width: 320,
  height: 260,
  textColor: "#000000",
  textFont: "merriweather" as const,
  textSizePx: 14,
};

export const NOTE_TEXT_SIZES = [
  { value: "sm", label: "S", fontSize: 14, lineHeight: 1.32 },
  { value: "md", label: "M", fontSize: 17, lineHeight: 1.35 },
  { value: "lg", label: "L", fontSize: 20, lineHeight: 1.36 },
] as const;

export const NOTE_TEXT_FONTS = [
  { value: "newsreader", label: "Newsreader", family: "\"Newsreader\", \"Playfair Display\", \"Times New Roman\", serif" },
  { value: "roboto", label: "Roboto", family: "\"Roboto\", \"Segoe UI\", sans-serif" },
  { value: "open_sans", label: "Open Sans", family: "\"Open Sans\", \"Segoe UI\", sans-serif" },
  { value: "lato", label: "Lato", family: "\"Lato\", \"Segoe UI\", sans-serif" },
  { value: "montserrat", label: "Montserrat", family: "\"Montserrat\", \"Segoe UI\", sans-serif" },
  { value: "poppins", label: "Poppins", family: "\"Poppins\", \"Segoe UI\", sans-serif" },
  { value: "nunito", label: "Nunito", family: "\"Nunito\", \"Segoe UI\", sans-serif" },
  { value: "source_sans_3", label: "Source Sans 3", family: "\"Source Sans 3\", \"Segoe UI\", sans-serif" },
  { value: "inter", label: "Inter", family: "\"Inter\", \"Segoe UI\", sans-serif" },
  { value: "raleway", label: "Raleway", family: "\"Raleway\", \"Segoe UI\", sans-serif" },
  { value: "ubuntu", label: "Ubuntu", family: "\"Ubuntu\", \"Segoe UI\", sans-serif" },
  { value: "playfair_display", label: "Playfair Display", family: "\"Playfair Display\", \"Times New Roman\", serif" },
  { value: "merriweather", label: "Merriweather", family: "\"Merriweather\", \"Times New Roman\", serif" },
  { value: "pt_sans", label: "PT Sans", family: "\"PT Sans\", \"Segoe UI\", sans-serif" },
  { value: "noto_sans", label: "Noto Sans", family: "\"Noto Sans\", \"Segoe UI\", sans-serif" },
  { value: "work_sans", label: "Work Sans", family: "\"Work Sans\", \"Segoe UI\", sans-serif" },
  { value: "oswald", label: "Oswald", family: "\"Oswald\", \"Segoe UI\", sans-serif" },
  { value: "rubik", label: "Rubik", family: "\"Rubik\", \"Segoe UI\", sans-serif" },
  { value: "fira_sans", label: "Fira Sans", family: "\"Fira Sans\", \"Segoe UI\", sans-serif" },
  { value: "josefin_sans", label: "Josefin Sans", family: "\"Josefin Sans\", \"Segoe UI\", sans-serif" },
  { value: "quicksand", label: "Quicksand", family: "\"Quicksand\", \"Segoe UI\", sans-serif" },
  { value: "patrick_hand", label: "Patrick Hand", family: "\"Patrick Hand\", \"Comic Sans MS\", cursive" },
] as const;

export const NOTE_TEXT_SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72] as const;

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
  { value: "wiki", label: "Wiki Link", color: "#64748b" },
] as const;

export const TEMPLATE_TYPES = [
  { value: "brainstorm", label: "Brainstorm" },
  { value: "retro", label: "Retro" },
  { value: "strategy_map", label: "Strategy Map" },
] as const;

export const GROUP_COLORS = ["#FB7185", "#22C55E", "#3B82F6", "#F59E0B", "#A855F7"] as const;

