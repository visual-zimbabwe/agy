"use client";

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
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={() => onToggleDetailsSection("history")}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">History</p>
        <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.history ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.history && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-700">
            <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Timeline entries: {timelineEntriesCount}</div>
            <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Visible notes: {visibleNotesCount}</div>
            <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Undo depth: {historyUndoDepth}</div>
            <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Redo depth: {historyRedoDepth}</div>
            <div className="col-span-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
              Latest edit: {notes.length === 0 ? "n/a" : new Date(Math.max(...notes.map((note) => note.updatedAt))).toLocaleString()}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onJumpStale} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
              Jump Stale
            </button>
            <button type="button" onClick={onJumpPriority} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
              Jump Priority
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              disabled={historyUndoDepth === 0 && historyRedoDepth === 0}
              className="rounded border border-rose-300 bg-white px-2 py-1 text-[11px] text-rose-700 disabled:opacity-50"
            >
              Clear History
            </button>
          </div>
        </>
      )}
    </div>
  );
};
