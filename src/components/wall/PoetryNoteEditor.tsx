"use client";

import type { Note } from "@/features/wall/types";
import { getPoetryTitle, POETRY_NOTE_SOURCE } from "@/features/wall/poetry";

const buttonClass =
  "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50";

type PoetryNoteEditorProps = {
  editingNote: Note & { noteKind: "poetry" };
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onRefresh: () => void;
  onDownloadImage: () => void;
  onDownloadPdf: () => void;
};

export const PoetryNoteEditor = ({ editingNote, camera, toScreenPoint, onClose, onRefresh, onDownloadImage, onDownloadPdf }: PoetryNoteEditorProps) => {
  const poetry = editingNote.poetry;
  const point = toScreenPoint(editingNote.x + editingNote.w / 2, editingNote.y + editingNote.h / 2, camera);

  return (
    <div
      data-note-edit-tags="true"
      className="absolute z-[45] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-[var(--color-text)] shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]"
      style={{ left: `${point.x}px`, top: `${Math.max(24, point.y - 18)}px` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Poetry</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">{getPoetryTitle(editingNote)}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {poetry?.author || editingNote.quoteAuthor || "Unknown Poet"} | {poetry?.lineCount ?? poetry?.lines.length ?? 0} lines | {poetry?.dateKey || "Loading latest poem"}
          </p>
        </div>
        <button type="button" onClick={onClose} className={buttonClass} data-note-edit-tags="true">
          Close
        </button>
      </div>

      <div className="mt-3 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface)] p-3">
        <pre className="max-h-[20rem] overflow-auto whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">
          {editingNote.text || poetry?.error || "Loading poem..."}
        </pre>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} className={buttonClass} disabled={poetry?.status === "loading"} data-note-edit-tags="true">
          {poetry?.status === "loading" ? "Refreshing..." : "Refresh Poetry"}
        </button>
        <button type="button" onClick={onDownloadImage} className={buttonClass} data-note-edit-tags="true">
          Download Image
        </button>
        <button type="button" onClick={onDownloadPdf} className={buttonClass} data-note-edit-tags="true">
          Download PDF
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[var(--color-text-muted)]">
        Source: {POETRY_NOTE_SOURCE}. The note refreshes automatically when the local day changes, and manual refresh replaces today&apos;s cached poem.
      </p>
      {poetry?.error && <p className="mt-2 text-[11px] text-[#B42318]">{poetry.error}</p>}
    </div>
  );
};
