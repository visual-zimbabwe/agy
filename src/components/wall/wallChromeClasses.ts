"use client";

export const toolbarSurface =
  "rounded-[calc(var(--radius-xl)+0.15rem)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-2 shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] motion-panel-enter";

const toolbarBtnBase =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--motion-fast)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const toolbarBtn =
  `${toolbarBtnBase} border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--shadow-md)]`;

export const toolbarBtnPrimary =
  `${toolbarBtnBase} border-[var(--color-accent-strong)] bg-[var(--color-accent-strong)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent)]`;

export const toolbarBtnActive =
  `${toolbarBtnBase} border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.10)] text-[var(--color-accent-strong)] shadow-[var(--shadow-sm)] hover:bg-[color:rgb(2_132_199_/_0.16)]`;

export const toolbarBtnAccent =
  `${toolbarBtnBase} border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] hover:bg-[color:rgb(217_232_239_/_0.92)]`;

export const toolbarBtnCompact =
  "rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,color] duration-[var(--motion-fast)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] disabled:opacity-40";

export const toolbarSelect =
  "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] shadow-[var(--shadow-sm)] outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";

export const toolbarDivider = "mx-1.5 h-6 w-px bg-[var(--color-border)]";
export const toolbarLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]";
export const toolbarHistoryPill =
  "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]";

export const wallPanelSurface =
  "pointer-events-auto absolute z-40 rounded-[calc(var(--radius-xl)+0.2rem)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)] transition-[transform,opacity] duration-[var(--motion-normal)] ease-out motion-panel-enter";

export const panelCloseBtn =
  "rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

export const statusChip =
  "inline-flex w-fit items-center gap-2.5 self-start rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] motion-panel-enter";

export const brandChip =
  "inline-flex w-fit items-center gap-2.5 self-start rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3.5 py-2 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]";
