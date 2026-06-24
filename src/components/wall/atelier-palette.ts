/**
 * Digital Atelier palette for HTML stream/preview surfaces.
 * Konva canvas notes use the related values in spatial/notes/note-style.ts.
 * CSS mirrors live on `.wall-atelier-shell` in globals.css.
 *
 * Timeline stream chrome aliases unified product tokens from `:root` in globals.css.
 */
export const atelierPalette = {
  paper: "#fffdfa",
  warm: "#fcf9f4",
  wash: "#f6f3ee",
  terracotta: "#a33818",
  forest: "#4d6356",
  gold: "#755717",
  ink: "#1c1c19",
  muted: "#5b463f",
  quiet: "#8b716a",
  line: "rgba(223,192,184,0.6)",
  shadow: "0 18px 42px rgba(28,28,25,0.12)",
  shadowDetail: "0 24px 56px rgba(28,28,25,0.16)",
} as const;

export const timelineStreamShellStyles = {
  background: "var(--background)",
  backgroundImage: "none",
  axis: "var(--color-border)",
  axisSoft: "var(--color-border-muted)",
  chipBg: "var(--color-surface-glass)",
  chipBorder: "var(--color-border)",
  text: "var(--color-text)",
  muted: "var(--color-text-muted)",
  quiet: "var(--color-text-muted)",
  shadow: "var(--shadow-md)",
  selection: "#a33818",
} as const;

export const timelineStreamHeaderStyles = {
  background: "var(--color-surface-glass)",
  chipBg: timelineStreamShellStyles.chipBg,
  chipBorder: timelineStreamShellStyles.chipBorder,
  text: timelineStreamShellStyles.text,
  muted: timelineStreamShellStyles.muted,
  quiet: timelineStreamShellStyles.quiet,
  shadow: timelineStreamShellStyles.shadow,
} as const;

export type TimelineStreamShellStyles = typeof timelineStreamShellStyles;
