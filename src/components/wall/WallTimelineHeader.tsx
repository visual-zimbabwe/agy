"use client";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import type { TimelineBucketMode, WallTimelineRangePreset } from "@/components/wall/wallTimelineViewHelpers";
import type { Note } from "@/features/wall/types";

import { formatSpan } from "@/components/wall/wallTimelineViewHelpers";
import type { WallTimelineCardSize, WallTimelineSort, WallTimelineViewMode, WallTimelineZoom } from "@/components/wall/wallTimelineViewLayout";

type WallTimelineHeaderProps = {
  itemCount: number;
  sort: WallTimelineSort;
  cardSize: WallTimelineCardSize;
  zoom: WallTimelineZoom;
  groupBy: TimelineBucketMode;
  viewMode: WallTimelineViewMode;
  rangePreset: WallTimelineRangePreset;
  minTs: number;
  maxTs: number;
  selectedLabel: string;
  selectedNote?: Note;
  canGoPrev: boolean;
  canGoNext: boolean;
  onSortChange: (value: WallTimelineSort) => void;
  onCardSizeChange: (value: WallTimelineCardSize) => void;
  onZoomChange: (value: WallTimelineZoom) => void;
  onGroupByChange: (value: TimelineBucketMode) => void;
  onViewModeChange: (value: WallTimelineViewMode) => void;
  onRangePresetChange: (value: WallTimelineRangePreset) => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpEarliest: () => void;
  onJumpToday: () => void;
  onJumpLatest: () => void;
  onJumpSelected: () => void;
  onFitAll: () => void;
  onRevealSelected: () => void;
  onExit: () => void;
};

type SegmentedProps<T extends string> = {
  label: string;
  hint: string;
  value: T;
  options: Array<{ value: T; label: string; tooltip?: string }>;
  onChange: (value: T) => void;
};

const SegmentedField = <T extends string,>({ label, hint, value, options, onChange }: SegmentedProps<T>) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--timeline-text-muted)]">{label}</span>
      <span className="text-[11px] text-[var(--timeline-text-soft)]">{hint}</span>
    </div>
    <div className="inline-flex rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] p-1">
      {options.map((option) => (
        <ControlTooltip key={option.value} label={option.tooltip ?? option.label} className="relative inline-flex">
          <button
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-[var(--timeline-chip-active)] text-[var(--timeline-chip-active-text)]"
                : "text-[var(--timeline-text)] hover:bg-[var(--timeline-chip-hover)]"
            }`}
          >
            {option.label}
          </button>
        </ControlTooltip>
      ))}
    </div>
  </div>
);

const actionClass = "inline-flex items-center gap-2 rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-panel)] px-3 py-2 text-xs font-medium text-[var(--timeline-text)] transition-colors hover:bg-[var(--timeline-chip-hover)] disabled:cursor-not-allowed disabled:opacity-45";

export const WallTimelineHeader = ({
  itemCount,
  sort,
  cardSize,
  zoom,
  groupBy,
  viewMode,
  rangePreset,
  minTs,
  maxTs,
  selectedLabel,
  selectedNote,
  canGoPrev,
  canGoNext,
  onSortChange,
  onCardSizeChange,
  onZoomChange,
  onGroupByChange,
  onViewModeChange,
  onRangePresetChange,
  onPrev,
  onNext,
  onJumpEarliest,
  onJumpToday,
  onJumpLatest,
  onJumpSelected,
  onFitAll,
  onRevealSelected,
  onExit,
}: WallTimelineHeaderProps) => (
  <div className="pointer-events-auto relative z-20 border-b border-[var(--timeline-panel-border)] bg-[var(--timeline-panel)]/92 px-4 py-4 backdrop-blur-xl">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--timeline-text-muted)]">Timeline View</p>
            <p className="mt-1 max-w-3xl text-sm text-[var(--timeline-text)]">
              {itemCount === 0
                ? "No notes match the current filters. Adjust range, grouping, or search to repopulate the timeline."
                : `Browse ${itemCount} notes across ${formatSpan(minTs, maxTs)}. Stream keeps time continuous. Buckets groups notes into clearer day, week, or month sections.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-[var(--timeline-text-muted)]">
            <span className="rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] px-3 py-1.5">Range: {rangePreset.toUpperCase()}</span>
            <span className="rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] px-3 py-1.5">Selected: {selectedLabel}</span>
            {selectedNote && <span className="rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] px-3 py-1.5">{selectedNote.tags.length > 0 ? `#${selectedNote.tags[0]}` : "Untagged"}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <ControlTooltip label="Previous note" shortcut="Left Arrow" className="relative inline-flex">
            <button type="button" onClick={onPrev} disabled={!canGoPrev} className={actionClass}>Prev</button>
          </ControlTooltip>
          <ControlTooltip label="Next note" shortcut="Right Arrow" className="relative inline-flex">
            <button type="button" onClick={onNext} disabled={!canGoNext} className={actionClass}>Next</button>
          </ControlTooltip>
          <ControlTooltip label="Reveal the selected note on the spatial wall" className="relative inline-flex">
            <button type="button" onClick={onRevealSelected} disabled={!selectedNote} className={actionClass}>
              <Icon name="search" className="h-3.5 w-3.5" />
              <span>Reveal on Wall</span>
            </button>
          </ControlTooltip>
          <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-full border border-[var(--timeline-selection)] bg-[var(--timeline-selection)] px-3 py-2 text-xs font-medium text-[var(--timeline-selection-text)] transition-opacity hover:opacity-90">
            Back to Wall
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
          <SegmentedField
            label="Sort"
            hint="Choose the timeline date source"
            value={sort}
            onChange={onSortChange}
            options={[
              { value: "created", label: "Created Date", tooltip: "Order by when each note was created" },
              { value: "updated", label: "Last Edited", tooltip: "Order by the most recent edit time" },
            ]}
          />
          <SegmentedField
            label="Card Size"
            hint="Controls preview amount"
            value={cardSize}
            onChange={onCardSizeChange}
            options={[
              { value: "small", label: "Small", tooltip: "Smaller cards for scanning more notes" },
              { value: "medium", label: "Medium", tooltip: "Balanced preview and density" },
              { value: "large", label: "Large", tooltip: "Larger cards with richer previews" },
            ]}
          />
          <SegmentedField
            label="Zoom"
            hint="Controls time spread"
            value={zoom}
            onChange={onZoomChange}
            options={[
              { value: "overview", label: "Overview", tooltip: "See more time at once" },
              { value: "standard", label: "Standard", tooltip: "Balanced browsing" },
              { value: "detail", label: "Detail", tooltip: "Inspect a smaller range with more spacing" },
            ]}
          />
          <SegmentedField
            label="Group By"
            hint="Defines section buckets"
            value={groupBy}
            onChange={onGroupByChange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
          <SegmentedField
            label="View Mode"
            hint="Continuous or sectioned"
            value={viewMode}
            onChange={onViewModeChange}
            options={[
              { value: "stream", label: "Stream", tooltip: "Continuous time flow" },
              { value: "buckets", label: "Buckets", tooltip: "Grouped day, week, or month sections" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2 xl:items-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--timeline-text-muted)]">Range</span>
            <span className="text-[11px] text-[var(--timeline-text-soft)]">Quick time windows</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ["7d", "7D"],
              ["30d", "30D"],
              ["90d", "90D"],
              ["1y", "1Y"],
              ["all", "All"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onRangePresetChange(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  rangePreset === value
                    ? "border-[var(--timeline-selection)] bg-[var(--timeline-selection)] text-[var(--timeline-selection-text)]"
                    : "border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] text-[var(--timeline-text)] hover:bg-[var(--timeline-chip-hover)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onJumpEarliest} className={actionClass}>Earliest</button>
            <button type="button" onClick={onJumpToday} className={actionClass}>Today</button>
            <button type="button" onClick={onJumpLatest} className={actionClass}>Latest</button>
            <button type="button" onClick={onJumpSelected} disabled={!selectedNote} className={actionClass}>Selected</button>
            <button type="button" onClick={onFitAll} className={actionClass}>Fit All</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
