"use client";

import { useRef, useState } from "react";

import { WallNotePreview } from "@/components/wall/WallNotePreview";
import { createImageNoteState, getImageNoteFilename } from "@/features/wall/image-notes";
import { normalizeFileUrl } from "@/features/wall/file-notes";
import type { Note } from "@/features/wall/types";

type ImageNoteEditorProps = {
  editing: { id: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onSelectFile: (noteId: string, file: File) => Promise<void>;
  onSubmitUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameImage: (noteId: string, name: string) => void;
  onUpdateCaption: (noteId: string, caption: string) => void;
  onOpenImage: (noteId: string) => void;
  onDownloadImage: (noteId: string) => void;
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

export const ImageNoteEditor = ({
  editing,
  editingNote,
  camera,
  toScreenPoint,
  onClose,
  onSelectFile,
  onSubmitUrl,
  onRenameImage,
  onUpdateCaption,
  onOpenImage,
  onDownloadImage,
}: ImageNoteEditorProps) => {
  const [mode, setMode] = useState<"upload" | "link">(editingNote.file?.source === "link" ? "link" : "upload");
  const [name, setName] = useState(getImageNoteFilename(editingNote.file));
  const [caption, setCaption] = useState(editingNote.text ?? "");
  const [url, setUrl] = useState(editingNote.file?.source === "link" ? editingNote.file.url : editingNote.imageUrl ?? "");
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
          noteKind: "image" as const,
          text: caption,
          imageUrl: normalizedUrl,
          file: createImageNoteState({ ...editingNote.file, source: "link", url: normalizedUrl, name }),
        }
      : {
          ...editingNote,
          noteKind: "image" as const,
          text: caption,
          file: createImageNoteState({ ...editingNote.file, name }),
        };

  const handleFile = async (file?: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      await onSelectFile(editing.id, file);
      setName(file.name);
    } finally {
      setBusy(false);
    }
  };

  const commitName = () => {
    onRenameImage(editing.id, name);
  };

  const commitCaption = () => {
    onUpdateCaption(editing.id, caption);
  };

  return (
    <div
      className="absolute z-[48] w-[min(38rem,calc(100vw-2rem))] rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]"
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 608))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 760))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Image Note</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">Attach a local image or keep a direct image link in the new editorial image shell.</h3>
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
          placeholder="Image file name"
          autoFocus={mode !== "link"}
        />
        <textarea
          data-note-edit-tags="true"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          onBlur={commitCaption}
          className={`${fieldClass} min-h-20 resize-none`}
          placeholder="Caption"
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
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={primaryButtonClass} disabled={busy} data-note-edit-tags="true">
              {busy ? "Uploading..." : "Choose Image File"}
            </button>
            <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">PNG, JPG, JPEG, WEBP, GIF, and other browser-supported image uploads stay local-first inside the wall snapshot.</p>
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
                  void onSubmitUrl(editing.id, normalizedUrl);
                }
              }}
              className={fieldClass}
              placeholder="https://example.com/image.jpg"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void onSubmitUrl(editing.id, normalizedUrl)} className={primaryButtonClass} disabled={!normalizedUrl} data-note-edit-tags="true">
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
              {!normalizedUrl && <span className="text-[11px] text-[var(--color-text-muted)]">Enter a valid http(s) image URL.</span>}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onOpenImage(editing.id)} className={buttonClass} disabled={!editingNote.imageUrl} data-note-edit-tags="true">
          Open Image
        </button>
        <button type="button" onClick={() => onDownloadImage(editing.id)} className={buttonClass} disabled={!editingNote.imageUrl} data-note-edit-tags="true">
          Download Image
        </button>
      </div>

      <div className="mt-4">
        <WallNotePreview note={previewNote} width={Math.max(360, editingNote.w)} height={Math.max(420, editingNote.h)} scale="medium" tone="detail" />
      </div>
    </div>
  );
};
