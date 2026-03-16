"use client";

import { useRef, useState, type DragEvent } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { Button } from "@/components/ui/Button";
import { IMAGE_UPLOAD_ACCEPT, isSupportedImageFile } from "@/lib/wall-image-upload";

type ImageInsertModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => Promise<void>;
  onSubmitUrl: (url: string) => Promise<void>;
  targetLabel?: string;
};

export const ImageInsertModal = ({ open, onClose, onSelectFile, onSubmitUrl, targetLabel }: ImageInsertModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
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
      setError("Paste a valid image URL or upload a file.");
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

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (busy) {
          return;
        }
        setError(null);
        setDragActive(false);
        onClose();
      }}
      title="Insert Image"
      description={targetLabel ? `Add or replace an image for ${targetLabel}.` : "Upload an image, drop one in, or paste a URL."}
      maxWidthClassName="max-w-2xl"
      panelClassName="overflow-hidden p-0"
      contentClassName="mt-0"
    >
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
            <Button
              className="mt-6 min-w-40"
              variant="primary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Paste Image URL</p>
          <label className="mt-3 block text-sm text-[var(--color-text)]">
            <span className="mb-2 block">Optional remote image source</span>
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

          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Clipboard</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Copy an image, then press Ctrl/Cmd + V on the wall to insert it into the selected note or create a new image card.</p>
          </div>

          {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
        </div>
      </div>
    </ModalShell>
  );
};
