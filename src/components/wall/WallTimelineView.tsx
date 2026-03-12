"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WallTimelineCard } from "@/components/wall/WallTimelineCard";
import { WallTimelineHeader } from "@/components/wall/WallTimelineHeader";
import { WallTimelineScrubber } from "@/components/wall/WallTimelineScrubber";
import {
  buildWallTimelineLayout,
  type WallTimelineDensity,
  type WallTimelineMetric,
  type WallTimelineZoom,
} from "@/components/wall/wallTimelineViewLayout";
import {
  cardHeightByDensity,
  formatBucketLabel,
  formatTimelineDate,
  formatTimelineDateTime,
  laneTopOffset,
  makeBucketKey,
  scrubberInset,
  type TimelineBucket,
  type TimelineBucketMode,
} from "@/components/wall/wallTimelineViewHelpers";
import type { Note } from "@/features/wall/types";

type WallTimelineViewProps = {
  notes: Note[];
  selectedNoteId?: string;
  activeTimestamp?: number;
  onSelectNote: (noteId: string) => void;
  onRevealNote: (noteId: string) => void;
  onExit: () => void;
};

const zoomOrder: WallTimelineZoom[] = ["far", "balanced", "close"];

export const WallTimelineView = ({
  notes,
  selectedNoteId,
  activeTimestamp,
  onSelectNote,
  onRevealNote,
  onExit,
}: WallTimelineViewProps) => {
  const [metric, setMetric] = useState<WallTimelineMetric>("created");
  const [density, setDensity] = useState<WallTimelineDensity>("comfortable");
  const [zoom, setZoom] = useState<WallTimelineZoom>("balanced");
  const [bucketMode, setBucketMode] = useState<TimelineBucketMode>("week");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);
  const lastAutoCenteredKeyRef = useRef<string | null>(null);
  const layout = useMemo(() => buildWallTimelineLayout(notes, metric, density, zoom), [density, metric, notes, zoom]);

  const selectedIndex = layout.items.findIndex((item) => item.id === selectedNoteId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : layout.items.length > 0 ? layout.items.length - 1 : -1;
  const selectedItem = activeIndex >= 0 ? layout.items[activeIndex] : undefined;
  const selectedNote = selectedItem?.note;
  const cardHeight = cardHeightByDensity[density];

  const buckets = useMemo<TimelineBucket[]>(() => {
    const map = new Map<string, TimelineBucket>();
    for (const item of layout.items) {
      const key = makeBucketKey(item.ts, bucketMode);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.x = Math.min(existing.x, item.x);
      } else {
        map.set(key, {
          key,
          label: formatBucketLabel(item.ts, bucketMode),
          count: 1,
          x: item.x,
        });
      }
    }
    return [...map.values()].sort((left, right) => left.x - right.x);
  }, [bucketMode, layout.items]);

  const jumpToIndex = useCallback((index: number) => {
    const next = layout.items[index];
    if (!next) {
      return;
    }
    onSelectNote(next.id);
  }, [layout.items, onSelectNote]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const canScrollVertically = maxScrollTop > 0 && (
        (event.deltaY < 0 && container.scrollTop > 0) ||
        (event.deltaY > 0 && container.scrollTop < maxScrollTop)
      );

      if (!event.shiftKey && canScrollVertically) {
        return;
      }

      event.preventDefault();
      container.scrollLeft += event.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!selectedNoteId) {
      lastAutoCenteredKeyRef.current = null;
      if (activeIndex >= 0) {
        jumpToIndex(activeIndex);
      }
      return;
    }

    const autoCenterKey = `${selectedNoteId}:${metric}:${density}:${zoom}:${bucketMode}`;
    if (lastAutoCenteredKeyRef.current === autoCenterKey) {
      return;
    }

    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
      lastAutoCenteredKeyRef.current = autoCenterKey;
    }
  }, [activeIndex, bucketMode, density, jumpToIndex, metric, selectedNoteId, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        jumpToIndex(Math.min(activeIndex + 1, layout.items.length - 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        jumpToIndex(Math.max(activeIndex - 1, 0));
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        jumpToIndex(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        jumpToIndex(layout.items.length - 1);
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setDensity((current) => (current === "expanded" ? "comfortable" : current === "comfortable" ? "compact" : "compact"));
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setDensity((current) => (current === "compact" ? "comfortable" : current === "comfortable" ? "expanded" : "expanded"));
        return;
      }
      if (event.key === "[") {
        event.preventDefault();
        setZoom((current) => zoomOrder[Math.max(0, zoomOrder.indexOf(current) - 1)] ?? "far");
        return;
      }
      if (event.key === "]") {
        event.preventDefault();
        setZoom((current) => zoomOrder[Math.min(zoomOrder.length - 1, zoomOrder.indexOf(current) + 1)] ?? "close");
        return;
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setBucketMode((current) => (current === "day" ? "week" : current === "week" ? "month" : "day"));
        return;
      }
      if (event.key === "Enter" && selectedItem) {
        event.preventDefault();
        onRevealNote(selectedItem.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, jumpToIndex, layout.items.length, onRevealNote, selectedItem]);

  const contentHeight = laneTopOffset + layout.laneCount * layout.laneGap + 84;
  const axisY = laneTopOffset - 28;
  const selectedLabel = selectedItem ? formatTimelineDateTime(selectedItem.ts) : "No selection";
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < layout.items.length - 1;
  const markerCount = Math.min(5, Math.max(2, layout.items.length));
  const rangeMarkers = layout.items.length === 0
    ? []
    : Array.from({ length: markerCount }, (_, index) => {
        const ratio = markerCount === 1 ? 0 : index / (markerCount - 1);
        const ts = layout.minTs + (layout.maxTs - layout.minTs) * ratio;
        return {
          id: `marker-${index}`,
          left: `${scrubberInset + ratio * (100 - scrubberInset * 2)}%`,
          label: formatTimelineDate(ts),
        };
      });

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,214,88,0.16),_transparent_28%),linear-gradient(180deg,rgba(248,244,232,0.92),rgba(241,236,226,0.98))]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(112,94,66,0.08)_1px,transparent_1px)] bg-[size:96px_100%] opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,252,247,0.95),rgba(255,252,247,0))]" />

      <WallTimelineHeader
        itemCount={layout.items.length}
        metric={metric}
        density={density}
        zoom={zoom}
        bucketMode={bucketMode}
        minTs={layout.minTs}
        maxTs={layout.maxTs}
        selectedLabel={selectedLabel}
        selectedNote={selectedNote}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onMetricChange={setMetric}
        onDensityChange={setDensity}
        onZoomChange={setZoom}
        onBucketModeChange={setBucketMode}
        onPrev={() => jumpToIndex(Math.max(activeIndex - 1, 0))}
        onNext={() => jumpToIndex(Math.min(activeIndex + 1, layout.items.length - 1))}
        onRevealSelected={() => {
          if (selectedNote) {
            onRevealNote(selectedNote.id);
          }
        }}
        onExit={onExit}
      />

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-x-auto overflow-y-auto px-4 pb-28 pt-6">
        <div
          className="relative"
          style={{
            width: `${layout.contentWidth}px`,
            minHeight: `${contentHeight}px`,
          }}
        >
          <div
            className="absolute left-0 right-0 rounded-full bg-[linear-gradient(90deg,rgba(92,73,43,0.35),rgba(152,123,71,0.18),rgba(92,73,43,0.35))]"
            style={{ top: `${axisY}px`, height: "2px" }}
          />

          {rangeMarkers.map((marker) => (
            <div key={marker.id} className="absolute top-0 -translate-x-1/2" style={{ left: marker.left }}>
              <div className="h-16 w-px bg-[rgba(92,73,43,0.2)]" />
              <span className="mt-2 inline-flex rounded-full border border-[rgba(114,91,58,0.16)] bg-[rgba(255,252,246,0.94)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(90,69,41,0.78)] shadow-[0_10px_18px_rgba(99,79,46,0.09)]">
                {marker.label}
              </span>
            </div>
          ))}

          {buckets.map((bucket) => (
            <div key={bucket.key} className="absolute top-14 -translate-x-1/2" style={{ left: `${bucket.x + layout.cardWidth / 2}px` }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.16)] bg-[rgba(255,252,246,0.94)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(90,69,41,0.82)] shadow-[0_10px_18px_rgba(99,79,46,0.09)]">
                <span>{bucket.label}</span>
                <span className="rounded-full bg-[rgba(77,57,31,0.08)] px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-[rgba(77,57,31,0.7)]">{bucket.count}</span>
              </div>
            </div>
          ))}

          {layout.items.map((item) => (
            <WallTimelineCard
              key={item.id}
              item={item}
              density={density}
              cardHeight={cardHeight}
              cardWidth={layout.cardWidth}
              laneGap={layout.laneGap}
              laneTopOffset={laneTopOffset}
              selectedNoteId={selectedNoteId}
              activeTimestamp={activeTimestamp}
              selectedCardRef={selectedCardRef}
              onSelectNote={onSelectNote}
              onRevealNote={onRevealNote}
            />
          ))}
        </div>
      </div>

      <WallTimelineScrubber
        layout={layout}
        metric={metric}
        densityLabel={density}
        bucketMode={bucketMode}
        selectedNoteId={selectedNoteId}
        onSelectNote={onSelectNote}
      />
    </div>
  );
};
