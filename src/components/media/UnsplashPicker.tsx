"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";

import type { UnsplashPhoto } from "@/lib/unsplash";
import { searchUnsplashPhotos } from "@/lib/unsplash-client";

type UnsplashPickerProps = {
  selectionMode?: "single" | "multi";
  minSelection?: number;
  maxSelection?: number;
  compact?: boolean;
  onSelectPhoto?: (photo: UnsplashPhoto) => Promise<void> | void;
  onInsertSelection?: (photos: UnsplashPhoto[]) => Promise<void> | void;
};

export const UnsplashPicker = ({
  selectionMode = "single",
  minSelection = 3,
  maxSelection = 10,
  compact = false,
  onSelectPhoto,
  onInsertSelection,
}: UnsplashPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedPhotos = useMemo(() => {
    const selectedIdSet = new Set(selectedIds);
    return results.filter((photo) => selectedIdSet.has(photo.id));
  }, [results, selectedIds]);

  const onSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter a search term.");
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const payload = await searchUnsplashPhotos(trimmed, compact ? 12 : 18);
      setResults(payload.results);
      setSelectedIds([]);
      if (!payload.results.length) {
        setError("No Unsplash images matched that search.");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unsplash search failed.");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelection = (photoId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(photoId)) {
        return previous.filter((entry) => entry !== photoId);
      }
      if (previous.length >= maxSelection) {
        return previous;
      }
      return [...previous, photoId];
    });
  };

  const handleSingleSelect = async (photo: UnsplashPhoto) => {
    if (!onSelectPhoto) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSelectPhoto(photo);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to insert image.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMultiInsert = async () => {
    if (!onInsertSelection) {
      return;
    }
    if (selectedPhotos.length < minSelection || selectedPhotos.length > maxSelection) {
      setError(`Pick ${minSelection}-${maxSelection} images for a moodboard.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onInsertSelection(selectedPhotos);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to insert moodboard.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(event) => void onSearch(event)}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Unsplash"
          className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[var(--color-text)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={searching || submitting || !query.trim()}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {selectionMode === "multi" ? (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
          <span>Select {minSelection}-{maxSelection} images for a clustered moodboard.</span>
          <span>{selectedIds.length} selected</span>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">Search Unsplash, then choose one image to insert.</p>
      )}

      {results.length > 0 ? (
        <div className="max-h-[min(60vh,38rem)] overflow-y-auto pr-1">
          <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
            {results.map((photo) => {
              const selected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`overflow-hidden rounded-[24px] border bg-white shadow-sm transition ${selected ? "border-[var(--color-focus)] ring-2 ring-[var(--color-focus)]/25" : "border-[var(--color-border)]"}`}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      if (selectionMode === "multi") {
                        toggleSelection(photo.id);
                        return;
                      }
                      void handleSingleSelect(photo);
                    }}
                    disabled={submitting}
                  >
                    <Image src={photo.urls.small} alt={photo.alt} width={photo.width} height={photo.height} unoptimized className={`w-full object-cover ${compact ? "h-28" : "h-36"}`} />
                    <div className="space-y-1 px-3 py-2.5">
                      <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{photo.alt}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Photo by {photo.user.name}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
          Search Unsplash to load results.
        </div>
      )}

      {selectionMode === "multi" ? (
        <button
          type="button"
          className="w-full rounded-2xl bg-[var(--color-text)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void handleMultiInsert()}
          disabled={submitting || selectedPhotos.length < minSelection || selectedPhotos.length > maxSelection}
        >
          {submitting ? "Inserting..." : `Insert Moodboard (${selectedPhotos.length})`}
        </button>
      ) : null}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
};
