"use client";

import type { Note } from "@/features/wall/types";

const panelClass =
  "pointer-events-auto absolute z-[70] w-[min(24rem,calc(100vw-1.5rem))] rounded-[1.4rem] border border-[color:rgb(189_116_67_/_0.28)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-elevated)_82%,#F6EFE2_18%)_0%,color-mix(in_srgb,var(--color-surface)_88%,#EADCC5_12%)_100%)] p-4 text-[var(--color-text)] shadow-[0_28px_80px_rgba(36,27,18,0.18)] backdrop-blur-[18px]";
const buttonClass =
  "rounded-full border border-[color:rgb(138_88_46_/_0.18)] bg-[color:rgb(255_255_255_/_0.76)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)] transition hover:bg-[color:rgb(255_255_255_/_0.92)] disabled:cursor-not-allowed disabled:opacity-50";

export const EconomistCoverEditor = ({
  note,
  camera,
  toScreenPoint,
  onClose,
  onRefresh,
  onOpenSource,
  onUpdateNote,
}: {
  note: Note & { noteKind: "economist" };
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onRefresh: (year?: string) => void;
  onOpenSource: () => void;
  onUpdateNote: (noteId: string, patch: Partial<Note>) => void;
}) => {
  const screen = toScreenPoint(note.x + note.w / 2, note.y + note.h + 18, camera);
  const [title, dateLabel] = note.text.split("\n");

  return (
    <div className={panelClass} style={{ left: `${screen.x}px`, top: `${screen.y}px`, transform: "translate(-50%, 0)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:rgb(118_86_58_/_0.72)]">Magazine Cover</p>
          <h3 className="mt-1 text-lg font-semibold text-[color:rgb(36_27_18)]">{title?.trim() || "The Economist"}</h3>
          <p className="mt-1 text-xs text-[color:rgb(92_73_54_/_0.78)]">{dateLabel?.trim() || note.quoteSource || "Latest available issue"}</p>
        </div>
        <button type="button" onClick={onClose} className={buttonClass}>
          Close
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-[color:rgb(138_88_46_/_0.16)] bg-[color:rgb(255_255_255_/_0.7)]">
        {note.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={note.imageUrl} alt={title?.trim() || "The Economist cover"} className="h-56 w-full object-contain bg-[linear-gradient(180deg,#fbf7ef,#efe3cf)]" />
        ) : (
          <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-[color:rgb(92_73_54_/_0.72)]">Latest cover image will appear here after refresh.</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          type="text"
          value={note.economist?.year ?? ""}
          onChange={(event) =>
            onUpdateNote(note.id, {
              economist: {
                status: note.economist?.status ?? "ready",
                ...note.economist,
                year: event.target.value.trim() || undefined,
              },
            })
          }
          placeholder="Year (e.g. 2024)"
          className="min-w-0 rounded-full border border-[color:rgb(138_88_46_/_0.18)] bg-[color:rgb(255_255_255_/_0.76)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[color:rgb(138_88_46_/_0.4)]"
          disabled={!note.tags.includes("economist")}
          aria-label="Magazine cover year"
        />
        <button type="button" onClick={() => onRefresh(note.economist?.year)} className={buttonClass} data-note-edit-tags="true">
          Refresh Cover
        </button>
      </div>

      <div className="mt-2 text-right">
        <button type="button" onClick={onOpenSource} className={buttonClass} data-note-edit-tags="true">
          Open Source
        </button>
      </div>
    </div>
  );
};
