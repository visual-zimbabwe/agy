"use client";

import type { ReactNode } from "react";

import { panelCloseBtn, wallPanelSurface } from "@/components/wall/wallChromeClasses";

type WallDetailsPanelProps = {
  rightPanelOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export const WallDetailsPanel = ({
  rightPanelOpen,
  onClose,
  title = "Details",
  description = "A polished control center for selection context, recall, review, structure, and maintenance.",
  children,
}: WallDetailsPanelProps) => {
  return (
    <aside
      className={`${wallPanelSurface} inset-y-3 right-3 flex h-[calc(100dvh-1.5rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden md:inset-y-4 md:right-4 md:h-[calc(100dvh-2rem)] md:w-[23.5rem] ${rightPanelOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[calc(100%+1.5rem)] opacity-0"}`}
      aria-label="Details sidebar"
    >
      <div className="flex min-h-0 h-full flex-col bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-elevated)_94%,black_6%)_0%,color-mix(in_srgb,var(--color-surface)_92%,black_8%)_100%)]">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border-muted)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_92%,black_8%)] px-5 pb-4 pt-5 backdrop-blur-[var(--blur-panel)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Workspace Inspector</p>
              <h3 className="mt-2 text-[1.05rem] font-semibold leading-5 text-[var(--color-text)]">{title}</h3>
              <p className="mt-2 max-w-[24ch] text-[11px] leading-5 text-[var(--color-text-muted)]">{description}</p>
            </div>
            <button type="button" onClick={onClose} className={panelCloseBtn}>
              Close
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-4 [scrollbar-gutter:stable]">
          {children}
        </div>
      </div>
    </aside>
  );
};
