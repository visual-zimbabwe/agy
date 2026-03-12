"use client";

import { useEffect, useMemo, useRef } from "react";

import { Icon } from "@/components/wall/WallControls";
import {
  buildWallTimelineLayout,
  wallTimelineCardWidth,
  wallTimelineLaneGap,
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

const laneTopOffset = 120;
const cardHeight = 170;

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

const truncatePreviewText = (text: string, limit = 180) => {
  const normalized = text.trim();
  if (normalized.length <= limit) {
    return normalized || "(Empty note)";
  }
  return `${normalized.slice(0, Math.max(1, limit - 1)).trimEnd()}...`;
};

export const WallTimelineView = ({
  notes,
  selectedNoteId,
  activeTimestamp,
  onSelectNote,
  onRevealNote,
  onExit,
}: WallTimelineViewProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedCardRef = useRef<HTMLButtonElement | null>(null);
  const layout = useMemo(() => buildWallTimelineLayout(notes), [notes]);

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
    selectedCardRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [selectedNoteId]);

  const contentHeight = laneTopOffset + layout.laneCount * wallTimelineLaneGap + 72;
  const axisY = laneTopOffset - 24;
  const selectedNote = selectedNoteId ? notes.find((note) => note.id === selectedNoteId) : undefined;

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,214,88,0.16),_transparent_28%),linear-gradient(180deg,rgba(248,244,232,0.92),rgba(241,236,226,0.98))]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(112,94,66,0.08)_1px,transparent_1px)] bg-[size:96px_100%] opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,252,247,0.95),rgba(255,252,247,0))]" />

      <div className="pointer-events-auto relative z-10 flex items-center justify-between gap-3 border-b border-[rgba(114,91,58,0.18)] px-4 py-3">
        <div>
          <p className="font-['Georgia'] text-sm uppercase tracking-[0.24em] text-[rgba(91,68,39,0.7)]">Timeline View</p>
          <p className="text-sm text-[rgba(78,62,43,0.82)]">
            {layout.items.length === 0
              ? "No notes available for the timeline."
              : `${layout.items.length} notes arranged by creation time. Scroll sideways or use a trackpad to scrub.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-x-auto overflow-y-auto px-4 pb-10 pt-6">
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

          {layout.items.map((item) => {
            const isSelected = item.id === selectedNoteId;
            const isActiveMoment = typeof activeTimestamp === "number" && Math.abs(item.note.createdAt - activeTimestamp) < 60_000;
            const preview = truncatePreviewText(item.note.text);
            const cardTop = laneTopOffset + item.lane * wallTimelineLaneGap;

            return (
              <article
                key={item.id}
                className="absolute"
                style={{
                  left: `${item.x}px`,
                  top: `${cardTop}px`,
                  width: `${wallTimelineCardWidth}px`,
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
                        {item.note.tags[0] ? `#${item.note.tags[0]}` : item.note.noteKind === "quote" ? "Quote note" : "Wall note"}
                      </p>
                    </div>
                    {isActiveMoment && (
                      <span className="rounded-full bg-[rgba(77,57,31,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(77,57,31,0.72)]">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-5 text-[rgba(36,27,14,0.9)]">{preview}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[rgba(66,51,31,0.72)]">
                    <span>{item.note.tags.length > 0 ? `${item.note.tags.length} tag${item.note.tags.length === 1 ? "" : "s"}` : "No tags"}</span>
                    <span>{item.note.updatedAt > item.note.createdAt ? "Edited later" : "Original"}</span>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
