"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/wall/WallControls";
import {
  buildWallTimelineLayout,
  type WallTimelineDensity,
  type WallTimelineMetric,
} from "@/components/wall/wallTimelineViewLayout";
import type { Note } from "@/features/wall/types";

type WallTimelineViewProps = {
  notes: Note[];
  selectedNoteId?: string;
  activeTimestamp?: number;
  onSelectNote: (noteId: string) => void;
  onRevealNote: (noteId: string) => void;
  onExit: () => void;
};

const laneTopOffset = 146;
const cardHeightByDensity: Record<WallTimelineDensity, number> = {
  compact: 160,
  comfortable: 178,
  expanded: 204,
};
const scrubberInset = 18;

const formatTimelineDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);

const formatTimelineDateTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

const truncatePreviewText = (text: string, density: WallTimelineDensity) => {
  const limits: Record<WallTimelineDensity, number> = {
    compact: 124,
    comfortable: 180,
    expanded: 240,
  };
  const normalized = text.trim();
  const limit = limits[density];
  if (normalized.length <= limit) {
    return normalized || "(Empty note)";
  }
  return `${normalized.slice(0, Math.max(1, limit - 1)).trimEnd()}...`;
};

const formatSpan = (minTs: number, maxTs: number) => {
  const days = Math.max(0, Math.round((maxTs - minTs) / 86_400_000));
  if (days === 0) {
    return "Single day";
  }
  if (days < 30) {
    return `${days} day span`;
  }
  const months = Math.max(1, Math.round(days / 30));
  return `${months} month span`;
};

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);
  const layout = useMemo(() => buildWallTimelineLayout(notes, metric, density), [density, metric, notes]);

  const selectedIndex = layout.items.findIndex((item) => item.id === selectedNoteId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : layout.items.length > 0 ? layout.items.length - 1 : -1;
  const selectedItem = activeIndex >= 0 ? layout.items[activeIndex] : undefined;
  const selectedNote = selectedItem?.note;
  const cardHeight = cardHeightByDensity[density];

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
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
      return;
    }

    if (activeIndex >= 0 && !selectedNoteId) {
      jumpToIndex(activeIndex);
    }
  }, [activeIndex, jumpToIndex, selectedNoteId]);

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
  const scrubberRange = Math.max(1, layout.contentWidth - layout.cardWidth);
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

      <div className="pointer-events-auto relative z-10 border-b border-[rgba(114,91,58,0.18)] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div>
              <p className="font-['Georgia'] text-sm uppercase tracking-[0.24em] text-[rgba(91,68,39,0.7)]">Timeline View</p>
              <p className="text-sm text-[rgba(78,62,43,0.82)]">
                {layout.items.length === 0
                  ? "No notes available for the timeline."
                  : `${layout.items.length} notes arranged by ${metric} time at ${density} density. Scroll sideways or use arrow keys to browse.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-[rgba(73,56,35,0.78)]">
              <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">{formatSpan(layout.minTs, layout.maxTs)}</span>
              <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">Selected: {selectedLabel}</span>
              <span className="rounded-full border border-[rgba(114,91,58,0.18)] bg-[rgba(255,252,246,0.9)] px-2.5 py-1">Density: {density}</span>
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
                    onClick={() => setMetric(value)}
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
                    onClick={() => setDensity(value)}
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => jumpToIndex(Math.max(activeIndex - 1, 0))}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(255,251,243,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(73,56,35,0.88)] shadow-[0_10px_30px_rgba(98,78,45,0.12)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => jumpToIndex(Math.min(activeIndex + 1, layout.items.length - 1))}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,91,58,0.22)] bg-[rgba(255,251,243,0.92)] px-3 py-1.5 text-xs font-medium text-[rgba(73,56,35,0.88)] shadow-[0_10px_30px_rgba(98,78,45,0.12)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
              {selectedNote && (
                <button
                  type="button"
                  onClick={() => onRevealNote(selectedNote.id)}
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

          {layout.items.map((item, index) => {
            const isSelected = item.id === selectedNoteId;
            const isActiveMoment = typeof activeTimestamp === "number" && Math.abs(item.ts - activeTimestamp) < 60_000;
            const preview = truncatePreviewText(item.note.text, density);
            const cardTop = laneTopOffset + item.lane * layout.laneGap;

            return (
              <article
                key={item.id}
                className="absolute"
                style={{
                  left: `${item.x}px`,
                  top: `${cardTop}px`,
                  width: `${layout.cardWidth}px`,
                }}
              >
                <div className="pointer-events-none absolute left-6 top-[-42px] h-8 w-px bg-[rgba(92,73,43,0.32)]" />
                <span className="absolute left-2 top-[-72px] rounded-full border border-[rgba(114,91,58,0.16)] bg-[rgba(255,252,246,0.95)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(90,69,41,0.78)] shadow-[0_10px_18px_rgba(99,79,46,0.09)]">
                  {formatTimelineDate(item.ts)}
                </span>
                <button
                  ref={isSelected ? selectedCardRef : null}
                  type="button"
                  onClick={() => onSelectNote(item.id)}
                  onDoubleClick={() => onRevealNote(item.id)}
                  className={`group relative flex w-full flex-col rounded-[28px] border p-4 text-left shadow-[0_18px_45px_rgba(82,61,31,0.16)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(82,61,31,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(88,69,43,0.45)] ${
                    isSelected
                      ? "border-[rgba(90,70,41,0.62)] ring-1 ring-[rgba(90,70,41,0.18)]"
                      : "border-[rgba(114,91,58,0.14)]"
                  }`}
                  style={{
                    height: `${cardHeight}px`,
                    minHeight: `${cardHeight}px`,
                    backgroundColor: item.note.color,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(66,51,31,0.62)]">
                        {formatTimelineDateTime(item.ts)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[rgba(44,32,17,0.88)]">
                        {item.note.tags[0] ? `#${item.note.tags[0]}` : item.note.noteKind === "quote" ? "Quote note" : `Wall note ${index + 1}`}
                      </p>
                    </div>
                    {isActiveMoment && (
                      <span className="rounded-full bg-[rgba(77,57,31,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(77,57,31,0.72)]">
                        Active
                      </span>
                    )}
                  </div>

                  <p className={`mt-3 flex-1 whitespace-pre-wrap text-[rgba(36,27,14,0.9)] ${density === "compact" ? "text-[13px] leading-5" : density === "expanded" ? "text-[15px] leading-6" : "text-sm leading-5"}`}>{preview}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[rgba(66,51,31,0.72)]">
                    <span>{item.note.tags.length > 0 ? `${item.note.tags.length} tag${item.note.tags.length === 1 ? "" : "s"}` : "No tags"}</span>
                    <span>{metric === "created" ? "First appearance" : item.note.updatedAt > item.note.createdAt ? "Edited later" : "Unchanged"}</span>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {layout.items.length > 0 && (
        <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 rounded-[28px] border border-[rgba(114,91,58,0.18)] bg-[rgba(255,251,243,0.92)] p-4 shadow-[0_20px_40px_rgba(98,78,45,0.14)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 text-[11px] text-[rgba(73,56,35,0.74)]">
            <span>{formatTimelineDate(layout.minTs)}</span>
            <span>Scrub through {metric} history at {density} density</span>
            <span>{formatTimelineDate(layout.maxTs)}</span>
          </div>
          <div className="relative mt-3 h-10 rounded-full bg-[linear-gradient(90deg,rgba(128,99,56,0.12),rgba(128,99,56,0.04))]">
            <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-[rgba(92,73,43,0.26)]" />
            {layout.items.map((item) => {
              const left = scrubberInset + (item.x / scrubberRange) * (100 - scrubberInset * 2);
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
      )}
    </div>
  );
};
