"use client";

import type { ReactNode } from "react";

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
  description = "Selection context, recall, review, structure, and maintenance in one place.",
  children,
}: WallDetailsPanelProps) => {
  return (
    <aside
      className={`pointer-events-auto absolute right-5 top-24 z-40 flex h-[calc(100dvh-8rem)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[28px] border border-[#efe4d8] bg-[rgba(252,249,244,0.9)] shadow-[0_24px_60px_rgba(28,28,25,0.08)] backdrop-blur-2xl transition-all duration-300 md:right-5 md:w-[23.5rem] ${rightPanelOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[120%] opacity-0"}`}
      aria-label="Details sidebar"
    >
      <div className="flex min-h-0 h-full flex-col">
        <div className="border-b border-[#efe4d8] px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8277]">Details</p>
              <p className="mt-1 font-[Newsreader] text-[1.55rem] italic leading-none text-[#1c1c19]">Workspace Inspector</p>
              <p className="mt-2 max-w-[28ch] text-[12px] leading-5 text-[#675d55]">{description}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7468] transition hover:bg-[#1c1c19]/[0.05] hover:text-[#1c1c19]">
              Close
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 [scrollbar-gutter:stable]">
          {children}
        </div>
      </div>
    </aside>
  );
};
