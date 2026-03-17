"use client";

import type { WallTimelineLayout, WallTimelineMetric } from "@/components/wall/wallTimelineViewLayout";
import type { TimelineBucketMode } from "@/components/wall/wallTimelineViewHelpers";
import { formatTimelineDate, formatTimelineDateTime, scrubberInset } from "@/components/wall/wallTimelineViewHelpers";

type WallTimelineScrubberProps = {
  layout: WallTimelineLayout;
  metric: WallTimelineMetric;
  densityLabel: string;
  bucketMode: TimelineBucketMode;
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
};

export const WallTimelineScrubber = ({
  layout,
  metric,
  densityLabel,
  bucketMode,
  selectedNoteId,
  onSelectNote,
}: WallTimelineScrubberProps) => {
  if (layout.items.length === 0) {
    return null;
  }

  const scrubberRange = Math.max(1, layout.contentWidth);

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 rounded-[28px] border border-[rgba(114,91,58,0.18)] bg-[rgba(255,251,243,0.92)] p-4 shadow-[0_20px_40px_rgba(98,78,45,0.14)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 text-[11px] text-[rgba(73,56,35,0.74)]">
        <span>{formatTimelineDate(layout.minTs)}</span>
        <span>Scrub through {metric} history at {densityLabel} density with {bucketMode} buckets</span>
        <span>{formatTimelineDate(layout.maxTs)}</span>
      </div>
      <div className="relative mt-3 h-10 rounded-full bg-[linear-gradient(90deg,rgba(128,99,56,0.12),rgba(128,99,56,0.04))]">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-[rgba(92,73,43,0.26)]" />
        {layout.items.map((item) => {
          const left = scrubberInset + (item.centerX / scrubberRange) * (100 - scrubberInset * 2);
          const isSelected = item.id === selectedNoteId;
          return (
            <button
              key={`scrubber-${item.id}`}
              type="button"
              onClick={() => onSelectNote(item.id)}
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform hover:scale-110 ${
                isSelected
                  ? "border-[rgba(77,57,31,0.86)] bg-[rgba(77,57,31,0.92)]"
                  : "border-[rgba(114,91,58,0.3)] bg-[rgba(255,250,243,0.96)]"
              }`}
              style={{ left: `${Math.max(scrubberInset, Math.min(100 - scrubberInset, left))}%` }}
              aria-label={`Jump to ${formatTimelineDateTime(item.ts)}`}
            />
          );
        })}
      </div>
    </div>
  );
};
