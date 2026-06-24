"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { timelineStreamShellStyles as shellStyles } from "@/components/wall/atelier-palette";
import { useIsDesktopTimelineLayout } from "@/components/wall/useIsDesktopTimelineLayout";
import { useWallTimelineStream } from "@/components/wall/useWallTimelineStream";
import { WallTimelineDetailPanel } from "@/components/wall/WallTimelineDetailPanel";
import { WallTimelineStreamHeader } from "@/components/wall/WallTimelineStreamHeader";
import { WallTimelineVirtualRow } from "@/components/wall/WallTimelineVirtualRow";
import { formatTimelineDateTime } from "@/components/wall/wallTimelineViewHelpers";
import {
  estimateTimelineStreamRowHeight,
  getTimelineStreamVirtualDayIndex,
  getTimelineStreamVirtualEntryIndex,
} from "@/components/wall/wallTimelineStreamHelpers";
import type { Note } from "@/features/wall/types";

type WallTimelineViewProps = {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onClearSelection?: () => void;
  onRevealNote: (noteId: string) => void;
  onExit: () => void;
};

export const WallTimelineView = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onClearSelection,
  onRevealNote,
  onExit,
}: WallTimelineViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktopTimelineLayout();
  const {
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    selectedDayKey,
    handleDayJump,
    groups,
    flatItems,
    totalNoteCount,
    filteredNoteCount,
    hasActiveSearch,
    effectiveSelectedId,
    selectedEntry,
    selectEntry,
    clearSelection,
    moveSelection,
    canMovePrevious,
    canMoveNext,
    dayOptions,
  } = useWallTimelineStream({ notes, selectedNoteId, onSelectNote, onClearSelection });

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      if (!item) {
        return 0;
      }
      return estimateTimelineStreamRowHeight(item, {
        isDesktop,
        isSelected: item.type === "entry" && item.entry.id === effectiveSelectedId,
      });
    },
    overscan: 5,
  });

  const noteCountLabel =
    hasActiveSearch && filteredNoteCount !== totalNoteCount
      ? `Read-only review · ${filteredNoteCount} of ${totalNoteCount} notes`
      : `Read-only review · ${filteredNoteCount} note${filteredNoteCount === 1 ? "" : "s"}`;

  useEffect(() => {
    virtualizer.measure();
  }, [flatItems, isDesktop, effectiveSelectedId]);

  useEffect(() => {
    if (!effectiveSelectedId) {
      return;
    }
    const index = getTimelineStreamVirtualEntryIndex(flatItems, effectiveSelectedId);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "auto", behavior: "smooth" });
    }
  }, [effectiveSelectedId, flatItems]);

  useEffect(() => {
    if (!selectedDayKey) {
      return;
    }
    const index = getTimelineStreamVirtualDayIndex(flatItems, selectedDayKey);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "start", behavior: "smooth" });
    }
  }, [flatItems, selectedDayKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
        return;
      }

      if (event.key === "Enter" && effectiveSelectedId) {
        event.preventDefault();
        onRevealNote(effectiveSelectedId);
        return;
      }

      if (event.key === "ArrowDown" || (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && key === "j")) {
        event.preventDefault();
        moveSelection("next");
        return;
      }

      if (event.key === "ArrowUp" || (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && key === "k")) {
        event.preventDefault();
        moveSelection("previous");
        return;
      }

      if (event.key === "[" || (event.key === "PageUp" && !event.shiftKey)) {
        event.preventDefault();
        moveSelection("previous");
        return;
      }

      if (event.key === "]" || (event.key === "PageDown" && !event.shiftKey)) {
        event.preventDefault();
        moveSelection("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveSelectedId, moveSelection, onExit, onRevealNote]);

  return (
    <div className="wall-timeline-shell absolute inset-0 z-20 flex overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent)" }} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <WallTimelineStreamHeader
          noteCountLabel={noteCountLabel}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          dayOptions={dayOptions}
          selectedDayKey={selectedDayKey}
          onDayJump={handleDayJump}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          canMovePrevious={canMovePrevious}
          canMoveNext={canMoveNext}
          onMovePrevious={() => moveSelection("previous")}
          onMoveNext={() => moveSelection("next")}
          onExit={onExit}
        />

        <div
          ref={scrollRef}
          className="wall-timeline-scrollbar relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-44 sm:px-6 sm:pt-48 lg:px-10"
        >
          <div className="relative mx-auto max-w-6xl pb-20" style={{ height: flatItems.length > 0 ? virtualizer.getTotalSize() : undefined }}>
            <div
              className="pointer-events-none absolute bottom-0 top-0 left-1/2 hidden -translate-x-1/2 md:block"
              style={{ width: "1px", background: `linear-gradient(180deg, transparent 0%, ${shellStyles.axis} 6%, ${shellStyles.axisSoft} 100%)` }}
            />

            {groups.length === 0 && totalNoteCount === 0 ? (
              <div className="mx-auto mt-24 max-w-xl rounded-[28px] border border-dashed px-8 py-14 text-center shadow-[var(--shadow-sm)]" style={{ borderColor: shellStyles.chipBorder, background: shellStyles.chipBg }}>
                <p className="font-[Newsreader] text-3xl italic" style={{ color: shellStyles.text }}>Nothing on the timeline yet.</p>
                <p className="mt-4 text-sm leading-7" style={{ color: shellStyles.muted }}>
                  This view only renders existing wall notes. Create notes on the wall, then return here to review them chronologically.
                </p>
              </div>
            ) : groups.length === 0 ? (
              <div className="mx-auto mt-24 max-w-xl rounded-[28px] border border-dashed px-8 py-14 text-center shadow-[var(--shadow-sm)]" style={{ borderColor: shellStyles.chipBorder, background: shellStyles.chipBg }}>
                <p className="font-[Newsreader] text-3xl italic" style={{ color: shellStyles.text }}>No matching notes.</p>
                <p className="mt-4 text-sm leading-7" style={{ color: shellStyles.muted }}>
                  Try a different search term, switch back to Created sorting, or clear the search field to see the full timeline again.
                </p>
              </div>
            ) : (
              virtualizer.getVirtualItems().map((virtualRow) => {
                const item = flatItems[virtualRow.index];
                if (!item) {
                  return null;
                }

                const isSelected = item.type === "entry" && item.entry.id === effectiveSelectedId;

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute left-0 top-0 w-full"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <WallTimelineVirtualRow
                      item={item}
                      isDesktop={isDesktop}
                      isSelected={isSelected}
                      shellStyles={shellStyles}
                      onSelect={selectEntry}
                      onReveal={onRevealNote}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.22em] opacity-70 md:inline-flex xl:left-[calc(50%-190px)]" style={{ borderColor: shellStyles.chipBorder, background: shellStyles.chipBg, color: shellStyles.quiet }}>
          Search or jump by day · Prev/Next or J/K · Enter to reveal
        </div>

        <span className="sr-only">{groups.length > 0 ? formatTimelineDateTime(groups[0]!.entries[0]!.ts) : "Timeline view"}</span>
      </div>

      <WallTimelineDetailPanel
        note={selectedEntry?.note}
        timestamp={selectedEntry?.ts}
        onReveal={() => {
          if (effectiveSelectedId) {
            onRevealNote(effectiveSelectedId);
          }
        }}
        onClose={clearSelection}
      />
    </div>
  );
};
