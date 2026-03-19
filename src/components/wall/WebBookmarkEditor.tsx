"use client";

import { useMemo, useState } from "react";

import { WebBookmarkCard } from "@/components/wall/WebBookmarkCard";
import { normalizeBookmarkUrl } from "@/features/wall/bookmarks";
import type { Note } from "@/features/wall/types";

type WebBookmarkEditorProps = {
  editing: { id: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onSubmit: (noteId: string, url: string, options?: { force?: boolean }) => void;
  onOpenUrl: (url: string) => void;
};

const fieldClass =
  "min-w-0 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";
const buttonClass =
  "rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]";
const primaryButtonClass =
  "rounded-[1rem] border border-transparent bg-[color:rgba(0,71,83,0.94)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[color:rgba(0,71,83,0.86)] disabled:cursor-not-allowed disabled:opacity-55";

export const WebBookmarkEditor = ({ editing, editingNote, camera, toScreenPoint, onClose, onSubmit, onOpenUrl }: WebBookmarkEditorProps) => {
  const [url, setUrl] = useState(editingNote.bookmark?.url ?? "");
  const normalized = useMemo(() => normalizeBookmarkUrl(url), [url]);
  const canSubmit = normalized.length > 0;

  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 860 : window.innerHeight;
  const cardUrl = editingNote.bookmark?.metadata?.finalUrl ?? editingNote.bookmark?.normalizedUrl ?? normalized;

  return (
    <div
      className="absolute z-[48] w-[min(30rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]"
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 496))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 560))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Web Bookmark</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">Paste a URL and keep the page as a clean preview card.</h3>
        </div>
        <button type="button" onClick={onClose} className={buttonClass} data-note-edit-tags="true">
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-2">
        <input
          data-note-edit-tags="true"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSubmit) {
              event.preventDefault();
              onSubmit(editing.id, url);
            }
          }}
          className={fieldClass}
          placeholder="https://example.com/article"
          autoFocus
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onSubmit(editing.id, url)} className={primaryButtonClass} disabled={!canSubmit} data-note-edit-tags="true">
            {editingNote.bookmark?.status === "loading" ? "Fetching..." : "Fetch Preview"}
          </button>
          <button type="button" onClick={() => onSubmit(editing.id, url, { force: true })} className={buttonClass} disabled={!canSubmit} data-note-edit-tags="true">
            Refresh
          </button>
          <button type="button" onClick={() => cardUrl && onOpenUrl(cardUrl)} className={buttonClass} disabled={!cardUrl} data-note-edit-tags="true">
            Open URL
          </button>
          {!canSubmit && <span className="text-[11px] text-[var(--color-text-muted)]">Enter a valid http(s) URL.</span>}
        </div>
      </div>

      <div className="mt-4">
        <WebBookmarkCard note={editingNote} tone="detail" interactive={Boolean(cardUrl)} onOpen={() => cardUrl && onOpenUrl(cardUrl)} />
      </div>
    </div>
  );
};
