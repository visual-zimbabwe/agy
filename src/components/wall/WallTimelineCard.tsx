"use client";

import type { RefObject } from "react";

import { formatJournalDateLabel, getNoteTextFontFamily, getNoteTextStyle } from "@/components/wall/wall-canvas-helpers";
import { getEisenhowerPreview } from "@/features/wall/eisenhower";
import type { WallTimelineItem } from "@/components/wall/wallTimelineViewLayout";
import { formatTimelineDate, formatTimelineDateTime, truncatePreviewText } from "@/components/wall/wallTimelineViewHelpers";
import { NOTE_DEFAULTS } from "@/features/wall/constants";

type WallTimelineCardProps = {
  item: WallTimelineItem;
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
  if (item.note.noteKind === "eisenhower") {
    return item.note.eisenhower?.displayDate || "Eisenhower Matrix";
  }
  if (item.note.pinned) {
    return "Pinned note";
  }
  return "";
};

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

const journalBackground =
  "linear-gradient(90deg, rgba(226,141,141,0.42) 0 1px, transparent 1px 44px, rgba(226,141,141,0.42) 44px 45px, transparent 45px), repeating-linear-gradient(180deg, rgba(233,233,233,0.92) 0 1px, transparent 1px 31px), #ffffff";

export const WallTimelineCard = ({
  item,
  selectedNoteId,
  activeTimestamp,
  selectedCardRef,
  onSelectNote,
  onRevealNote,
}: WallTimelineCardProps) => {
  const isSelected = item.id === selectedNoteId;
  const isActiveMoment = typeof activeTimestamp === "number" && Math.abs(item.ts - activeTimestamp) < 60_000;
  const isQuote = item.note.noteKind === "quote";
  const isJournal = item.note.noteKind === "journal";
  const preview = item.note.noteKind === "eisenhower" ? getEisenhowerPreview(item.note) : truncatePreviewText(stripWikiLinkMarkup(item.note.text), item.note);
  const title = readTimelineTitle(item);
  const resolvedTextColor = item.note.textColor ?? NOTE_DEFAULTS.textColor;
  const noteTextStyle = getNoteTextStyle(item.note.textSize, item.note.textSizePx);
  const noteTextFontFamily = getNoteTextFontFamily(item.note.textFont);
  const quoteAttribution = item.note.quoteAuthor?.trim() ?? "";
  const canonTitle = item.note.canon?.title?.trim() ?? "";
  const shellShadow = isSelected ? "0 0 0 1px rgba(15,23,42,0.08), 0 18px 40px rgba(16,16,16,0.22)" : "0 12px 30px rgba(16,16,16,0.16)";
  const shellBorder = isSelected ? "#0f172a" : "#d4d4d8";
  const shellRadius = isJournal ? "20px" : "14px";

  return (
    <article
      className="absolute"
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
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
          height: `${item.height}px`,
          minHeight: `${item.height}px`,
          borderRadius: shellRadius,
          border: `1px solid ${shellBorder}`,
          background: isJournal ? journalBackground : item.note.color,
          boxShadow: shellShadow,
          clipPath: isJournal ? "polygon(10px 0%, calc(100% - 18px) 0%, 100% 14px, calc(100% - 5px) calc(100% - 16px), calc(100% - 24px) 100%, 20px 100%, 0% calc(100% - 12px), 0% 10px)" : undefined,
        }}
      >
        {isSelected && !isJournal && <div className="pointer-events-none absolute inset-0 rounded-[14px] border-2 border-[#0f172a]" />}
        {isSelected && isJournal && <div className="pointer-events-none absolute inset-0 [clip-path:polygon(10px_0%,calc(100%_-_18px)_0%,100%_14px,calc(100%_-_5px)_calc(100%_-_16px),calc(100%_-_24px)_100%,20px_100%,0%_calc(100%_-_12px),0%_10px)] border-2 border-[#0f172a]" />}
        {item.note.highlighted && <div className="pointer-events-none absolute inset-0 rounded-[14px] border border-dashed border-amber-400" />}

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
                <span className="rounded-full bg-white/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
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
              className={`h-full overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere] ${isQuote ? "italic" : ""}`}
              style={{
                color: resolvedTextColor,
                fontFamily: noteTextFontFamily,
                fontSize: noteTextStyle.fontSize,
                lineHeight: isJournal ? 1.72 : noteTextStyle.lineHeight,
              }}
            >
              {preview}
            </p>
          </div>

          {isQuote && quoteAttribution && (
            <p className="mt-2 text-right text-[10px] italic" style={{ color: resolvedTextColor, opacity: 0.78 }}>
              {quoteAttribution}
            </p>
          )}
        </div>
      </button>
    </article>
  );
};




