"use client";

import { useRef, useState } from "react";

import { createVideoNoteState, getVideoPlayback, getVideoPosterUrl } from "@/features/wall/video-notes";
import { normalizeFileUrl } from "@/features/wall/file-notes";
import type { Note } from "@/features/wall/types";

type VideoNoteEditorProps = {
  editing: { id: string };
  editingNote: Note;
  camera: { x: number; y: number; zoom: number };
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  onClose: () => void;
  onSelectFile: (noteId: string, file: File) => Promise<void>;
  onSubmitUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameVideo: (noteId: string, name: string) => void;
  onOpenVideo: (noteId: string) => void;
  onDownloadVideo: (noteId: string) => void;
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

export const VideoNoteEditor = ({
  editing,
  editingNote,
  camera,
  toScreenPoint,
  onClose,
  onSelectFile,
  onSubmitUrl,
  onRenameVideo,
  onOpenVideo,
  onDownloadVideo,
}: VideoNoteEditorProps) => {
  const [mode, setMode] = useState<"upload" | "link">(editingNote.video?.source === "link" ? "link" : "upload");
  const [name, setName] = useState(editingNote.video?.name ?? "");
  const [url, setUrl] = useState(editingNote.video?.source === "link" ? (editingNote.video.url ?? "") : "");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 860 : window.innerHeight;
  const normalizedUrl = normalizeFileUrl(url);
  const previewVideo =
    mode === "link" && normalizedUrl
      ? createVideoNoteState({ ...editingNote.video, source: "link", url: normalizedUrl, name })
      : createVideoNoteState({ ...editingNote.video, name });
  const playback = getVideoPlayback(previewVideo);
  const posterUrl = getVideoPosterUrl(previewVideo);

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
    onRenameVideo(editing.id, name);
  };

  return (
    <div
      className="absolute z-[48] w-[min(40rem,calc(100vw-2rem))] rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-[var(--blur-panel)]"
      style={{
        left: `${Math.max(12, Math.min(screen.x, viewportWidth - 640))}px`,
        top: `${Math.max(12, Math.min(screen.y, viewportHeight - 760))}px`,
      }}
      data-note-edit-tags="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Video Note</p>
          <h3 className="mt-1 text-sm font-semibold text-[var(--color-text)]">Attach a local video or save a direct video link in the new editorial video shell.</h3>
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
          placeholder="Video file name"
          autoFocus={mode != "link"}
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
          <div key="video-upload-mode">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={primaryButtonClass} disabled={busy} data-note-edit-tags="true">
              {busy ? "Uploading..." : "Choose Video File"}
            </button>
            <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">MP4, WebM, MOV, and other browser-supported uploads stay local-first inside the wall snapshot.</p>
          </div>
        ) : (
          <div key="video-link-mode">
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
              placeholder="https://example.com/video.mp4"
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
              {!normalizedUrl && <span className="text-[11px] text-[var(--color-text-muted)]">Enter a valid http(s) URL.</span>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onOpenVideo(editing.id)} className={buttonClass} disabled={!editingNote.video?.url} data-note-edit-tags="true">
          Open Video
        </button>
        <button type="button" onClick={() => onDownloadVideo(editing.id)} className={buttonClass} disabled={!editingNote.video?.url} data-note-edit-tags="true">
          Download Video
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-[rgba(140,124,114,0.16)] bg-[#11120f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {playback?.kind === "direct" ? (
          <video
            src={playback.url}
            poster={posterUrl}
            className="aspect-video w-full bg-[#11120f] object-cover"
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : playback?.kind === "embed" ? (
          <iframe
            src={playback.url}
            title={previewVideo.name || "Video preview"}
            className="aspect-video w-full border-0 bg-[#11120f]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-[linear-gradient(145deg,#2a201d_0%,#684a40_38%,#a33818_100%)] text-[13px] font-semibold uppercase tracking-[0.28em] text-white/78">
            Video Preview
          </div>
        )}
      </div>
    </div>
  );
};
