"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getImageNoteAutoHeight } from "@/components/wall/spatial/notes/note-layout";
import { deriveWallAssetRecords, mergeWallAssetRecords, resolveImageAssetUrl, resolveVideoPosterAssetUrl } from "@/features/wall/asset-records";
import type { Note, WallAssetMap } from "@/features/wall/types";
import type { WallRenderBudget, WallRenderDetailLevel } from "@/features/wall/windowing";

const defaultMaxLoadedWallImages = 72;

type UseWallNoteAssetsOptions = {
  notesById: Record<string, Note>;
  assetRecords?: WallAssetMap;
  visibleNotes: Note[];
  renderDetailLevel: WallRenderDetailLevel;
  renderBudget: WallRenderBudget;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
};

export const useWallNoteAssets = ({
  notesById,
  assetRecords,
  visibleNotes,
  renderDetailLevel,
  renderBudget,
  updateNote,
}: UseWallNoteAssetsOptions) => {
  const [loadedImagesByUrl, setLoadedImagesByUrl] = useState<Record<string, HTMLImageElement>>({});
  const [failedImagesByUrl, setFailedImagesByUrl] = useState<Record<string, true>>({});
  const imageLayoutSignatureRef = useRef<Record<string, string>>({});
  const imageAccessOrderRef = useRef<string[]>([]);

  const resolvedAssetRecords = useMemo(
    () => mergeWallAssetRecords(deriveWallAssetRecords(notesById), assetRecords),
    [assetRecords, notesById],
  );

  useEffect(() => {
    let cancelled = false;
    const urls = renderDetailLevel === "full" && renderBudget.maxDecodedMediaNotes > 0
      ? (() => {
          const nextUrls: string[] = [];
          let decodedMediaNotes = 0;
          for (const note of visibleNotes) {
            if (decodedMediaNotes >= renderBudget.maxDecodedMediaNotes) {
              break;
            }
            const noteUrls = [
              resolveImageAssetUrl(note, resolvedAssetRecords),
              note.bookmark?.metadata?.imageUrl?.trim(),
              note.bookmark?.metadata?.faviconUrl?.trim(),
              resolveVideoPosterAssetUrl(note, resolvedAssetRecords),
            ].filter((url): url is string => Boolean(url));
            if (noteUrls.length === 0) {
              continue;
            }
            decodedMediaNotes += 1;
            nextUrls.push(...noteUrls);
          }
          return [...new Set(nextUrls)];
        })()
      : [];
    const visibleUrlSet = new Set(urls);
    const maxLoadedWallImages = Math.max(18, Math.min(defaultMaxLoadedWallImages, renderBudget.maxDecodedMediaNotes * 3 || 18));

    setLoadedImagesByUrl((previous) => {
      const nextEntries = Object.entries(previous).filter(([url]) => visibleUrlSet.has(url));
      if (nextEntries.length === Object.keys(previous).length) {
        return previous;
      }
      imageAccessOrderRef.current = imageAccessOrderRef.current.filter((url) => visibleUrlSet.has(url));
      return Object.fromEntries(nextEntries);
    });

    setFailedImagesByUrl((previous) => {
      const nextEntries = Object.entries(previous).filter(([url]) => visibleUrlSet.has(url));
      return nextEntries.length === Object.keys(previous).length ? previous : Object.fromEntries(nextEntries);
    });
    const nextLoads = urls.filter((url) => !loadedImagesByUrl[url] && !failedImagesByUrl[url]);
    for (const url of nextLoads) {
      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) {
          return;
        }
        setLoadedImagesByUrl((previous) => {
          if (previous[url] === image) {
            return previous;
          }
          const next = { ...previous, [url]: image };
          imageAccessOrderRef.current = [...imageAccessOrderRef.current.filter((entry) => entry !== url), url];
          while (imageAccessOrderRef.current.length > maxLoadedWallImages) {
            const evictedUrl = imageAccessOrderRef.current.shift();
            if (!evictedUrl || visibleUrlSet.has(evictedUrl)) {
              continue;
            }
            delete next[evictedUrl];
          }
          return next;
        });
      };
      image.onerror = () => {
        if (cancelled) {
          return;
        }
        setFailedImagesByUrl((previous) => {
          if (previous[url]) {
            return previous;
          }
          return { ...previous, [url]: true };
        });
      };
      image.src = url;
    }
    return () => {
      cancelled = true;
    };
  }, [failedImagesByUrl, loadedImagesByUrl, renderBudget.maxDecodedMediaNotes, renderDetailLevel, resolvedAssetRecords, visibleNotes]);

  useEffect(() => {
    if (!renderBudget.allowImageAutoLayout) {
      imageLayoutSignatureRef.current = {};
      return;
    }

    const nextSignatures: Record<string, string> = {};

    for (const note of visibleNotes) {
      const imageUrl = resolveImageAssetUrl(note, resolvedAssetRecords);
      if (!imageUrl) {
        continue;
      }
      const image = loadedImagesByUrl[imageUrl];
      if (!image) {
        continue;
      }

      const caption = note.text.trim();
      const signature = `${imageUrl}|${note.w}|${caption}|${image.naturalWidth}x${image.naturalHeight}`;
      nextSignatures[note.id] = signature;
      if (imageLayoutSignatureRef.current[note.id] === signature) {
        continue;
      }

      const nextHeight = getImageNoteAutoHeight(note, caption, image);
      if (Math.abs(note.h - nextHeight) > 2) {
        updateNote(note.id, { h: nextHeight });
      }
    }

    imageLayoutSignatureRef.current = nextSignatures;
  }, [loadedImagesByUrl, renderBudget.allowImageAutoLayout, resolvedAssetRecords, updateNote, visibleNotes]);

  return {
    resolvedAssetRecords,
    loadedImagesByUrl,
    failedImagesByUrl,
  };
};
