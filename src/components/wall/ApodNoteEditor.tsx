"use client";

import type { Note } from "@/features/wall/types";

const panelClass =
  "absolute z-[48] w-[min(32rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]";
const buttonClass =
  "rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClass =
  "rounded-[1rem] border border-transparent bg-[color:rgba(12,74,110,0.94)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[color:rgba(12,74,110,0.86)] disabled:cursor-not-allowed disabled:opacity-55";

export const ApodNoteEditor = ({
  editingNote,
  camera,
  toScreenPoint,
  onClose,
  onRefresh,
  onDownload,
  onOpenSource,
}: {
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  onOpenSource: () => void;
}) => {
  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 860 : window.innerHeight;
  const apod = editingNote.apod;
  const hasImage = Boolean(editingNote.imageUrl);

  return (
    <div
      className={panelClass}
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 528))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 640))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">NASA APOD</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">{apod?.title || "Astronomy Picture of the Day"}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{apod?.date || "Loading latest APOD"}{apod?.copyright ? ` | ${apod.copyright}` : ""}</p>
        </div>
        <button type="button" onClick={onClose} className={buttonClass} data-note-edit-tags="true">
          Close
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative aspect-[4/3] bg-[linear-gradient(180deg,#eef4fb,#dfe8f5)]">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editingNote.imageUrl} alt={apod?.title || "NASA APOD"} className="h-full w-full object-contain" loading="eager" />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--color-text-muted)]">
              {apod?.error || (apod?.status === "loading" ? "Loading latest APOD..." : "APOD image unavailable.")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} className={primaryButtonClass} data-note-edit-tags="true">
          {apod?.status === "loading" ? "Refreshing..." : "Refresh Now"}
        </button>
        <button type="button" onClick={onDownload} className={buttonClass} disabled={!hasImage} data-note-edit-tags="true">
          Download Image
        </button>
        <button type="button" onClick={onOpenSource} className={buttonClass} disabled={!apod?.pageUrl} data-note-edit-tags="true">
          Open Source
        </button>
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Explanation</p>
        <p className="mt-2 max-h-40 overflow-y-auto text-sm leading-6 text-[var(--color-text)]">
          {apod?.explanation || apod?.error || "NASA metadata will appear here after the note fetches the latest APOD."}
        </p>
      </div>
    </div>
  );
};
