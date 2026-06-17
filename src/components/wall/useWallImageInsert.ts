"use client";

import { useCallback, useEffect, useState } from "react";

import { toWorldPoint } from "@/components/wall/wall-coordinates";
import { createImageNote, updateNote } from "@/features/wall/commands";
import { createImageNoteState, IMAGE_NOTE_DEFAULTS, toImageNotePatch } from "@/features/wall/image-notes";
import { normalizeFileUrl } from "@/features/wall/file-notes";
import type { Note } from "@/features/wall/types";
import { getImageFileFromClipboard, readImageFileAsDataUrl } from "@/lib/wall-image-upload";
import { trackUnsplashDownload } from "@/lib/unsplash-client";
import type { UnsplashPhoto } from "@/lib/unsplash";

export type ImageInsertState = {
  open: boolean;
  noteId?: string;
  x?: number;
  y?: number;
};

type UseWallImageInsertOptions = {
  isTimeLocked: boolean;
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  renderSnapshotNotes: Record<string, Note>;
  renderVisibleNotes: Note[];
  occupiedNoteRects: Array<{ x: number; y: number; w: number; h: number }>;
  placeNewNote: (
    preferredCenter: { x: number; y: number },
    size?: { w: number; h: number },
    extraOccupiedRects?: Array<{ x: number; y: number; w: number; h: number }>,
  ) => { x: number; y: number };
  runHistoryGroup: (run: () => void) => void;
  selectNote: (noteId?: string) => void;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectedNoteId?: string;
  activeSelectedNoteIds: string[];
};

export const useWallImageInsert = ({
  isTimeLocked,
  camera,
  viewport,
  renderSnapshotNotes,
  renderVisibleNotes,
  occupiedNoteRects,
  placeNewNote,
  runHistoryGroup,
  selectNote,
  syncPrimarySelection,
  selectedNoteId,
  activeSelectedNoteIds,
}: UseWallImageInsertOptions) => {
  const [imageInsertState, setImageInsertState] = useState<ImageInsertState>({ open: false });

  const imageInsertTargetLabel = imageInsertState.noteId
    ? renderSnapshotNotes[imageInsertState.noteId]?.text.trim() || "the selected note"
    : "a new image note";

  const openImageInsert = useCallback(
    (noteId?: string, point?: { x: number; y: number }) => {
      if (noteId) {
        syncPrimarySelection([noteId]);
        selectNote(noteId);
      }
      setImageInsertState({ open: true, noteId, x: point?.x, y: point?.y });
    },
    [selectNote, syncPrimarySelection],
  );

  const closeImageInsert = useCallback(() => {
    setImageInsertState({ open: false });
  }, []);

  const findNoteAtWorldPoint = useCallback(
    (x: number, y: number) => {
      const ordered = [...renderVisibleNotes].reverse();
      return ordered.find((note) => x >= note.x && x <= note.x + note.w && y >= note.y && y <= note.y + note.h);
    },
    [renderVisibleNotes],
  );

  const insertImageSource = useCallback(
    (source: string, target?: { noteId?: string; x?: number; y?: number }) => {
      const sourceMode = normalizeFileUrl(source) ? "link" : "upload";
      if (target?.noteId && renderSnapshotNotes[target.noteId]) {
        const existing = renderSnapshotNotes[target.noteId];
        if (!existing) {
          return undefined;
        }
        updateNote(
          target.noteId,
          toImageNotePatch(createImageNoteState({ ...(existing.file ?? {}), source: sourceMode, url: source }), {
            caption: existing.text ?? "",
            preserveSize: true,
          }),
        );
        syncPrimarySelection([target.noteId]);
        selectNote(target.noteId);
        return target.noteId;
      }

      const fallbackPoint = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      const worldX = target?.x ?? fallbackPoint.x;
      const worldY = target?.y ?? fallbackPoint.y;
      const position = placeNewNote({ x: worldX, y: worldY }, { w: IMAGE_NOTE_DEFAULTS.width, h: IMAGE_NOTE_DEFAULTS.height });
      const noteId = createImageNote(position.x, position.y, { source: sourceMode, url: source });
      syncPrimarySelection([noteId]);
      selectNote(noteId);
      return noteId;
    },
    [camera, placeNewNote, renderSnapshotNotes, selectNote, syncPrimarySelection, viewport.h, viewport.w],
  );

  const handleImageFileInsert = useCallback(
    async (file: File, target?: { noteId?: string; x?: number; y?: number }) => {
      const dataUrl = await readImageFileAsDataUrl(file);
      insertImageSource(dataUrl, target);
    },
    [insertImageSource],
  );

  const handleImageUrlInsert = useCallback(
    async (url: string, target?: { noteId?: string; x?: number; y?: number }) => {
      try {
        new URL(url);
      } catch {
        throw new Error("Please paste a valid image URL.");
      }
      insertImageSource(url, target);
    },
    [insertImageSource],
  );

  const handleUnsplashPhotoInsert = useCallback(
    async (photo: UnsplashPhoto, target?: { noteId?: string; x?: number; y?: number }) => {
      await trackUnsplashDownload(photo.links.downloadLocation);
      insertImageSource(photo.urls.regular, target);
    },
    [insertImageSource],
  );

  const handleUnsplashMoodboardInsert = useCallback(
    async (photos: UnsplashPhoto[], target?: { noteId?: string; x?: number; y?: number }) => {
      if (photos.length < 3 || photos.length > 10) {
        throw new Error("Pick 3-10 images for a moodboard.");
      }

      const anchor = (() => {
        if (target?.noteId) {
          const note = renderSnapshotNotes[target.noteId];
          if (note) {
            return { x: note.x + note.w / 2, y: note.y + note.h / 2 };
          }
        }
        if (typeof target?.x === "number" && typeof target?.y === "number") {
          return { x: target.x, y: target.y };
        }
        return toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      })();

      const columns = photos.length <= 4 ? 2 : photos.length <= 6 ? 3 : 4;
      const gap = 28;
      const createdIds: string[] = [];
      const occupiedRects = [...occupiedNoteRects];
      runHistoryGroup(() => {
        photos.forEach((photo, index) => {
          const aspectRatio = Math.max(0.65, Math.min(1.5, photo.height / Math.max(photo.width, 1)));
          const width = columns >= 4 ? 180 : 220;
          const height = Math.round(width * aspectRatio);
          const row = Math.floor(index / columns);
          const column = index % columns;
          const rows = Math.ceil(photos.length / columns);
          const offsetX = (column - (columns - 1) / 2) * (width + gap) + (row % 2 === 0 ? 0 : 18);
          const offsetY = (row - (rows - 1) / 2) * (220 + gap) + (column % 2 === 0 ? 0 : 16);
          const finalHeight = Math.max(150, Math.min(320, height));
          const position = placeNewNote({ x: anchor.x + offsetX, y: anchor.y + offsetY }, { w: width, h: finalHeight }, occupiedRects);
          const noteId = createImageNote(position.x, position.y, { source: "link", url: photo.urls.regular });
          updateNote(noteId, { w: width, h: finalHeight });
          occupiedRects.push({ x: position.x, y: position.y, w: width, h: finalHeight });
          createdIds.push(noteId);
        });
      });

      await Promise.all(photos.map((photo) => trackUnsplashDownload(photo.links.downloadLocation)));
      if (createdIds.length > 0) {
        syncPrimarySelection(createdIds);
        selectNote(createdIds[0]);
      }
    },
    [camera, occupiedNoteRects, placeNewNote, renderSnapshotNotes, runHistoryGroup, selectNote, syncPrimarySelection, viewport.h, viewport.w],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isTimeLocked) {
        return;
      }
      const file = getImageFileFromClipboard(event.clipboardData);
      if (!file) {
        return;
      }
      event.preventDefault();
      const targetNoteId = selectedNoteId ?? activeSelectedNoteIds[0];
      const fallbackPoint = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      void handleImageFileInsert(file, targetNoteId ? { noteId: targetNoteId } : fallbackPoint);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [activeSelectedNoteIds, camera, handleImageFileInsert, isTimeLocked, selectedNoteId, viewport.h, viewport.w]);

  return {
    imageInsertState: isTimeLocked ? { open: false } : imageInsertState,
    imageInsertTargetLabel,
    openImageInsert,
    closeImageInsert,
    findNoteAtWorldPoint,
    handleImageFileInsert,
    handleImageUrlInsert,
    handleUnsplashPhotoInsert,
    handleUnsplashMoodboardInsert,
  };
};
