"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { WallTimelineCard } from "@/components/wall/WallTimelineCard";
import { WallTimelineDetailPanel } from "@/components/wall/WallTimelineDetailPanel";
import { WallTimelineHeader } from "@/components/wall/WallTimelineHeader";
import { WallTimelineScrubber } from "@/components/wall/WallTimelineScrubber";
import {
  buildWallTimelineLayout,
  type WallTimelineCardSize,
  type WallTimelineSort,
  type WallTimelineViewMode,
  type WallTimelineZoom,
} from "@/components/wall/wallTimelineViewLayout";
import {
  findClosestIndexByTimestamp,
  formatBucketLabel,
  formatTimelineDate,
  formatTimelineDateTime,
  getRangePresetStart,
  laneTopOffset,
  type TimelineBucket,
  type TimelineBucketMode,
  type WallTimelineRangePreset,
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

const zoomOrder: WallTimelineZoom[] = ["overview", "standard", "detail"];
const defaultViewportWidth = 1280;

export const WallTimelineView = ({
  notes,
  selectedNoteId,
  activeTimestamp,
  onSelectNote,
  onRevealNote,
  onExit,
}: WallTimelineViewProps) => {
  const [sort, setSort] = useState<WallTimelineSort>("created");
  const [cardSize, setCardSize] = useState<WallTimelineCardSize>("medium");
  const [zoom, setZoom] = useState<WallTimelineZoom>("standard");
  const [groupBy, setGroupBy] = useState<TimelineBucketMode>("week");
  const [viewMode, setViewMode] = useState<WallTimelineViewMode>("stream");
  const [rangePreset, setRangePreset] = useState<WallTimelineRangePreset>("all");
  const [fitAll, setFitAll] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(defaultViewportWidth);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);
  const lastAutoCenteredKeyRef = useRef<string | null>(null);

  const deferredNotes = useDeferredValue(notes);
  const readTimestamp = useCallback((note: Note) => (sort === "updated" ? note.updatedAt : note.createdAt), [sort]);

  useEffect(() => {
    if (!shellRef.current || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setViewportWidth(Math.max(960, Math.round(entry.contentRect.width - 420)));
    });
    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, []);

  const rangedNotes = useMemo(() => {
    if (deferredNotes.length === 0) {
      return deferredNotes;
    }
    const timestamps = deferredNotes.map(readTimestamp);
    const maxTs = Math.max(...timestamps);
    const rangeStart = getRangePresetStart(maxTs, rangePreset);
    return deferredNotes.filter((note) => readTimestamp(note) >= rangeStart);
  }, [deferredNotes, rangePreset, readTimestamp]);

  const layout = useMemo(() => buildWallTimelineLayout(rangedNotes, {
    sort,
    cardSize,
    zoom,
    viewMode,
    groupBy,
    viewportWidth,
    fitAll,
  }), [cardSize, fitAll, groupBy, rangedNotes, sort, viewMode, viewportWidth, zoom]);

  const buckets = useMemo<TimelineBucket[]>(() => layout.buckets.map((bucket) => ({
    key: bucket.key,
    label: formatBucketLabel(bucket.timestamp, groupBy),
    count: bucket.count,
    startX: bucket.startX,
    endX: bucket.endX,
    x: bucket.centerX,
    timestamp: bucket.timestamp,
  })), [groupBy, layout.buckets]);

  const selectedIndex = layout.items.findIndex((item) => item.id === selectedNoteId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : layout.items.length > 0 ? layout.items.length - 1 : -1;
  const selectedItem = activeIndex >= 0 ? layout.items[activeIndex] : undefined;
  const selectedNote = selectedItem?.note;
  const selectedLabel = selectedItem ? formatTimelineDateTime(selectedItem.ts) : "No selection";
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex < layout.items.length - 1;
  const contentHeight = layout.contentHeight;
  const axisY = laneTopOffset - 36;

  const handleSelectNote = useCallback((noteId: string) => {
    setDetailOpen(true);
    onSelectNote(noteId);
  }, [onSelectNote]);

  const scrollToItem = useCallback((itemId: string, behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current;
    const item = layout.items.find((entry) => entry.id === itemId);
    if (!container || !item) {
      return;
    }
    const targetLeft = Math.max(0, item.centerX - container.clientWidth / 2);
    const targetTop = Math.max(0, item.y - 56);
    container.scrollTo({ left: targetLeft, top: targetTop, behavior });
  }, [layout.items]);

  const selectIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const next = layout.items[index];
    if (!next) {
      return;
    }
    handleSelectNote(next.id);
    scrollToItem(next.id, behavior);
  }, [handleSelectNote, layout.items, scrollToItem]);

  const zoomTo = useCallback((nextZoom: WallTimelineZoom) => {
    setFitAll(false);
    setZoom(nextZoom);
  }, []);

  const cycleZoom = useCallback((direction: -1 | 1) => {
    setFitAll(false);
    setZoom((current) => zoomOrder[Math.min(zoomOrder.length - 1, Math.max(0, zoomOrder.indexOf(current) + direction))] ?? current);
  }, []);

  const jumpToNearestTimestamp = useCallback((target: number) => {
    const index = findClosestIndexByTimestamp(layout.items.map((item) => item.ts), target);
    if (index >= 0) {
      selectIndex(index);
    }
  }, [layout.items, selectIndex]);

  const jumpToBucket = useCallback((direction: -1 | 1) => {
    if (!selectedItem || buckets.length === 0) {
      return;
    }
    const currentBucketIndex = buckets.findIndex((bucket) => bucket.key === selectedItem.bucketKey);
    const nextBucket = buckets[Math.min(buckets.length - 1, Math.max(0, currentBucketIndex + direction))];
    if (!nextBucket) {
      return;
    }
    const nextItemIndex = layout.items.findIndex((item) => item.bucketKey === nextBucket.key);
    if (nextItemIndex >= 0) {
      selectIndex(nextItemIndex);
    }
  }, [buckets, layout.items, selectIndex, selectedItem]);

  const fitAllView = useCallback(() => {
    setRangePreset("all");
    setViewMode("stream");
    setZoom("overview");
    setFitAll(true);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        cycleZoom(event.deltaY > 0 ? -1 : 1);
        return;
      }

      if (event.shiftKey) {
        event.preventDefault();
        container.scrollLeft += event.deltaY + event.deltaX;
        return;
      }

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const canScrollVertically = maxScrollTop > 0 && ((event.deltaY < 0 && container.scrollTop > 0) || (event.deltaY > 0 && container.scrollTop < maxScrollTop));
      if (!canScrollVertically && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        container.scrollLeft += event.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [cycleZoom]);

  useEffect(() => {
    if (!selectedNoteId) {
      lastAutoCenteredKeyRef.current = null;
      return;
    }
    const autoCenterKey = `${selectedNoteId}:${sort}:${cardSize}:${zoom}:${groupBy}:${viewMode}:${rangePreset}`;
    if (lastAutoCenteredKeyRef.current === autoCenterKey) {
      return;
    }
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      lastAutoCenteredKeyRef.current = autoCenterKey;
    }
  }, [cardSize, groupBy, rangePreset, selectedNoteId, sort, viewMode, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "0") {
        event.preventDefault();
        fitAllView();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        cycleZoom(1);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "-") {
        event.preventDefault();
        cycleZoom(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        selectIndex(Math.min(activeIndex + 1, layout.items.length - 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectIndex(Math.max(activeIndex - 1, 0));
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        jumpToBucket(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        jumpToBucket(-1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        selectIndex(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        selectIndex(layout.items.length - 1);
        return;
      }
      if (event.key === "[") {
        event.preventDefault();
        cycleZoom(-1);
        return;
      }
      if (event.key === "]") {
        event.preventDefault();
        cycleZoom(1);
        return;
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setViewMode((current) => current === "stream" ? "buckets" : "stream");
        setFitAll(false);
        return;
      }
      if (event.key === "Enter" && selectedItem) {
        event.preventDefault();
        onRevealNote(selectedItem.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, cycleZoom, fitAllView, jumpToBucket, layout.items.length, onRevealNote, selectIndex, selectedItem]);

  const rangeMarkers = layout.items.length === 0
    ? []
    : Array.from({ length: 6 }, (_, index) => {
        const ratio = index / 5;
        const ts = layout.minTs + (layout.maxTs - layout.minTs) * ratio;
        const left = ratio * layout.contentWidth;
        return { id: `marker-${index}`, left, label: formatTimelineDate(ts) };
      });

  if (layout.items.length === 0) {
    return (
      <div className="wall-timeline-shell absolute inset-0 z-20 flex flex-col overflow-hidden">
        <WallTimelineHeader
          itemCount={0}
          sort={sort}
          cardSize={cardSize}
          zoom={zoom}
          groupBy={groupBy}
          viewMode={viewMode}
          rangePreset={rangePreset}
          minTs={layout.minTs}
          maxTs={layout.maxTs}
          selectedLabel="No selection"
          canGoPrev={false}
          canGoNext={false}
          onSortChange={(value) => { setFitAll(false); setSort(value); }}
          onCardSizeChange={(value) => setCardSize(value)}
          onZoomChange={zoomTo}
          onGroupByChange={(value) => { setFitAll(false); setGroupBy(value); }}
          onViewModeChange={(value) => { setFitAll(false); setViewMode(value); }}
          onRangePresetChange={(value) => { setFitAll(false); setRangePreset(value); }}
          onPrev={() => undefined}
          onNext={() => undefined}
          onJumpEarliest={() => undefined}
          onJumpToday={() => undefined}
          onJumpLatest={() => undefined}
          onJumpSelected={() => undefined}
          onFitAll={fitAllView}
          onRevealSelected={() => undefined}
          onExit={onExit}
        />
        <div className="flex-1 content-center px-6 text-center">
          <div className="mx-auto max-w-lg rounded-[32px] border border-dashed border-[var(--timeline-panel-border)] bg-[var(--timeline-panel)]/70 px-8 py-12">
            <p className="text-lg font-semibold text-[var(--timeline-text)]">No notes in this timeline range</p>
            <p className="mt-3 text-sm text-[var(--timeline-text-muted)]">Try switching to `All`, using `Fit All`, or relaxing your search and filters. The timeline only shows notes that survive the current wall filters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="wall-timeline-shell absolute inset-0 z-20 flex flex-col overflow-hidden">
      <WallTimelineHeader
        itemCount={layout.items.length}
        sort={sort}
        cardSize={cardSize}
        zoom={zoom}
        groupBy={groupBy}
        viewMode={viewMode}
        rangePreset={rangePreset}
        minTs={layout.minTs}
        maxTs={layout.maxTs}
        selectedLabel={selectedLabel}
        selectedNote={selectedNote}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onSortChange={(value) => { setFitAll(false); setSort(value); }}
        onCardSizeChange={(value) => setCardSize(value)}
        onZoomChange={zoomTo}
        onGroupByChange={(value) => { setFitAll(false); setGroupBy(value); }}
        onViewModeChange={(value) => { setFitAll(false); setViewMode(value); }}
        onRangePresetChange={(value) => { setFitAll(false); setRangePreset(value); }}
        onPrev={() => selectIndex(Math.max(activeIndex - 1, 0))}
        onNext={() => selectIndex(Math.min(activeIndex + 1, layout.items.length - 1))}
        onJumpEarliest={() => selectIndex(0)}
        onJumpToday={() => jumpToNearestTimestamp(Date.now())}
        onJumpLatest={() => selectIndex(layout.items.length - 1)}
        onJumpSelected={() => selectedItem && scrollToItem(selectedItem.id)}
        onFitAll={fitAllView}
        onRevealSelected={() => selectedItem && onRevealNote(selectedItem.id)}
        onExit={onExit}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={scrollRef} className="wall-timeline-scrollbar relative z-10 flex-1 overflow-auto px-4 pb-28 pt-6">
          <div className="relative" style={{ width: `${layout.contentWidth}px`, minHeight: `${contentHeight}px` }}>
            <div className="absolute left-0 right-0 rounded-full bg-[var(--timeline-line-strong)]" style={{ top: `${axisY}px`, height: "2px" }} />

            {rangeMarkers.map((marker) => (
              <div key={marker.id} className="absolute top-0 -translate-x-1/2" style={{ left: `${marker.left}px` }}>
                <div className="h-14 w-px bg-[var(--timeline-line)]" />
                <span className="mt-2 inline-flex rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--timeline-text-muted)]">
                  {marker.label}
                </span>
              </div>
            ))}

            {buckets.map((bucket) => (
              <div key={bucket.key} className="absolute inset-y-0" style={{ left: `${bucket.startX}px`, width: `${Math.max(120, bucket.endX - bucket.startX)}px` }}>
                <div className={`absolute inset-y-[72px] rounded-[28px] ${viewMode === "buckets" ? "bg-[var(--timeline-bucket-fill)]" : "bg-transparent"}`} />
                <div className="absolute top-16 left-3 right-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${viewMode === "buckets" ? "border-[var(--timeline-bucket-border)] bg-[var(--timeline-panel)] text-[var(--timeline-text)]" : "border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] text-[var(--timeline-text-muted)]"}`}>
                    {bucket.label}
                  </span>
                  <span className="rounded-full bg-[var(--timeline-chip-bg)] px-2 py-1 text-[10px] font-semibold text-[var(--timeline-text-muted)]">{bucket.count}</span>
                </div>
              </div>
            ))}

            {layout.items.map((item) => (
              <WallTimelineCard
                key={item.id}
                item={item}
                cardSize={cardSize}
                selectedNoteId={selectedNoteId}
                activeTimestamp={activeTimestamp}
                selectedCardRef={selectedCardRef}
                onSelectNote={handleSelectNote}
                onRevealNote={onRevealNote}
              />
            ))}
          </div>
        </div>

        {detailOpen && <WallTimelineDetailPanel note={selectedNote} timestamp={selectedItem?.ts} onReveal={() => selectedItem && onRevealNote(selectedItem.id)} onClose={() => setDetailOpen(false)} />}
      </div>

      <WallTimelineScrubber layout={layout} selectedNoteId={selectedNoteId} onSelectNote={handleSelectNote} />
    </div>
  );
};





