"use client";

import {
  detailButton,
  detailDangerButton,
  detailInsetCard,
  detailSectionCard,
  detailSectionTitle,
  detailSectionToggle,
} from "@/components/wall/details/detailSectionStyles";
import type { HistorySectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const HistorySection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  timelineEntriesCount,
  visibleNotesCount,
  historyUndoDepth,
  historyRedoDepth,
  notes,
  onJumpStale,
  onJumpPriority,
  onClearHistory,
}: HistorySectionProps) => {
  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("history")}
        className="flex w-full items-center justify-between text-left"
      >
        <p className={detailSectionTitle}>History</p>
        <span className={detailSectionToggle}>{detailsSectionsOpen.history ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.history && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[var(--color-text)]">
            <div className={detailInsetCard}>Timeline entries: {timelineEntriesCount}</div>
            <div className={detailInsetCard}>Visible notes: {visibleNotesCount}</div>
            <div className={detailInsetCard}>Undo depth: {historyUndoDepth}</div>
            <div className={detailInsetCard}>Redo depth: {historyRedoDepth}</div>
            <div className={`col-span-2 ${detailInsetCard}`}>
              Latest edit: {notes.length === 0 ? "n/a" : new Date(Math.max(...notes.map((note) => note.updatedAt))).toLocaleString()}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onJumpStale} className={detailButton}>
              Jump Stale
            </button>
            <button type="button" onClick={onJumpPriority} className={detailButton}>
              Jump Priority
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              disabled={historyUndoDepth === 0 && historyRedoDepth === 0}
              className={detailDangerButton}
            >
              Clear History
            </button>
          </div>
        </>
      )}
    </div>
  );
};
