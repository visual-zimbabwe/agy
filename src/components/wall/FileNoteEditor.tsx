"use client";

import { useRef, useState } from "react";

import { WallNotePreview } from "@/components/wall/WallNotePreview";
import { createFileNoteState, normalizeFileUrl } from "@/features/wall/file-notes";
import type { Note } from "@/features/wall/types";

type FileNoteEditorProps = {
  editing: { id: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onSelectFile: (noteId: string, file: File) => Promise<void>;
  onSubmitUrl: (noteId: string, url: string) => void;
  onOpenFile: (noteId: string) => void;
  onDownloadFile: (noteId: string) => void;
};

const fieldClass =
  "min-w-0 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";
const buttonClass =
  "rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClass =
  "rounded-[1rem] border border-transparent bg-[#a33818] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8d2f13] disabled:cursor-not-allowed disabled:opacity-55";
const tabClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#a33818]/20 bg-[#f4e8dc] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a33818]"
    : "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]";

export const FileNoteEditor = ({ editing, editingNote, camera, toScreenPoint, onClose, onSelectFile, onSubmitUrl, onOpenFile, onDownloadFile }: FileNoteEditorProps) => {
  const [mode, setMode] = useState<"upload" | "link">(editingNote.file?.source === "link" ? "link" : "upload");
  const [url, setUrl] = useState(editingNote.file?.source === "link" ? editingNote.file.url : "");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 860 : window.innerHeight;
  const normalizedUrl = normalizeFileUrl(url);
  const previewNote = mode === "link" && normalizedUrl
    ? { ...editingNote, noteKind: "file" as const, file: createFileNoteState({ source: "link", url: normalizedUrl }) }
    : editingNote;

  const handleFile = async (file?: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      await onSelectFile(editing.id, file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="absolute z-[48] w-[min(32rem,calc(100vw-2rem))] rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]"
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 520))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 620))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">File Note</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">Attach a local file or keep a document link in the new file-note shell.</h3>
        </div>
        <button type="button" onClick={onClose} className={buttonClass} data-note-edit-tags="true">
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("upload")} className={tabClass(mode === "upload")} data-note-edit-tags="true">
          Upload
        </button>
        <button type="button" onClick={() => setMode("link")} className={tabClass(mode === "link")} data-note-edit-tags="true">
          Paste URL
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {mode === "upload" ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={primaryButtonClass} disabled={busy} data-note-edit-tags="true">
              {busy ? "Uploading..." : "Choose File"}
            </button>
            <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">Stored uploads stay local-first in the wall snapshot. Drag/drop support can be added later without changing the file note model.</p>
          </>
        ) : (
          <>
            <input
              data-note-edit-tags="true"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizedUrl) {
                  event.preventDefault();
                  onSubmitUrl(editing.id, normalizedUrl);
                }
              }}
              className={fieldClass}
              placeholder="https://example.com/document.pdf"
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onSubmitUrl(editing.id, normalizedUrl)} className={primaryButtonClass} disabled={!normalizedUrl} data-note-edit-tags="true">
                Save Link
              </button>
              <button
                type="button"
                onClick={async () => {
                  const clipboardText = await navigator.clipboard.readText();
                  setUrl(clipboardText);
                }}
                className={buttonClass}
                data-note-edit-tags="true"
              >
                Paste Clipboard
              </button>
              {!normalizedUrl && <span className="text-[11px] text-[var(--color-text-muted)]">Enter a valid http(s) URL.</span>}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onOpenFile(editing.id)} className={buttonClass} disabled={!editingNote.file?.url} data-note-edit-tags="true">
          Open
        </button>
        <button type="button" onClick={() => onDownloadFile(editing.id)} className={buttonClass} disabled={!editingNote.file?.url} data-note-edit-tags="true">
          Download
        </button>
      </div>

      <div className="mt-4">
        <WallNotePreview note={previewNote} width={Math.max(280, editingNote.w)} height={Math.max(112, editingNote.h)} scale="medium" tone="detail" />
      </div>
    </div>
  );
};
