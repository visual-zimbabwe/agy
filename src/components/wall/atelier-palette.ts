/**
 * Digital Atelier palette for HTML stream/preview surfaces.
 * Konva canvas notes use the related values in spatial/notes/note-style.ts.
 * CSS mirrors live on `.wall-atelier-shell` in globals.css.
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
  background: atelierPalette.warm,
  backgroundImage:
    "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.9) 0%, rgba(252,249,244,1) 42%, rgba(240,237,232,0.84) 100%)",
  axis: "rgba(223, 192, 184, 0.55)",
  axisSoft: "rgba(223, 192, 184, 0.24)",
  chipBg: "rgba(246, 243, 238, 0.94)",
  chipBorder: "rgba(223, 192, 184, 0.36)",
  text: atelierPalette.ink,
  muted: "rgba(77, 99, 86, 0.82)",
  quiet: "rgba(139, 113, 106, 0.72)",
  shadow: "0 18px 42px rgba(28, 28, 25, 0.08)",
  selection: atelierPalette.terracotta,
} as const;

export const timelineStreamHeaderStyles = {
  background: "rgba(252,249,244,0.82)",
  chipBg: timelineStreamShellStyles.chipBg,
  chipBorder: timelineStreamShellStyles.chipBorder,
  text: atelierPalette.ink,
  muted: timelineStreamShellStyles.muted,
  quiet: timelineStreamShellStyles.quiet,
  shadow: timelineStreamShellStyles.shadow,
} as const;

export type TimelineStreamShellStyles = typeof timelineStreamShellStyles;
