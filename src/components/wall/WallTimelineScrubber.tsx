"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { WallTimelineLayout } from "@/components/wall/wallTimelineViewLayout";
import { clampPercent, formatTimelineDate, formatTimelineDateTime, scrubberInset } from "@/components/wall/wallTimelineViewHelpers";

type WallTimelineScrubberProps = {
  layout: WallTimelineLayout;
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
};

const binCount = 48;

export const WallTimelineScrubber = ({ layout, selectedNoteId, onSelectNote }: WallTimelineScrubberProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const bins = useMemo(() => {
    const next = Array.from({ length: binCount }, () => 0);
    const range = Math.max(1, layout.contentWidth);
    for (const item of layout.items) {
      const ratio = Math.min(0.999, Math.max(0, item.centerX / range));
      const index = Math.floor(ratio * binCount);
      next[index] = (next[index] ?? 0) + 1;
    }
    const max = Math.max(1, ...next);
    return next.map((count, index) => ({
      id: `bin-${index}`,
      height: Math.max(8, Math.round((count / max) * 42)),
      count,
      left: `${(index / binCount) * 100}%`,
      width: `${100 / binCount}%`,
    }));
  }, [layout.contentWidth, layout.items]);

  const selectedItem = layout.items.find((item) => item.id === selectedNoteId);
  const selectedLeft = selectedItem ? clampPercent((selectedItem.centerX / Math.max(1, layout.contentWidth)) * 100) : 0;

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const stopDragging = () => setDragging(false);
    window.addEventListener("pointerup", stopDragging);
    return () => window.removeEventListener("pointerup", stopDragging);
  }, [dragging]);

  const jumpToClientX = (clientX: number) => {
    if (!trackRef.current || layout.items.length === 0) {
      return;
    }
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = clampPercent(((clientX - rect.left) / Math.max(1, rect.width)) * 100) / 100;
    const targetX = ratio * layout.contentWidth;
    let nearest = layout.items[0]!;
    let smallestDelta = Math.abs(nearest.centerX - targetX);
    for (const item of layout.items) {
      const delta = Math.abs(item.centerX - targetX);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        nearest = item;
      }
    }
    onSelectNote(nearest.id);
  };

  if (layout.items.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 rounded-[28px] border border-[var(--timeline-panel-border)] bg-[var(--timeline-panel)]/94 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--timeline-text-muted)]">
        <span>{formatTimelineDate(layout.minTs)}</span>
        <span>Density scrubber</span>
        <span>{formatTimelineDate(layout.maxTs)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative mt-3 h-16 cursor-pointer overflow-hidden rounded-[20px] border border-[var(--timeline-panel-border)] bg-[var(--timeline-scrubber-bg)]"
        onPointerDown={(event) => {
          setDragging(true);
          jumpToClientX(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging) {
            jumpToClientX(event.clientX);
          }
        }}
      >
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-[var(--timeline-line)]" />
        {bins.map((bin) => (
          <div key={bin.id} className="absolute bottom-1 top-1 px-[1px]" style={{ left: bin.left, width: bin.width }}>
            <div className="absolute bottom-0 w-full rounded-full bg-[var(--timeline-density-bar)]" style={{ height: `${bin.height}px`, opacity: bin.count > 0 ? 1 : 0.24 }} />
          </div>
        ))}
        {layout.items.map((item) => {
          const left = scrubberInset + (item.centerX / Math.max(1, layout.contentWidth)) * (100 - scrubberInset * 2);
          const isSelected = item.id === selectedNoteId;
          return (
            <button
              key={`scrubber-${item.id}`}
              type="button"
              onClick={() => onSelectNote(item.id)}
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform hover:scale-110 ${
                isSelected
                  ? "border-[var(--timeline-selection)] bg-[var(--timeline-selection)]"
                  : "border-[var(--timeline-line-strong)] bg-[var(--timeline-panel)]"
              }`}
              style={{ left: `${Math.max(scrubberInset, Math.min(100 - scrubberInset, left))}%` }}
              aria-label={`Jump to ${formatTimelineDateTime(item.ts)}`}
            />
          );
        })}
        {selectedItem && (
          <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--timeline-selection)]" style={{ left: `${selectedLeft}%` }} />
        )}
      </div>
      {selectedItem && <p className="mt-2 text-[11px] text-[var(--timeline-text-muted)]">Selected: {formatTimelineDateTime(selectedItem.ts)}</p>}
    </div>
  );
};
