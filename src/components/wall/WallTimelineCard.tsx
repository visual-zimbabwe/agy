"use client";

import { memo, type RefObject } from "react";

import { WallNotePreview } from "@/components/wall/WallNotePreview";
import type { WallTimelineCardSize, WallTimelineItem } from "@/components/wall/wallTimelineViewLayout";
import { formatTimelineDate, formatTimelineDateTime } from "@/components/wall/wallTimelineViewHelpers";

type WallTimelineCardProps = {
  item: WallTimelineItem;
  cardSize: WallTimelineCardSize;
  selectedNoteId?: string;
  activeTimestamp?: number;
  selectedCardRef: RefObject<HTMLButtonElement | null>;
  onSelectNote: (noteId: string) => void;
  onRevealNote: (noteId: string) => void;
};

export const WallTimelineCard = memo(function WallTimelineCard({
  item,
  cardSize,
  selectedNoteId,
  activeTimestamp,
  selectedCardRef,
  onSelectNote,
  onRevealNote,
}: WallTimelineCardProps) {
  const isSelected = item.id === selectedNoteId;
  const isActiveMoment = typeof activeTimestamp === "number" && Math.abs(item.ts - activeTimestamp) < 60_000;

  return (
    <article
      className="absolute"
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-[-34px] h-7 w-px -translate-x-1/2 bg-[var(--timeline-line-strong)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-63px] -translate-x-1/2">
        <div className="rounded-full border border-[var(--timeline-panel-border)] bg-[var(--timeline-chip-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--timeline-text-muted)] shadow-[0_8px_20px_rgba(0,0,0,0.14)]">
          {formatTimelineDate(item.ts)}
        </div>
      </div>

      <button
        ref={isSelected ? selectedCardRef : null}
        type="button"
        onClick={() => onSelectNote(item.id)}
        onDoubleClick={() => onRevealNote(item.id)}
        className="group relative w-full text-left transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--timeline-selection)]"
        aria-label={`Open note from ${formatTimelineDateTime(item.ts)}`}
      >
        <WallNotePreview note={item.note} width={item.width} height={item.height} scale={cardSize} selected={isSelected} />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="max-w-[70%] truncate rounded-full bg-[var(--timeline-meta-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--timeline-meta-text)] backdrop-blur-md">
            {formatTimelineDateTime(item.ts)}
          </span>
          <div className="flex items-center gap-1.5">
            {item.note.pinned && <span className="rounded-full bg-[var(--timeline-meta-bg)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--timeline-meta-text)]">Pin</span>}
            {isActiveMoment && <span className="rounded-full bg-[var(--timeline-selection)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--timeline-selection-text)]">Active</span>}
          </div>
        </div>
      </button>
    </article>
  );
});
