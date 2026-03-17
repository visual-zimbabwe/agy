"use client";

import { useState, type RefObject } from "react";

import {
  formatJournalDateLabel,
  getNoteTextFontFamily,
  getNoteTextStyle,
  noteTagChipPalette,
} from "@/components/wall/wall-canvas-helpers";
import type { WallTimelineDensity, WallTimelineItem } from "@/components/wall/wallTimelineViewLayout";
import {
  formatTimelineDate,
  formatTimelineDateTime,
  truncatePreviewText,
} from "@/components/wall/wallTimelineViewHelpers";
import { NOTE_DEFAULTS } from "@/features/wall/constants";

type WallTimelineCardProps = {
  item: WallTimelineItem;
  density: WallTimelineDensity;
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

const readTimelineTitle = (item: WallTimelineItem) => {
  if (item.note.noteKind === "quote") {
    return item.note.quoteAuthor?.trim() || "Quote note";
  }
  if (item.note.noteKind === "canon") {
    return item.note.canon?.title?.trim() || "Canon note";
  }
  if (item.note.noteKind === "journal") {
    return formatJournalDateLabel(item.note.createdAt);
  }
  if (item.note.pinned) {
    return "Pinned note";
  }
  return "";
};

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const readTimelinePreview = (item: WallTimelineItem, density: WallTimelineDensity) => truncatePreviewText(stripWikiLinkMarkup(item.note.text), density);

const maxVisibleTagsByDensity: Record<WallTimelineDensity, number> = {
  compact: 1,
  comfortable: 2,
  expanded: 3,
};

export const WallTimelineCard = ({
  item,
  density,
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
  const isQuote = item.note.noteKind === "quote";
  const isJournal = item.note.noteKind === "journal";
  const preview = readTimelinePreview(item, density);
  const cardTop = laneTopOffset + item.lane * laneGap;
  const title = readTimelineTitle(item);
  const hasTags = item.note.tags.length > 0;
  const resolvedTextColor = item.note.textColor ?? NOTE_DEFAULTS.textColor;
  const tagPalette = noteTagChipPalette(item.note.color);
  const noteTextStyle = getNoteTextStyle(item.note.textSize, item.note.textSizePx);
  const noteTextFontFamily = getNoteTextFontFamily(item.note.textFont);
  const visibleTags = item.note.tags.slice(0, maxVisibleTagsByDensity[density]);
  const overflowTags = Math.max(0, item.note.tags.length - visibleTags.length);
  const quoteAttribution = item.note.quoteAuthor?.trim() ?? "";
  const canonTitle = item.note.canon?.title?.trim() ?? "";
  const shellShadow = isSelected ? "0 0 0 1px rgba(15,23,42,0.08), 0 18px 40px rgba(16,16,16,0.22)" : "0 12px 30px rgba(16,16,16,0.16)";
  const shellBorder = isSelected ? "#0f172a" : "#d4d4d8";
  const shellRadius = isJournal ? "20px" : "14px";
  const journalBackground = "linear-gradient(90deg, rgba(226,141,141,0.42) 0 1px, transparent 1px 44px, rgba(226,141,141,0.42) 44px 45px, transparent 45px), repeating-linear-gradient(180deg, rgba(233,233,233,0.92) 0 1px, transparent 1px 31px), #ffffff";

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

      <button
        ref={isSelected ? selectedCardRef : null}
        type="button"
        onClick={() => onSelectNote(item.id)}
        onDoubleClick={() => onRevealNote(item.id)}
        className="relative w-full overflow-hidden text-left transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(15,23,42,0.35)]"
        style={{
          height: `${cardHeight}px`,
          minHeight: `${cardHeight}px`,
          borderRadius: shellRadius,
          border: `1px solid ${shellBorder}`,
          background: isJournal ? journalBackground : item.note.color,
          boxShadow: shellShadow,
          clipPath: isJournal ? "polygon(10px 0%, calc(100% - 18px) 0%, 100% 14px, calc(100% - 5px) calc(100% - 16px), calc(100% - 24px) 100%, 20px 100%, 0% calc(100% - 12px), 0% 10px)" : undefined,
        }}
      >
        {isSelected && !isJournal && <div className="absolute inset-0 rounded-[14px] border-2 border-[#0f172a] pointer-events-none" />}
        {isSelected && isJournal && <div className="absolute inset-0 pointer-events-none [clip-path:polygon(10px_0%,calc(100%_-_18px)_0%,100%_14px,calc(100%_-_5px)_calc(100%_-_16px),calc(100%_-_24px)_100%,20px_100%,0%_calc(100%_-_12px),0%_10px)] border-2 border-[#0f172a]" />}
        {item.note.highlighted && <div className="absolute inset-0 rounded-[14px] border border-dashed border-amber-400 pointer-events-none" />}

        <div className={`relative flex h-full flex-col ${isJournal ? "px-5 pb-4 pt-3" : "p-3"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className={`min-w-0 flex-1 ${isJournal ? "pl-11 pt-0.5" : isQuote ? "pl-5" : ""}`}>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: resolvedTextColor, opacity: 0.72 }}>
                {formatTimelineDateTime(item.ts)}
              </p>
              {(title || canonTitle) && (
                <p className="mt-1 truncate text-sm font-semibold" style={{ color: resolvedTextColor }} title={title || canonTitle}>
                  {title || canonTitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.note.pinned && (
                <span className="rounded-full bg-white/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
                  Pin
                </span>
              )}
              {isActiveMoment && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: tagPalette.bg, color: tagPalette.text }}>
                  Active
                </span>
              )}
            </div>
          </div>

          {isQuote && (
            <div className="pointer-events-none absolute left-3 top-10 text-[26px] font-bold leading-none" style={{ color: resolvedTextColor, opacity: 0.75 }}>
              {"\""}
            </div>
          )}

          <div className={`mt-3 min-h-0 flex-1 overflow-hidden ${isJournal ? "pl-11 pt-1" : isQuote ? "pl-5" : ""}`}>
            <p
              className={`h-full overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere] ${density === "compact" ? "text-[13px] leading-5" : density === "expanded" ? "text-[15px] leading-6" : "text-sm leading-5"} ${isQuote ? "italic" : ""}`}
              style={{
                color: resolvedTextColor,
                fontFamily: noteTextFontFamily,
                lineHeight: isJournal ? 1.72 : noteTextStyle.lineHeight,
              }}
            >
              {preview}
            </p>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0 flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={`${item.id}-${tag}`}
                  className="max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    borderColor: tagPalette.border,
                    backgroundColor: tagPalette.bg,
                    color: tagPalette.text,
                  }}
                  title={`#${tag}`}
                >
                  #{tag}
                </span>
              ))}
              {overflowTags > 0 && (
                <span
                  className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    borderColor: tagPalette.border,
                    backgroundColor: tagPalette.bg,
                    color: tagPalette.text,
                  }}
                >
                  +{overflowTags}
                </span>
              )}
            </div>
          </div>

          {isQuote && quoteAttribution && (
            <p className="mt-2 text-right text-[10px] italic" style={{ color: resolvedTextColor, opacity: 0.78 }}>
              {quoteAttribution}
            </p>
          )}
        </div>
      </button>

      {hasTags && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setTagsOpen((current) => !current);
          }}
          className="absolute bottom-4 right-4 z-20 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          style={{
            borderColor: tagPalette.border,
            backgroundColor: "rgba(255,255,255,0.72)",
            color: tagPalette.text,
          }}
          aria-expanded={tagsOpen}
          aria-label={tagsOpen ? "Hide note tags" : "Show note tags"}
        >
          Tags
        </button>
      )}

      {tagsOpen && hasTags && (
        <div
          className="pointer-events-none absolute inset-x-4 bottom-14 z-20 rounded-[14px] border px-3 py-3 shadow-[0_16px_34px_rgba(82,61,31,0.18)] backdrop-blur-sm"
          style={{
            borderColor: tagPalette.border,
            backgroundColor: item.note.color,
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {item.note.tags.map((tag) => (
              <span
                key={`${item.id}-popup-${tag}`}
                className="max-w-full truncate rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  borderColor: tagPalette.border,
                  backgroundColor: tagPalette.bg,
                  color: tagPalette.text,
                }}
                title={`#${tag}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

