"use client";

export const toolbarSurface =
  "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-1.5 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)] motion-panel-enter";

const toolbarBtnBase =
  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--motion-fast)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const toolbarBtn =
  `${toolbarBtnBase} border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--shadow-md)]`;

export const toolbarBtnPrimary =
  `${toolbarBtnBase} border-[var(--color-accent-strong)] bg-[var(--color-accent-strong)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent)]`;

export const toolbarBtnActive =
  `${toolbarBtnBase} border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.10)] text-[var(--color-accent-strong)] shadow-[var(--shadow-sm)] hover:bg-[color:rgb(2_132_199_/_0.16)]`;

export const toolbarBtnAccent =
  `${toolbarBtnBase} border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] hover:bg-[color:rgb(217_232_239_/_0.92)]`;

export const toolbarBtnCompact =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[var(--motion-fast)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] disabled:opacity-40";

export const toolbarSelect =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";

export const toolbarDivider = "mx-1 h-6 w-px bg-[var(--color-border)]";
export const toolbarLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]";
export const toolbarHistoryPill =
  "rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]";
