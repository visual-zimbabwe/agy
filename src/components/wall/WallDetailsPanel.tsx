"use client";

import type { ReactNode } from "react";

import { panelCloseBtn, wallPanelSurface } from "@/components/wall/wallChromeClasses";

type WallDetailsPanelProps = {
  isCompactLayout: boolean;
  rightPanelOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const WallDetailsPanel = ({ isCompactLayout, rightPanelOpen, onClose, children }: WallDetailsPanelProps) => {
  return (
    <aside
      className={`${wallPanelSurface} p-4 ${
        isCompactLayout
          ? `right-3 top-3 w-[min(24rem,calc(100%-1.5rem))] ${rightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"}`
          : `right-4 top-4 w-[21rem] ${rightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"}`
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Details</h3>
        {isCompactLayout && (
          <button
            type="button"
            onClick={onClose}
            className={panelCloseBtn}
          >
            Close
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">Tags, templates, history and recall controls for the current wall.</p>
      {children}
    </aside>
  );
};
