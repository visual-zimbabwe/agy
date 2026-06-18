"use client";

import { memo } from "react";

import type { TimelineStreamShellStyles } from "@/components/wall/atelier-palette";
import { atelierPalette } from "@/components/wall/atelier-palette";
import { WallNotePreview } from "@/components/wall/WallNotePreview";
import { formatTimelineDateTime } from "@/components/wall/wallTimelineViewHelpers";
import {
  getTimelineStreamEntryPreviewDimensions,
  type TimelineStreamEntry,
  type TimelineStreamVirtualItem,
} from "@/components/wall/wallTimelineStreamHelpers";

type WallTimelineVirtualRowProps = {
  item: TimelineStreamVirtualItem;
  isDesktop: boolean;
  isSelected: boolean;
  shellStyles: TimelineStreamShellStyles;
  onSelect: (noteId: string) => void;
  onReveal: (noteId: string) => void;
};

const formatTimeLabel = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

const RevealOnWallButton = memo(function RevealOnWallButton({
  visible,
  onReveal,
}: {
  visible: boolean;
  onReveal: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onReveal();
      }}
      className="pointer-events-auto mt-3 inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/70 md:mt-0 md:absolute md:right-3 md:top-3 md:shadow-sm"
      style={{
        borderColor: "var(--timeline-selection)",
        background: "rgba(255,255,255,0.92)",
        color: "var(--timeline-selection)",
      }}
    >
      Reveal on Wall
    </button>
  );
});

const TimelineStreamCard = memo(function TimelineStreamCard({
  entry,
  isDesktop,
  selected,
  onSelect,
  onReveal,
  alignment,
}: {
  entry: TimelineStreamEntry;
  isDesktop: boolean;
  selected: boolean;
  onSelect: () => void;
  onReveal: () => void;
  alignment: "left" | "right" | "center";
}) {
  const previewDimensions = getTimelineStreamEntryPreviewDimensions(entry, isDesktop);
  const alignmentClass =
    alignment === "center"
      ? "items-center text-center"
      : alignment === "left"
        ? "items-end text-right"
        : "items-start text-left";

  return (
    <div className={`relative flex max-w-full flex-col ${alignmentClass}`}>
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onReveal}
        aria-pressed={selected}
        aria-label={`Select note from ${formatTimelineDateTime(entry.ts)}`}
        className={`group relative max-w-full rounded-[24px] text-left transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818] ${
          alignment === "center" ? "mx-auto" : ""
        } ${selected ? "-translate-y-0.5" : "hover:-translate-y-1"}`}
      >
        <div className="max-w-full overflow-hidden">
          <WallNotePreview
            note={entry.note}
            width={previewDimensions.width}
            height={previewDimensions.height}
            scale="large"
            surface="timeline-stream"
            selected={selected}
          />
        </div>
        <RevealOnWallButton visible={selected} onReveal={onReveal} />
      </button>
    </div>
  );
});

export const WallTimelineVirtualRow = memo(function WallTimelineVirtualRow({
  item,
  isDesktop,
  isSelected,
  shellStyles,
  onSelect,
  onReveal,
}: WallTimelineVirtualRowProps) {
  if (item.type === "group-header") {
    return (
      <div className="relative z-[1] mb-10 mt-10 flex scroll-mt-44 justify-center md:mb-16 md:mt-14 sm:scroll-mt-48">
        <span
          className="inline-flex rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] shadow-sm"
          style={{
            borderColor: shellStyles.chipBorder,
            background: shellStyles.chipBg,
            color: shellStyles.muted,
          }}
        >
          {item.label}
        </span>
      </div>
    );
  }

  const { entry } = item;
  const timeLabel = (
    <p className="mt-4 text-[10px] uppercase tracking-[0.24em]" style={{ color: shellStyles.quiet }}>
      {formatTimeLabel(entry.ts)}
    </p>
  );

  if (entry.side === "center") {
    return (
      <div className="flex justify-center px-4" style={{ ["--timeline-selection" as string]: shellStyles.selection }}>
        <div className="max-w-full text-center">
          <TimelineStreamCard
            entry={entry}
            isDesktop={isDesktop}
            selected={isSelected}
            onSelect={() => onSelect(entry.id)}
            onReveal={() => onReveal(entry.id)}
            alignment="center"
          />
          {timeLabel}
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] md:gap-10"
      style={{ ["--timeline-selection" as string]: shellStyles.selection }}
    >
      <div className={`flex ${entry.side === "left" ? "justify-end text-right" : "justify-start md:col-start-3"}`}>
        <div className={`flex max-w-full flex-col ${entry.side === "left" ? "items-end text-right" : "items-start text-left"}`}>
          <TimelineStreamCard
            entry={entry}
            isDesktop={isDesktop}
            selected={isSelected}
            onSelect={() => onSelect(entry.id)}
            onReveal={() => onReveal(entry.id)}
            alignment={entry.side}
          />
          {timeLabel}
        </div>
      </div>

      <div className="relative hidden items-start justify-center md:flex">
        <div className="mt-4 h-3 w-3 rounded-full border-2" style={{ borderColor: shellStyles.axis, background: atelierPalette.warm }} />
      </div>
    </div>
  );
});
