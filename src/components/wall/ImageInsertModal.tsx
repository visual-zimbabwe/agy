"use client";

import { useRef, useState, type DragEvent } from "react";

import { UnsplashPicker } from "@/components/media/UnsplashPicker";
import { ModalShell } from "@/components/ui/ModalShell";
import { Button } from "@/components/ui/Button";
import type { UnsplashPhoto } from "@/lib/unsplash";
import { IMAGE_UPLOAD_ACCEPT, isSupportedImageFile } from "@/lib/wall-image-upload";

type ImageInsertModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => Promise<void>;
  onSubmitUrl: (url: string) => Promise<void>;
  onSelectUnsplashPhoto: (photo: UnsplashPhoto) => Promise<void>;
  onInsertUnsplashMoodboard?: (photos: UnsplashPhoto[]) => Promise<void>;
  targetLabel?: string;
  allowMoodboard?: boolean;
};

type ImageInsertTab = "upload" | "url" | "unsplash";
type UnsplashInsertMode = "single" | "moodboard";

export const ImageInsertModal = ({
  open,
  onClose,
  onSelectFile,
  onSubmitUrl,
  onSelectUnsplashPhoto,
  onInsertUnsplashMoodboard,
  targetLabel,
  allowMoodboard = false,
}: ImageInsertModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<ImageInsertTab>("upload");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [unsplashMode, setUnsplashMode] = useState<UnsplashInsertMode>("single");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) {
      return;
    }
    if (!isSupportedImageFile(file)) {
      setError("Use a PNG, JPG, JPEG, WEBP, or GIF image.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSelectFile(file);
      setUrl("");
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to insert image.");
    } finally {
      setBusy(false);
      setDragActive(false);
    }
  };

  const handleUrlSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a valid image URL or search Unsplash.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmitUrl(trimmed);
      setUrl("");
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to insert image.");
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    await handleFile(event.dataTransfer.files[0]);
  };

  const closeModal = () => {
    if (busy) {
      return;
    }
    setError(null);
    setDragActive(false);
    setTab("upload");
    setUnsplashMode("single");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={closeModal}
      title="Insert Image"
      description={targetLabel ? `Add or replace an image for ${targetLabel}.` : "Upload an image, paste a URL, or search Unsplash."}
      maxWidthClassName="max-w-4xl"
      panelClassName="overflow-hidden p-0"
      contentClassName="mt-0"
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 md:px-6">
        <div className="flex flex-wrap gap-2">
          {([
            ["upload", "Upload"],
            ["url", "Paste URL"],
            ["unsplash", "Unsplash"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm transition ${tab === value ? "bg-[var(--color-text)] text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)]"}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "upload" ? (
        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-[var(--color-border)] bg-[linear-gradient(160deg,rgba(247,244,235,0.96),rgba(255,255,255,0.98))] p-5 md:border-b-0 md:border-r md:p-6">
            <div
              className={`rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-colors ${dragActive ? "border-[var(--color-accent-strong)] bg-[rgba(255,248,232,0.92)]" : "border-[var(--color-border)] bg-white/80"}`}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(event) => {
                void handleDrop(event);
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Upload From Computer</p>
              <h3 className="mt-3 font-[Georgia] text-2xl text-[var(--color-text)]">Drag an image here</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">PNG, JPG, JPEG, WEBP, or GIF. The wall stores a local preview immediately.</p>
              <Button className="mt-6 min-w-40" variant="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
                {busy ? "Uploading..." : "Select File"}
              </Button>
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">Drag onto the canvas to create a new image note, or onto a note to replace its image.</p>
              <input
                ref={inputRef}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Clipboard</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Copy an image, then press Ctrl/Cmd + V on the wall to insert it into the selected note or create a new image card.</p>
            {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
          </div>
        </div>
      ) : null}

      {tab === "url" ? (
        <div className="bg-[var(--color-surface)] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Paste Image URL</p>
          <label className="mt-3 block text-sm text-[var(--color-text)]">
            <span className="mb-2 block">Remote image source</span>
            <input
              autoFocus
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1"
            />
          </label>
          <Button className="mt-3 w-full" onClick={() => void handleUrlSubmit()} disabled={busy || !url.trim()}>
            Insert From URL
          </Button>
          {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
        </div>
      ) : null}

      {tab === "unsplash" ? (
        <div className="bg-[var(--color-surface)] p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Unsplash Search</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Search photos and insert one image or a clustered moodboard.</p>
            </div>
            {allowMoodboard ? (
              <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1 text-xs">
                {(["single", "moodboard"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`rounded-full px-2.5 py-1 font-medium transition ${unsplashMode === mode ? "bg-white text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}
                    onClick={() => setUnsplashMode(mode)}
                  >
                    {mode === "single" ? "Single" : "Moodboard"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <UnsplashPicker
            selectionMode={allowMoodboard && unsplashMode === "moodboard" ? "multi" : "single"}
            onSelectPhoto={async (photo) => {
              await onSelectUnsplashPhoto(photo);
              onClose();
            }}
            onInsertSelection={
              allowMoodboard && onInsertUnsplashMoodboard
                ? async (photos) => {
                    await onInsertUnsplashMoodboard(photos);
                    onClose();
                  }
                : undefined
            }
          />
          {allowMoodboard ? <p className="mt-3 text-xs text-[var(--color-text-muted)]">Use Single to insert one image note or Moodboard to place 3-10 images as a clustered board.</p> : null}
        </div>
      ) : null}
    </ModalShell>
  );
};

