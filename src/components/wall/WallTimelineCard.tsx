"use client";

import { useState, type RefObject } from "react";

import type { WallTimelineDensity, WallTimelineMetric, WallTimelineItem } from "@/components/wall/wallTimelineViewLayout";
import {
  formatTimelineDate,
  formatTimelineDateTime,
  readCardColors,
  truncatePreviewText,
} from "@/components/wall/wallTimelineViewHelpers";

type WallTimelineCardProps = {
  item: WallTimelineItem;
  index: number;
  density: WallTimelineDensity;
  metric: WallTimelineMetric;
  cardHeight: number;
  cardWidth: number;
  laneGap: number;
  laneTopOffset: number;
  selectedNoteId?: string;
  activeTimestamp?: number;
  selectedCardRef: RefObject<HTMLButtonElement | null>;
  onSelectNote: (noteId: string) => void;
  onRevealNote: (noteId: string) => void;
};

const readTimelineTitle = (item: WallTimelineItem, index: number) => {
  if (item.note.noteKind === "quote") {
    return item.note.quoteAuthor?.trim() || "Quote note";
  }
  if (item.note.noteKind === "canon") {
    return item.note.canon?.title?.trim() || "Canon note";
  }
  if (item.note.pinned) {
    return "Pinned note";
  }
  return `Wall note ${index + 1}`;
};

const readTimelinePreview = (item: WallTimelineItem, density: WallTimelineDensity) => truncatePreviewText(item.note.text, density);

const readNoteKindLabel = (item: WallTimelineItem) => {
  if (item.note.noteKind === "quote") {
    return "Quote";
  }
  if (item.note.noteKind === "canon") {
    return "Canon";
  }
  return item.note.pinned ? "Pinned note" : "Standard note";
};

export const WallTimelineCard = ({
  item,
  index,
  density,
  metric,
  cardHeight,
  cardWidth,
  laneGap,
  laneTopOffset,
  selectedNoteId,
  activeTimestamp,
  selectedCardRef,
  onSelectNote,
  onRevealNote,
}: WallTimelineCardProps) => {
  const [tagsOpen, setTagsOpen] = useState(false);
  const isSelected = item.id === selectedNoteId;
  const isActiveMoment = typeof activeTimestamp === "number" && Math.abs(item.ts - activeTimestamp) < 60_000;
  const preview = readTimelinePreview(item, density);
  const cardTop = laneTopOffset + item.lane * laneGap;
  const cardColors = readCardColors(item.note);
  const title = readTimelineTitle(item, index);
  const noteKindLabel = readNoteKindLabel(item);
  const hasTags = item.note.tags.length > 0;

  return (
    <article
      className="group absolute"
      onMouseLeave={() => setTagsOpen(false)}
      style={{
        left: `${item.x}px`,
        top: `${cardTop}px`,
        width: `${cardWidth}px`,
      }}
    >
      <div className="pointer-events-none absolute left-6 top-[-42px] h-8 w-px bg-[rgba(92,73,43,0.32)]" />
      <span className="absolute left-2 top-[-72px] rounded-full border border-[rgba(114,91,58,0.16)] bg-[rgba(255,252,246,0.95)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgba(90,69,41,0.78)] shadow-[0_10px_18px_rgba(99,79,46,0.09)]">
        {formatTimelineDate(item.ts)}
      </span>

      {hasTags && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setTagsOpen((current) => !current);
            }}
            className={`absolute bottom-4 left-4 z-20 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all ${
              tagsOpen || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
            style={{
              borderColor: cardColors.activeBackground,
              backgroundColor: tagsOpen ? cardColors.activeBackground : "rgba(255,252,246,0.84)",
              color: tagsOpen ? cardColors.activeText : cardColors.mutedText,
            }}
            aria-expanded={tagsOpen}
            aria-label={tagsOpen ? "Hide note tags" : "Show note tags"}
          >
            Tags
          </button>
          {tagsOpen && (
            <div
              className="pointer-events-none absolute inset-x-4 bottom-14 z-20 rounded-[20px] border px-3 py-3 shadow-[0_16px_34px_rgba(82,61,31,0.18)] backdrop-blur-sm"
              style={{
                borderColor: cardColors.activeBackground,
                backgroundColor: item.note.color,
              }}
            >
              <div className="flex flex-wrap gap-1.5">
                {item.note.tags.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      borderColor: cardColors.activeBackground,
                      backgroundColor: cardColors.activeBackground,
                      color: cardColors.activeText,
                    }}
                    title={`#${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        ref={isSelected ? selectedCardRef : null}
        type="button"
        onClick={() => onSelectNote(item.id)}
        onDoubleClick={() => onRevealNote(item.id)}
        className={`relative flex w-full flex-col overflow-hidden rounded-[28px] border p-4 text-left shadow-[0_18px_45px_rgba(82,61,31,0.16)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(82,61,31,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(88,69,43,0.45)] ${
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
          <div className="min-w-0 flex-1 pr-12">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: cardColors.softText }}>
              {formatTimelineDateTime(item.ts)}
            </p>
            <p className="mt-1 truncate text-sm font-semibold" style={{ color: cardColors.readableText }} title={title}>
              {title}
            </p>
          </div>
          {isActiveMoment && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: cardColors.activeBackground, color: cardColors.activeText }}>
              Active
            </span>
          )}
        </div>

        <p className={`mt-3 min-h-0 flex-1 overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere] ${density === "compact" ? "text-[13px] leading-5" : density === "expanded" ? "text-[15px] leading-6" : "text-sm leading-5"}`} style={{ color: cardColors.readableText }}>
          {preview}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 pr-12 text-[11px]" style={{ color: cardColors.mutedText }}>
          <span className="truncate">{noteKindLabel}</span>
          <span className="truncate text-right">{metric === "created" ? "First appearance" : item.note.updatedAt > item.note.createdAt ? "Edited later" : "Unchanged"}</span>
        </div>
      </button>
    </article>
  );
};
