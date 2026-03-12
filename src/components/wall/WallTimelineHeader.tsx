"use client";

import { Icon } from "@/components/wall/WallControls";
import type { WallTimelineDensity, WallTimelineMetric } from "@/components/wall/wallTimelineViewLayout";
import type { Note } from "@/features/wall/types";

import { formatSpan, type TimelineBucketMode } from "@/components/wall/wallTimelineViewHelpers";

type WallTimelineHeaderProps = {
  itemCount: number;
  metric: WallTimelineMetric;
  density: WallTimelineDensity;
  bucketMode: TimelineBucketMode;
  minTs: number;
  maxTs: number;
  selectedLabel: string;
  selectedNote?: Note;
  canGoPrev: boolean;
  canGoNext: boolean;
  onMetricChange: (metric: WallTimelineMetric) => void;
  onDensityChange: (density: WallTimelineDensity) => void;
  onBucketModeChange: (mode: TimelineBucketMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onRevealSelected: () => void;
  onExit: () => void;
};

export const WallTimelineHeader = ({
  itemCount,
  metric,
  density,
  bucketMode,
  minTs,
  maxTs,
  selectedLabel,
  selectedNote,
  canGoPrev,
  canGoNext,
  onMetricChange,
  onDensityChange,
  onBucketModeChange,
  onPrev,
  onNext,
  onRevealSelected,
  onExit,
}: WallTimelineHeaderProps) => (
  <div className="pointer-events-auto relative z-10 border-b border-[rgba(114,91,58,0.18)] px-4 py-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div>
          <p className="font-['Georgia'] text-sm uppercase tracking-[0.24em] text-[rgba(91,68,39,0.7)]">Timeline View</p>
          <p className="text-sm text-[rgba(78,62,43,0.82)]">
            {itemCount === 0
              ? "No notes available for the timeline."
              : `${itemCount} notes arranged by ${metric} time at ${density} density, grouped by ${bucketMode}. Scroll sideways or use arrow keys to browse.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-[rgba(73,56,35,0.78)]">
          <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">{formatSpan(minTs, maxTs)}</span>
          <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">Selected: {selectedLabel}</span>
          <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">Density: {density}</span>
          <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">Buckets: {bucketMode}</span>
          {selectedNote && (
            <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">
              {selectedNote.tags.length > 0 ? `#${selectedNote.tags[0]}` : "Untagged"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.78)] p-1 shadow-[0_10px_24px_rgba(98,78,45,0.08)]">
            {(["created", "updated"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onMetricChange(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === value
                    ? "bg-[rgba(77,57,31,0.92)] text-[rgba(255,248,235,0.96)]"
                    : "text-[rgba(73,56,35,0.78)] hover:bg-white"
                }`}
              >
                {value === "created" ? "Created" : "Updated"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.78)] p-1 shadow-[0_10px_24px_rgba(98,78,45,0.08)]">
            {(["compact", "comfortable", "expanded"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDensityChange(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  density === value
                    ? "bg-[rgba(77,57,31,0.92)] text-[rgba(255,248,235,0.96)]"
                    : "text-[rgba(73,56,35,0.78)] hover:bg-white"
                }`}
                title={value === "compact" ? "Compact density (-)" : value === "expanded" ? "Expanded density (+)" : "Comfortable density"}
              >
                {value === "compact" ? "Compact" : value === "expanded" ? "Expanded" : "Comfortable"}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.78)] p-1 shadow-[0_10px_24px_rgba(98,78,45,0.08)]">
            {(["day", "week", "month"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onBucketModeChange(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  bucketMode === value
                    ? "bg-[rgba(77,57,31,0.92)] text-[rgba(255,248,235,0.96)]"
                    : "text-[rgba(73,56,35,0.78)] hover:bg-white"
                }`}
                title={value === "day" ? "Day buckets" : value === "week" ? "Week buckets (B)" : "Month buckets"}
              >
                {value === "day" ? "Day" : value === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(255,251,243,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(73,56,35,0.88)] shadow-[0_10px_30px_rgba(98,78,45,0.12)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(255,251,243,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(73,56,35,0.88)] shadow-[0_10px_30px_rgba(98,78,45,0.12)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
          {selectedNote && (
            <button
              type="button"
              onClick={onRevealSelected}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(255,251,243,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(73,56,35,0.88)] shadow-[0_10px_30px_rgba(98,78,45,0.12)] transition-colors hover:bg-white"
            >
              <Icon name="search" className="h-3.5 w-3.5" />
              <span>Reveal on wall</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(77,57,31,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(255,248,235,0.96)] shadow-[0_10px_30px_rgba(98,78,45,0.14)] transition-colors hover:bg-[rgba(65,48,27,0.96)]"
          >
            <span>Back to wall</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);
