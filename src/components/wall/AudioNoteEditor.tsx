"use client";

import { useRef, useState } from "react";

import { WallNotePreview } from "@/components/wall/WallNotePreview";
import { createAudioNoteState } from "@/features/wall/audio-notes";
import { normalizeFileUrl } from "@/features/wall/file-notes";
import type { Note } from "@/features/wall/types";

type AudioNoteEditorProps = {
  editing: { id: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onSelectFile: (noteId: string, file: File) => Promise<void>;
  onSubmitUrl: (noteId: string, url: string) => void;
  onRenameAudio: (noteId: string, name: string) => void;
  onOpenAudio: (noteId: string) => void;
  onDownloadAudio: (noteId: string) => void;
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

export const AudioNoteEditor = ({
  editing,
  editingNote,
  camera,
  toScreenPoint,
  onClose,
  onSelectFile,
  onSubmitUrl,
  onRenameAudio,
  onOpenAudio,
  onDownloadAudio,
}: AudioNoteEditorProps) => {
  const [mode, setMode] = useState<"upload" | "link">(editingNote.audio?.source === "link" ? "link" : "upload");
  const [name, setName] = useState(editingNote.audio?.name ?? "");
  const [url, setUrl] = useState(editingNote.audio?.source === "link" ? editingNote.audio.url : "");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 860 : window.innerHeight;
  const normalizedUrl = normalizeFileUrl(url);
  const previewNote =
    mode === "link" && normalizedUrl
      ? {
          ...editingNote,
          noteKind: "audio" as const,
          audio: createAudioNoteState({ ...editingNote.audio, source: "link", url: normalizedUrl, name }),
        }
      : {
          ...editingNote,
          noteKind: "audio" as const,
          audio: createAudioNoteState({ ...editingNote.audio, name }),
        };

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

  const commitName = () => {
    onRenameAudio(editing.id, name);
  };

  return (
    <div
      className="absolute z-[48] w-[min(34rem,calc(100vw-2rem))] rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]"
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 560))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 720))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Audio Note</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">Attach audio from your device or save a streaming/download link in the new audio shell.</h3>
        </div>
        <button type="button" onClick={onClose} className={buttonClass} data-note-edit-tags="true">
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          data-note-edit-tags="true"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitName();
            }
          }}
          className={fieldClass}
          placeholder="Audio title"
          autoFocus={mode !== "link"}
        />
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
              accept="audio/*"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={primaryButtonClass} disabled={busy} data-note-edit-tags="true">
              {busy ? "Uploading..." : "Choose Audio File"}
            </button>
            <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">MP3, WAV, M4A, OGG, and other browser-supported audio uploads stay local-first inside the wall snapshot.</p>
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
              placeholder="https://example.com/audio.mp3"
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
        <button type="button" onClick={() => onOpenAudio(editing.id)} className={buttonClass} disabled={!editingNote.audio?.url} data-note-edit-tags="true">
          Open Audio
        </button>
        <button type="button" onClick={() => onDownloadAudio(editing.id)} className={buttonClass} disabled={!editingNote.audio?.url} data-note-edit-tags="true">
          Download Audio
        </button>
      </div>

      <div className="mt-4">
        <WallNotePreview note={previewNote} width={Math.max(320, editingNote.w)} height={Math.max(220, editingNote.h)} scale="medium" tone="detail" />
      </div>
    </div>
  );
};
