"use client";

import { WallNotePreview } from "@/components/wall/WallNotePreview";
import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";
import { formatTimelineDateTime } from "@/components/wall/wallTimelineViewHelpers";
import type { Note } from "@/features/wall/types";

type WallTimelineDetailPanelProps = {
  note?: Note;
  timestamp?: number;
  onReveal: () => void;
  onClose: () => void;
};

const panelButtonClass =
  "rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]";

export const WallTimelineDetailPanel = ({ note, timestamp, onReveal, onClose }: WallTimelineDetailPanelProps) => {
  if (!note || typeof timestamp !== "number") {
    return (
      <aside className="hidden h-full w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 backdrop-blur-xl xl:block">
        <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-text)]">Select a note</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">The detail panel keeps rich note content readable when smaller timeline cards need truncation.</p>
        </div>
      </aside>
    );
  }

  const previewDimensions = resolveWallPreviewDimensions(note, {
    surface: "timeline-detail",
  });

  return (
    <aside className="hidden h-full w-[380px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 backdrop-blur-xl xl:block">
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Selected Note</p>
            <p className="mt-1 text-sm text-[var(--color-text)]">{formatTimelineDateTime(timestamp)}</p>
          </div>
          <button type="button" onClick={onClose} className={panelButtonClass}>
            Close
          </button>
        </div>

        <div className="min-h-0 overflow-auto rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <WallNotePreview note={note} width={previewDimensions.width} height={previewDimensions.height} scale="large" tone="detail" />

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {note.tags.length > 0 ? note.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-2.5 py-1 text-[11px] text-[var(--color-text)]">#{tag}</span>
                )) : <span className="text-sm text-[var(--color-text-muted)]">No tags</span>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Timestamps</p>
              <div className="mt-2 grid gap-2 text-sm text-[var(--color-text)]">
                <p>Created: {formatTimelineDateTime(note.createdAt)}</p>
                <p>Last edited: {formatTimelineDateTime(note.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ControlTooltip label="Return to the spatial wall with this note focused" className="relative inline-flex">
            <button type="button" onClick={onReveal} className="inline-flex items-center gap-2 rounded-full border border-[#a33818] bg-[#a33818] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90">
              <Icon name="search" className="h-3.5 w-3.5" />
              <span>Reveal on Wall</span>
            </button>
          </ControlTooltip>
        </div>
      </div>
    </aside>
  );
};
