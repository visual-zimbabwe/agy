"use client";

import type { ReactNode } from "react";

type WallDetailsPanelProps = {
  isCompactLayout: boolean;
  rightPanelOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const WallDetailsPanel = ({ isCompactLayout, rightPanelOpen, onClose, children }: WallDetailsPanelProps) => {
  return (
    <aside
      className={`pointer-events-auto absolute z-40 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)] transition-[transform,opacity] duration-[var(--motion-normal)] ease-out motion-panel-enter ${
        isCompactLayout
          ? `right-2 top-2 w-[min(24rem,calc(100%-1rem))] ${rightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"}`
          : `right-3 top-3 w-80 ${rightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"}`
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Details</h3>
        {isCompactLayout && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            Close
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Tags, templates, history and recall controls for the current wall.</p>
      {children}
    </aside>
  );
};
