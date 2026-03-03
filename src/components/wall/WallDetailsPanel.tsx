"use client";

import type { ReactNode } from "react";

import { panelCloseBtn, wallPanelSurface } from "@/components/wall/wallChromeClasses";

type WallDetailsPanelProps = {
  rightPanelOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const WallDetailsPanel = ({
  rightPanelOpen,
  onClose,
  children,
}: WallDetailsPanelProps) => {
  return (
    <aside
      className={`${wallPanelSurface} right-4 top-4 flex max-h-[calc(100dvh-2rem)] w-[21rem] flex-col overflow-hidden p-4 ${rightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Details</h3>
        <button type="button" onClick={onClose} className={panelCloseBtn}>
          Close
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">Tags, templates, history and recall controls for the current wall.</p>
      <div className="mt-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
        {children}
      </div>
    </aside>
  );
};
