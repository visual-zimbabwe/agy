"use client";

import { memo } from "react";

import type { TimelineStreamDayOption, TimelineStreamSortMode } from "@/components/wall/wallTimelineStreamHelpers";

type WallTimelineStreamHeaderProps = {
  noteCountLabel: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  dayOptions: TimelineStreamDayOption[];
  selectedDayKey: string;
  onDayJump: (dayKey: string) => void;
  sortMode: TimelineStreamSortMode;
  onSortModeChange: (value: TimelineStreamSortMode) => void;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onMovePrevious: () => void;
  onMoveNext: () => void;
  onExit: () => void;
};

const shellStyles = {
  background: "rgba(252,249,244,0.82)",
  chipBg: "rgba(246, 243, 238, 0.94)",
  chipBorder: "rgba(223, 192, 184, 0.36)",
  text: "#1c1c19",
  muted: "rgba(77, 99, 86, 0.82)",
  quiet: "rgba(139, 113, 106, 0.72)",
  shadow: "0 18px 42px rgba(28, 28, 25, 0.08)",
};

const controlClassName =
  "rounded-full border px-3 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]";

export const WallTimelineStreamHeader = memo(function WallTimelineStreamHeader({
  noteCountLabel,
  searchQuery,
  onSearchQueryChange,
  dayOptions,
  selectedDayKey,
  onDayJump,
  sortMode,
  onSortModeChange,
  canMovePrevious,
  canMoveNext,
  onMovePrevious,
  onMoveNext,
  onExit,
}: WallTimelineStreamHeaderProps) {
  return (
    <header
      className="absolute inset-x-0 top-0 z-10 border-b border-white/30 px-4 py-4 backdrop-blur-xl sm:px-8"
      style={{ background: shellStyles.background }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-[Newsreader] text-[28px] italic leading-none" style={{ color: shellStyles.text }}>
              Timeline
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: shellStyles.quiet }}>
              {noteCountLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="pointer-events-auto inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-white/60"
            style={{
              borderColor: shellStyles.chipBorder,
              background: shellStyles.chipBg,
              color: shellStyles.text,
              boxShadow: shellStyles.shadow,
            }}
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="sr-only">Search timeline</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search title, tags, or files"
              className={`${controlClassName} w-full`}
              style={{
                borderColor: shellStyles.chipBorder,
                background: "rgba(255,255,255,0.72)",
                color: shellStyles.text,
              }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: shellStyles.quiet }}>
                Day
              </span>
              <select
                value={selectedDayKey}
                onChange={(event) => onDayJump(event.target.value)}
                disabled={dayOptions.length === 0}
                className={`${controlClassName} min-w-[10rem] appearance-none pr-8`}
                style={{
                  borderColor: shellStyles.chipBorder,
                  background: "rgba(255,255,255,0.72)",
                  color: shellStyles.text,
                }}
              >
                <option value="">Jump to day</option>
                {dayOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div
              className="inline-flex rounded-full border p-1"
              style={{ borderColor: shellStyles.chipBorder, background: shellStyles.chipBg }}
              role="group"
              aria-label="Sort timeline"
            >
              {(["created", "updated"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSortModeChange(mode)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    sortMode === mode ? "bg-white/90 shadow-sm" : "hover:bg-white/50"
                  }`}
                  style={{ color: sortMode === mode ? shellStyles.text : shellStyles.muted }}
                >
                  {mode === "created" ? "Created" : "Updated"}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={onMovePrevious}
                disabled={!canMovePrevious}
                aria-label="Previous note"
                className={`${controlClassName} disabled:cursor-not-allowed disabled:opacity-45`}
                style={{
                  borderColor: shellStyles.chipBorder,
                  background: shellStyles.chipBg,
                  color: shellStyles.text,
                }}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={onMoveNext}
                disabled={!canMoveNext}
                aria-label="Next note"
                className={`${controlClassName} disabled:cursor-not-allowed disabled:opacity-45`}
                style={{
                  borderColor: shellStyles.chipBorder,
                  background: shellStyles.chipBg,
                  color: shellStyles.text,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
