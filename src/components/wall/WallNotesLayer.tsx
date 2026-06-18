"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Circle, Group, Image as KonvaImage, Line, Rect, Text } from "react-konva";
import type Konva from "konva";

import { EisenhowerMatrixNote } from "@/components/wall/EisenhowerMatrixNote";
import { parseCodeNote, tokenizeCodeLine } from "@/components/wall/codeNoteRendering";
import {
  getImageNoteAutoHeight,
} from "@/components/wall/spatial/notes/note-layout";
import {
  atelierPalette,
  colorWithAlpha,
  getContrastTextColor,
  getNoteCornerRadius,
  getNoteStrokeColor,
  resolveNoteFillColor,
} from "@/components/wall/spatial/notes/note-style";
import { WallAudioNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallAudioNoteRenderer";
import { WallBookmarkNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallBookmarkNoteRenderer";
import { WallCompactNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallCompactNoteRenderer";
import { WallFileNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallFileNoteRenderer";
import { WallImageNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallImageNoteRenderer";
import { formatJournalDateLabel } from "@/components/wall/wall-canvas-helpers";
import { deriveWallAssetRecords, mergeWallAssetRecords, resolveImageAssetUrl, resolveVideoPosterAssetUrl } from "@/features/wall/asset-records";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import { stripWikiLinkMarkup } from "@/features/wall/wall-note-view-model";
import { formatAudioDuration, getAudioNoteMeta, getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getFileNoteMetaCaps, getFileNoteTitle } from "@/features/wall/file-notes";
import { formatVideoDuration, getVideoNoteMeta, getVideoNoteTitle } from "@/features/wall/video-notes";
import type { LinkType, Note, WallAssetMap } from "@/features/wall/types";
import type { WallRenderBudget, WallRenderDetailLevel } from "@/features/wall/windowing";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };


const defaultMaxLoadedWallImages = 72;

type WallNotesLayerProps = {
  visibleNotes: Note[];
  renderDetailLevel: WallRenderDetailLevel;
  renderBudget: WallRenderBudget;
  assetRecords?: WallAssetMap;
  activeSelectedNoteIds: string[];
  selectedNoteId?: string;
  flashNoteId?: string;
  hoveredNoteId?: string;
  draggingNoteId?: string;
  resizingNoteDrafts: Record<string, ResizeDraft>;
  notesById: Record<string, Note>;
  linkingFromNoteId?: string;
  linkType: LinkType;
  isTimeLocked: boolean;
  showHeatmap: boolean;
  heatmapReferenceTs: number;
  showNoteTags: boolean;
  noteNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  dragSelectionStartRef: MutableRefObject<Record<string, { x: number; y: number }> | null>;
  dragAnchorRef: MutableRefObject<{ id: string; x: number; y: number } | null>;
  dragSingleStartRef: MutableRefObject<{ id: string; x: number; y: number; altClone: boolean } | null>;
  setHoveredNoteId: Dispatch<SetStateAction<string | undefined>>;
  setDraggingNoteId: Dispatch<SetStateAction<string | undefined>>;
  setGuideLines: Dispatch<SetStateAction<GuideLineState>>;
  setResizingNoteDrafts: Dispatch<SetStateAction<Record<string, ResizeDraft>>>;
  syncPrimarySelection: (noteIds: string[]) => void;
  selectSingleNote: (noteId: string) => void;
  toggleSelectNote: (noteId: string) => void;
  setLinkingFromNote: (noteId?: string) => void;
  setEditing: Dispatch<SetStateAction<{ id: string; text: string } | null>>;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  createLink: (fromNoteId: string, toNoteId: string, linkType: LinkType) => void;
  resolveSnappedPosition: (note: Note, candidateX: number, candidateY: number) => { x: number; y: number };
  runHistoryGroup: (action: () => void) => void;
  moveNote: (noteId: string, x: number, y: number) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  openImageInsert: (noteId: string) => void;
  toggleVocabularyFlip: (noteId: string) => void;
  duplicateNoteAt: (noteId: string, x: number, y: number) => void;
  getNoteTextStyle: (size?: Note["textSize"], textSizePx?: number) => { fontSize: number; lineHeight: number };
  getNoteTextFontFamily: (font?: Note["textFont"]) => string;
  truncateNoteText: (text: string, note: Note) => string;
  noteTagChipPalette: (noteColor: string) => { bg: string; border: string; text: string };
  recencyIntensity: (updatedAt: number, referenceTs: number, windowMs?: number) => number;
  wikiLinksByNoteId: Record<string, Array<{ targetNoteId: string; title: string }>>;
  onNavigateWikiLink: (noteId: string) => void;
  editingId?: string;
  openExternalUrl: (url: string) => void;
  onDownloadFileNote: (noteId: string) => void;
  onToggleAudioPlayback: (noteId: string) => void;
  playingAudioNoteId?: string;
  playingAudioCurrentTimeSeconds?: number;
  playingAudioDurationSeconds?: number;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  inlinePlayingVideoNoteId?: string;
  onToggleInlineVideoPlayback: (noteId: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
};

export const WallNotesLayer = ({
  visibleNotes,
  renderDetailLevel,
  renderBudget,
  assetRecords,
  activeSelectedNoteIds,
  selectedNoteId,
  flashNoteId,
  hoveredNoteId,
  draggingNoteId,
  resizingNoteDrafts,
  notesById,
  linkingFromNoteId,
  linkType,
  isTimeLocked,
  showHeatmap,
  heatmapReferenceTs,
  showNoteTags,
  noteNodeRefs,
  dragSelectionStartRef,
  dragAnchorRef,
  dragSingleStartRef,
  setHoveredNoteId,
  setDraggingNoteId,
  setGuideLines,
  setResizingNoteDrafts,
  syncPrimarySelection,
  selectSingleNote,
  toggleSelectNote,
  setLinkingFromNote,
  setEditing,
  openEditor,
  createLink,
  resolveSnappedPosition,
  runHistoryGroup,
  moveNote,
  updateNote,
  openImageInsert,
  toggleVocabularyFlip,
  duplicateNoteAt,
  getNoteTextStyle,
  getNoteTextFontFamily,
  truncateNoteText,
  noteTagChipPalette,
  recencyIntensity,
  wikiLinksByNoteId,
  onNavigateWikiLink,
  editingId,
  openExternalUrl,
  onDownloadFileNote,
  onToggleAudioPlayback,
  playingAudioNoteId,
  playingAudioCurrentTimeSeconds,
  playingAudioDurationSeconds,
  onOpenAudioNote,
  onDownloadAudioNote,
  inlinePlayingVideoNoteId,
  onToggleInlineVideoPlayback,
  onOpenVideoNote,
  onDownloadVideoNote,
}: WallNotesLayerProps) => {
  const previousColorRef = useRef<Record<string, string>>({});
  const previousTextSizeRef = useRef<Record<string, string>>({});
  const [colorWashOpacityByNote, setColorWashOpacityByNote] = useState<Record<string, number>>({});
  const [sizePulseScaleByNote, setSizePulseScaleByNote] = useState<Record<string, number>>({});
  const [loadedImagesByUrl, setLoadedImagesByUrl] = useState<Record<string, HTMLImageElement>>({});
  const [failedImagesByUrl, setFailedImagesByUrl] = useState<Record<string, true>>({});
  const resolvedAssetRecords = useMemo(
    () => mergeWallAssetRecords(deriveWallAssetRecords(notesById), assetRecords),
    [assetRecords, notesById],
  );
  const colorWashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const sizePulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const imageLayoutSignatureRef = useRef<Record<string, string>>({});
  const imageAccessOrderRef = useRef<string[]>([]);

  useEffect(() => {
    const reducedMotion = typeof document !== "undefined" && document.documentElement.classList.contains("motion-reduce");

    const runColorWash = (noteId: string) => {
      colorWashTimersRef.current[noteId]?.forEach((timer) => clearTimeout(timer));
      if (reducedMotion) {
        return;
      }
      setColorWashOpacityByNote((previous) => ({ ...previous, [noteId]: 0.24 }));
      const fadeTimer = setTimeout(() => {
        setColorWashOpacityByNote((previous) => ({ ...previous, [noteId]: 0.1 }));
      }, 90);
      const clearTimer = setTimeout(() => {
        setColorWashOpacityByNote((previous) => {
          if (previous[noteId] == null) {
            return previous;
          }
          const next = { ...previous };
          delete next[noteId];
          return next;
        });
      }, 180);
      colorWashTimersRef.current[noteId] = [fadeTimer, clearTimer];
    };

    const runSizePulse = (noteId: string) => {
      sizePulseTimersRef.current[noteId]?.forEach((timer) => clearTimeout(timer));
      if (reducedMotion) {
        return;
      }
      setSizePulseScaleByNote((previous) => ({ ...previous, [noteId]: 1.035 }));
      const settleTimer = setTimeout(() => {
        setSizePulseScaleByNote((previous) => ({ ...previous, [noteId]: 1.01 }));
      }, 95);
      const clearTimer = setTimeout(() => {
        setSizePulseScaleByNote((previous) => {
          if (previous[noteId] == null) {
            return previous;
          }
          const next = { ...previous };
          delete next[noteId];
          return next;
        });
      }, 210);
      sizePulseTimersRef.current[noteId] = [settleTimer, clearTimer];
    };

    const nextColorMap: Record<string, string> = {};
    const nextTextSizeMap: Record<string, string> = {};
    for (const note of visibleNotes) {
      nextColorMap[note.id] = note.color;
      nextTextSizeMap[note.id] = `${note.textSize ?? "md"}:${note.textSizePx ?? NOTE_DEFAULTS.textSizePx}`;
      const previousColor = previousColorRef.current[note.id];
      const previousTextSize = previousTextSizeRef.current[note.id];
      if (previousColor && previousColor !== note.color) {
        runColorWash(note.id);
      }
      if (previousTextSize && previousTextSize !== nextTextSizeMap[note.id]) {
        runSizePulse(note.id);
      }
    }
    previousColorRef.current = nextColorMap;
    previousTextSizeRef.current = nextTextSizeMap;
  }, [visibleNotes]);

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

  useEffect(() => {
    const colorWashTimers = colorWashTimersRef.current;
    const sizePulseTimers = sizePulseTimersRef.current;
    return () => {
      Object.values(colorWashTimers).forEach((timers) => timers.forEach((timer) => clearTimeout(timer)));
      Object.values(sizePulseTimers).forEach((timers) => timers.forEach((timer) => clearTimeout(timer)));
    };
  }, []);

  return (
    <>
      {visibleNotes.map((note) => {
        const isSelected = activeSelectedNoteIds.includes(note.id) || selectedNoteId === note.id;
        const isFlashing = flashNoteId === note.id;
        const isHovered = hoveredNoteId === note.id;
        const isDragging = draggingNoteId === note.id;
        const isPinned = Boolean(note.pinned);
        const isHighlighted = Boolean(note.highlighted);
        const draft = resizingNoteDrafts[note.id];
        const noteView = draft ? { ...note, ...draft } : note;
        const pulseScale = sizePulseScaleByNote[note.id] ?? 1;
        const textSpringFactor = 1 + (pulseScale - 1) * 0.7;
        const colorWashOpacity = colorWashOpacityByNote[note.id] ?? 0;
        const resolvedNoteColor = resolveNoteFillColor(noteView);
        const noteCornerRadius = getNoteCornerRadius(noteView);

        const handleSelect = (multiSelect: boolean) => {
          if (multiSelect) {
            toggleSelectNote(note.id);
          } else {
            selectSingleNote(note.id);
          }
          if (editingId !== note.id) {
            setEditing(null);
          }
        };

        const openNoteEditor = () => {
          if (isTimeLocked) {
            return;
          }
          selectSingleNote(note.id);
          if (note.vocabulary) {
            toggleVocabularyFlip(note.id);
            return;
          }
          if (noteView.noteKind === "file" || noteView.noteKind === "image") {
            openEditor(note.id, noteView.text);
            return;
          }
          if (resolveImageAssetUrl(noteView, resolvedAssetRecords)) {
            openImageInsert(note.id);
            return;
          }
          openEditor(note.id, note.text);
        };

        const groupProps = {
          ref: (node: Konva.Group | null) => {
            noteNodeRefs.current[note.id] = node;
          },
          x: noteView.x,
          y: noteView.y,
          width: noteView.w,
          height: noteView.h,
          draggable: !isTimeLocked && !isPinned,
          onMouseEnter: () => setHoveredNoteId(note.id),
          onMouseLeave: () => setHoveredNoteId((previous) => (previous === note.id ? undefined : previous)),
          onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
            if (isTimeLocked) {
              selectSingleNote(note.id);
              return;
            }
            if (linkingFromNoteId && linkingFromNoteId !== note.id) {
              createLink(linkingFromNoteId, note.id, linkType);
              setLinkingFromNote(undefined);
              return;
            }
            handleSelect(Boolean(event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey));
          },
          onTap: (event: Konva.KonvaEventObject<Event>) => {
            if (isTimeLocked) {
              selectSingleNote(note.id);
              return;
            }
            const nativeEvent = event.evt as Event & { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean };
            if (linkingFromNoteId && linkingFromNoteId !== note.id) {
              createLink(linkingFromNoteId, note.id, linkType);
              setLinkingFromNote(undefined);
              return;
            }
            handleSelect(Boolean(nativeEvent.shiftKey || nativeEvent.ctrlKey || nativeEvent.metaKey));
          },
          onDblClick: openNoteEditor,
          onDragStart: (event: Konva.KonvaEventObject<DragEvent>) => {
            if (isTimeLocked || isPinned) {
              return;
            }
            setDraggingNoteId(note.id);
            setGuideLines({});
            if (!activeSelectedNoteIds.includes(note.id)) {
              syncPrimarySelection([note.id]);
            }
            const activeIds = activeSelectedNoteIds.includes(note.id) ? activeSelectedNoteIds : [note.id];
            dragSingleStartRef.current = {
              id: note.id,
              x: note.x,
              y: note.y,
              altClone: event.evt.altKey,
            };
            if (activeIds.length > 1) {
              dragSelectionStartRef.current = Object.fromEntries(
                activeIds.flatMap((id) => {
                  const entry = notesById[id];
                  if (!entry || entry.pinned) {
                    return [];
                  }
                  return [[entry.id, { x: entry.x, y: entry.y }] as const];
                }),
              );
              dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
            }
          },
          onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
            if (isTimeLocked || isPinned) {
              return;
            }
            const start = dragSingleStartRef.current;
            const pointerX = event.target.x();
            const pointerY = event.target.y();
            let candidateX = pointerX;
            let candidateY = pointerY;
            if (start && event.evt.shiftKey) {
              const dx = Math.abs(pointerX - start.x);
              const dy = Math.abs(pointerY - start.y);
              if (dx > dy) {
                candidateY = start.y;
              } else {
                candidateX = start.x;
              }
            }
            const snapped = resolveSnappedPosition(note, candidateX, candidateY);
            event.target.position(snapped);

            const anchor = dragAnchorRef.current;
            const startMap = dragSelectionStartRef.current;
            if (!anchor || !startMap) {
              return;
            }
            const dx = snapped.x - anchor.x;
            const dy = snapped.y - anchor.y;
            let movedPeers = false;
            for (const [id, startPos] of Object.entries(startMap)) {
              if (id === note.id || notesById[id]?.pinned) {
                continue;
              }
              const peerNode = noteNodeRefs.current[id];
              if (!peerNode) {
                continue;
              }
              peerNode.position({ x: startPos.x + dx, y: startPos.y + dy });
              movedPeers = true;
            }
            if (movedPeers) {
              event.target.getLayer()?.batchDraw();
            }
          },
          onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
            if (isTimeLocked || isPinned) {
              return;
            }
            const snapped = resolveSnappedPosition(note, event.target.x(), event.target.y());
            event.target.position(snapped);
            const anchor = dragAnchorRef.current;
            const startMap = dragSelectionStartRef.current;
            if (anchor && startMap) {
              runHistoryGroup(() => {
                moveNote(note.id, snapped.x, snapped.y);
                const dx = snapped.x - anchor.x;
                const dy = snapped.y - anchor.y;
                for (const [id, startPos] of Object.entries(startMap)) {
                  if (id === note.id || notesById[id]?.pinned) {
                    continue;
                  }
                  updateNote(id, { x: startPos.x + dx, y: startPos.y + dy });
                }
              });
            } else {
              moveNote(note.id, snapped.x, snapped.y);
            }
            const dragStart = dragSingleStartRef.current;
            if (dragStart?.id === note.id && dragStart.altClone) {
              updateNote(note.id, { x: dragStart.x, y: dragStart.y });
              duplicateNoteAt(note.id, snapped.x, snapped.y);
              syncPrimarySelection([note.id]);
            }
            setDraggingNoteId(undefined);
            setGuideLines({});
            dragSelectionStartRef.current = null;
            dragAnchorRef.current = null;
            dragSingleStartRef.current = null;
          },
          onTransform: (event: Konva.KonvaEventObject<Event>) => {
            if (isTimeLocked || isPinned) {
              return;
            }
            const node = event.target;
            const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
            const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
            node.scaleX(1);
            node.scaleY(1);
            setResizingNoteDrafts((previous) => ({
              ...previous,
              [note.id]: { x: node.x(), y: node.y(), w: width, h: height },
            }));
          },
          onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
            if (isTimeLocked || isPinned) {
              return;
            }
            const node = event.target;
            const draftEntry = resizingNoteDrafts[note.id];
            const width = draftEntry?.w ?? Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
            const height = draftEntry?.h ?? Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
            const x = draftEntry?.x ?? node.x();
            const y = draftEntry?.y ?? node.y();
            node.scaleX(1);
            node.scaleY(1);
            updateNote(note.id, { x, y, w: width, h: height });
            setResizingNoteDrafts((previous) => {
              if (!previous[note.id]) {
                return previous;
              }
              const next = { ...previous };
              delete next[note.id];
              return next;
            });
          },
        };

        if (renderDetailLevel !== "full") {
          return (
            <WallCompactNoteRenderer
              key={note.id}
              note={noteView}
              renderDetailLevel={renderDetailLevel}
              groupProps={groupProps}
              cornerRadius={noteCornerRadius}
              isSelected={isSelected}
              isHovered={isHovered}
              isHighlighted={Boolean(note.highlighted)}
              isFlashing={isFlashing}
              isDragging={isDragging}
            />
          );
        }

        const noteTextStyle = getNoteTextStyle(noteView.textSize, noteView.textSizePx);
        const noteTextFontFamily = getNoteTextFontFamily(noteView.textFont);
        const vocabulary = noteView.vocabulary;
        const isVocabulary = Boolean(vocabulary);
        const isQuote = noteView.noteKind === "quote";
        const isCanon = noteView.noteKind === "canon";
        const isJournal = noteView.noteKind === "journal";
        const isEisenhower = noteView.noteKind === "eisenhower";
        const isPrivate = isPrivateNote(noteView);
        const isBookmark = noteView.noteKind === "web-bookmark";
        const isAudio = noteView.noteKind === "audio";
        const isVideo = noteView.noteKind === "video";
        const isStandardNote = !noteView.noteKind || noteView.noteKind === "standard";
        const canon = noteView.canon;
        const isVocabularyBack = Boolean(vocabulary?.flipped);
        const canonListPreview = canon?.items
          .filter((item) => item.title.trim() || item.text.trim())
          .map((item, index) => `${index + 1}. ${item.title.trim() || item.text.trim() || "Item"}`)
          .join("\n");
        const canonSinglePreview = [canon?.statement, canon?.interpretation, canon?.example]
          .map((value) => value?.trim())
          .filter(Boolean)
          .join("\n\n");
        const canonTitle = canon?.title?.trim();
        const quoteAttribution = noteView.quoteAuthor?.trim() ?? "";
        const quoteSource = noteView.quoteSource?.trim() ?? "";
        const quoteFooterLines = isQuote ? (quoteAttribution ? (quoteSource ? 2 : 1) : quoteSource ? 1 : 0) : 0;
        const quoteFooterHeight = isQuote ? (quoteFooterLines > 1 ? 40 : quoteFooterLines === 1 ? 24 : 0) : 0;
        const quoteBodyTopInset = isQuote ? 44 : 0;
        const canonTitleInset = isCanon && canonTitle ? 16 : 0;
        const journalHorizontalInset = 20;
        const textX = isQuote ? 24 : isJournal ? journalHorizontalInset : 12;
        const textWidth = Math.max(0, noteView.w - (isQuote ? 50 : isJournal ? journalHorizontalInset * 2 : 24));
        const imageUrl = resolveImageAssetUrl(noteView, resolvedAssetRecords);
        const bookmarkState = noteView.bookmark;
        const bookmarkMetadata = bookmarkState?.metadata;
        const bookmarkImageUrl = bookmarkMetadata?.imageUrl?.trim();
        const bookmarkFaviconUrl = bookmarkMetadata?.faviconUrl?.trim();
        const bookmarkImage = bookmarkImageUrl ? loadedImagesByUrl[bookmarkImageUrl] : undefined;
        const bookmarkFavicon = bookmarkFaviconUrl ? loadedImagesByUrl[bookmarkFaviconUrl] : undefined;
        const noteImage = imageUrl ? loadedImagesByUrl[imageUrl] : undefined;
        const isImageNote = Boolean(imageUrl);
        const isPaperShellNote = true;
        const baseShellFill = isStandardNote ? "#FFFFFF" : atelierPalette.paper;
        const defaultTextColor =
          isQuote || isJournal || isBookmark || isImageNote || isPrivate || isAudio ? getContrastTextColor(resolvedNoteColor) : atelierPalette.text;
        const resolvedTextColor = noteView.textColor ?? defaultTextColor;
        const paperTintOpacity = isPaperShellNote ? (isStandardNote ? 0.02 : isQuote ? 0.06 : isVocabulary ? 0.14 : 0.1) : 0;
        const imageCaption = noteView.text.trim();
        const strippedNoteText = stripWikiLinkMarkup(noteView.text);
        const noteLines = strippedNoteText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const standardTitle = isStandardNote
          ? noteLines.length > 1
            ? noteLines[0] ?? "Quick Thought"
            : noteLines.length === 1
              ? noteLines[0] ?? ""
              : "Quick Thought"
          : "";
        const standardBody = isStandardNote
          ? noteLines.length > 1
            ? noteLines.slice(1).join("\n")
            : noteLines.length === 1
              ? ""
              : "Double-click or press Enter to edit"
          : strippedNoteText;
        const looksLikeCode = /(^|\n)\s*(def |const |let |function |class |import |from |<\w)|=>|\{\s*$|console\.|return\s+/m.test(strippedNoteText);
        const fileNameMatch = strippedNoteText.match(/([\w-]+\.(pdf|docx?|txt|png|jpe?g|zip|csv|md))/i);
        const looksLikeFile = !isAudio && !isVideo && (noteView.noteKind === "file" || Boolean(fileNameMatch));
        const fileLabel = noteView.noteKind === "file" ? getFileNoteTitle(noteView.file) : fileNameMatch?.[1] ?? "Document";
        const fileMeta = noteView.noteKind === "file" ? getFileNoteMetaCaps(noteView.file) : strippedNoteText.replace(fileLabel, "").trim() || "File note";
        const audioTitle = getAudioNoteTitle(noteView.audio);
        const audioMeta = getAudioNoteMeta(noteView.audio).toUpperCase();
        const isAudioPlaying = isAudio && playingAudioNoteId === note.id;
        const audioDurationSeconds = isAudioPlaying ? playingAudioDurationSeconds ?? noteView.audio?.durationSeconds : noteView.audio?.durationSeconds;
        const audioCurrentTime = formatAudioDuration(isAudioPlaying ? playingAudioCurrentTimeSeconds : 0);
        const audioDuration = formatAudioDuration(audioDurationSeconds);
        const isInlineVideoPlaying = isVideo && inlinePlayingVideoNoteId === note.id;
        const videoTitle = getVideoNoteTitle(noteView.video);
        const videoMeta = getVideoNoteMeta(noteView.video).toUpperCase();
        const videoDuration = formatVideoDuration(noteView.video?.durationSeconds);
        const videoCurrentTime = formatVideoDuration(noteView.video?.durationSeconds ? Math.max(0, Math.round(noteView.video.durationSeconds * 0.35)) : 0);
        const videoPoster = resolveVideoPosterAssetUrl(noteView, resolvedAssetRecords);
        const loadedVideoPoster = videoPoster ? loadedImagesByUrl[videoPoster] : undefined;
        const parsedCodeNote = looksLikeCode ? parseCodeNote(noteView.text) : null;
        const renderedCodeLines = parsedCodeNote?.body.split("\n").slice(0, 8) ?? [];
        const journalTitle = noteLines[0] ?? "Dear Wall,";
        const journalBody = noteLines.slice(1).join("\n") || strippedNoteText;
        const showStandardTextCard = !isPrivate && isStandardNote && !isAudio && !isVideo && !isImageNote && !isBookmark && !isEisenhower && !looksLikeCode && !looksLikeFile && !isJournal && !isQuote && !isVocabulary;
        const wikiLinks = wikiLinksByNoteId[note.id] ?? [];
        const wikiFooterRows = wikiLinks.length > 2 ? 2 : wikiLinks.length > 0 ? 1 : 0;
        const wikiFooterHeight = wikiFooterRows > 0 ? 28 + (wikiFooterRows - 1) * 20 : 0;
        const noteTextContent = isPrivate
          ? ""
          : isBookmark
          ? ""
          : isImageNote
          ? imageCaption
          : isAudio
            ? ""
          : isVocabulary
            ? isVocabularyBack
              ? vocabulary?.meaning?.trim() || "Add meaning in Word Review"
              : vocabulary?.word?.trim() || "Add word in Word Review"
            : isCanon
              ? canon?.mode === "list"
                ? canonListPreview || "Add list items"
                : canonSinglePreview || "Add statement"
            : isQuote
              ? truncateNoteText(strippedNoteText, {
                  ...noteView,
                  text: strippedNoteText,
                  w: textWidth + 16,
                  h: Math.max(40, noteView.h - quoteFooterHeight - quoteBodyTopInset - 18 - wikiFooterHeight),
                }) || "Add quote text"
              : truncateNoteText(strippedNoteText, { ...noteView, text: strippedNoteText, h: Math.max(noteView.h - wikiFooterHeight, 40) }) || "Double-click or press Enter to edit";
        const visibleTagCount = noteView.w < 180 ? 1 : noteView.w < 240 ? 2 : 3;
        const noteTags = noteView.tags.slice(0, visibleTagCount);
        const overflowTags = Math.max(0, note.tags.length - noteTags.length);
        const tagPalette = noteTagChipPalette(resolvedNoteColor);
        const textY = isImageNote ? 0 : 12 + quoteBodyTopInset + canonTitleInset + (isJournal ? 56 : 0);
        const textHeight = isImageNote
          ? 0
          : Math.max(0, noteView.h - 56 - quoteFooterHeight - quoteBodyTopInset - canonTitleInset - (isJournal ? 56 : 0) - wikiFooterHeight);
        const journalDateLabel = isJournal ? formatJournalDateLabel(noteView.createdAt) : "";
        const journalDateWidth = Math.max(0, noteView.w - journalHorizontalInset * 2);
        const journalDateX = journalHorizontalInset;
        const decryptButtonWidth = Math.min(184, Math.max(128, noteView.w * 0.56));
        const decryptButtonX = Math.max(26, noteView.w / 2 - decryptButtonWidth / 2);
        const decryptButtonY = Math.max(noteView.h - 74, noteView.h * 0.72);


        return (
          <Group key={note.id} {...groupProps}>
            {isJournal ? (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={noteCornerRadius}
                fill={atelierPalette.paper}
                stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.terracotta })}
                strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                shadowColor={atelierPalette.paperShadow}
                shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
                shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                shadowOffsetY={isDragging ? 7 : 3}
              />
            ) : isBookmark ? (
              <WallBookmarkNoteRenderer
                note={noteView}
                bookmarkImage={bookmarkImage}
                bookmarkFavicon={bookmarkFavicon}
                isSelected={isSelected}
                isHovered={isHovered}
                isHighlighted={isHighlighted}
                isFlashing={isFlashing}
                isDragging={isDragging}
                isTimeLocked={isTimeLocked}
                openExternalUrl={openExternalUrl}
              />
            ) : isImageNote ? (
              <WallImageNoteRenderer
                note={noteView}
                imageUrl={imageUrl}
                image={noteImage}
                imageLoadFailed={Boolean(imageUrl && failedImagesByUrl[imageUrl])}
                captionFontFamily={isQuote ? "Newsreader" : noteTextFontFamily}
                accentColor={resolvedNoteColor}
                isSelected={isSelected}
                isHovered={isHovered}
                isHighlighted={isHighlighted}
                isFlashing={isFlashing}
                isDragging={isDragging}
                isTimeLocked={isTimeLocked}
                selectSingleNote={selectSingleNote}
                openEditor={openEditor}
              />
            ) : isEisenhower ? (
              <EisenhowerMatrixNote
                note={noteView}
                isSelected={isSelected}
                isHovered={isHovered}
                isDragging={isDragging}
                isFlashing={isFlashing}
                isHighlighted={isHighlighted}
                colorWashOpacity={colorWashOpacity}
                textSpringFactor={textSpringFactor}
                openEditor={openEditor}
                selectSingleNote={selectSingleNote}
                isTimeLocked={isTimeLocked}
              />
            ) : isPrivate ? (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={noteCornerRadius}
                  fill={atelierPalette.paper}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: noteView.w, y: noteView.h }}
                  fillLinearGradientColorStops={[0, "#FFFDF9", 0.55, "#FBF8F2", 1, "#F5F1EA"]}
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.forest })}
                  strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
                  shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                <Rect width={noteView.w} height={noteView.h} cornerRadius={noteCornerRadius} fill={colorWithAlpha("#FFFFFF", 0.68)} listening={false} />
                <Rect
                  x={noteView.w * 0.08}
                  y={noteView.h * 0.06}
                  width={noteView.w * 0.84}
                  height={noteView.h * 0.88}
                  cornerRadius={Math.min(30, noteCornerRadius + 8)}
                  stroke={colorWithAlpha(atelierPalette.quietText, 0.08)}
                  strokeWidth={1}
                  listening={false}
                />
                <Rect
                  x={Math.max(24, noteView.w / 2 - 38)}
                  y={Math.max(18, noteView.h * 0.11)}
                  width={76}
                  height={76}
                  cornerRadius={24}
                  fill="rgba(246, 241, 234, 0.96)"
                  stroke="rgba(140,124,114,0.12)"
                  strokeWidth={1}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={12}
                  shadowOpacity={0.06}
                  shadowOffsetY={3}
                  listening={false}
                />
                <Line
                  points={[
                    noteView.w / 2 - 12,
                    Math.max(36, noteView.h * 0.11 + 23),
                    noteView.w / 2 - 12,
                    Math.max(28, noteView.h * 0.11 + 16),
                    noteView.w / 2 + 12,
                    Math.max(28, noteView.h * 0.11 + 16),
                    noteView.w / 2 + 12,
                    Math.max(36, noteView.h * 0.11 + 23),
                  ]}
                  stroke={atelierPalette.mutedText}
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
                <Rect
                  x={noteView.w / 2 - 15}
                  y={Math.max(36, noteView.h * 0.11 + 23)}
                  width={30}
                  height={28}
                  cornerRadius={6}
                  fill={atelierPalette.mutedText}
                  listening={false}
                />
                <Circle x={noteView.w / 2} y={Math.max(48, noteView.h * 0.11 + 40)} radius={4.5} fill={atelierPalette.paper} listening={false} />
                <Text
                  x={22}
                  y={Math.max(108, noteView.h * 0.11 + 88)}
                  width={Math.max(0, noteView.w - 44)}
                  align="center"
                  fontSize={Math.max(18, Math.min(24, noteView.w * 0.11))}
                  fontFamily="Newsreader"
                  fontStyle="italic"
                  fill={atelierPalette.text}
                  text={privateNoteTitle(noteView)}
                  listening={false}
                />
                <Text
                  x={28}
                  y={Math.max(150, noteView.h * 0.11 + 134)}
                  width={Math.max(0, noteView.w - 56)}
                  align="center"
                  fontSize={Math.max(10, Math.min(12, noteView.w * 0.05))}
                  letterSpacing={2.2}
                  fill={colorWithAlpha(atelierPalette.quietText, 0.9)}
                  text="SECURED NODE"
                  listening={false}
                />
                <Rect
                  x={decryptButtonX}
                  y={decryptButtonY}
                  width={decryptButtonWidth}
                  height={40}
                  cornerRadius={20}
                  fill={colorWithAlpha("#FFFFFF", 0.74)}
                  stroke={colorWithAlpha(atelierPalette.quietText, 0.34)}
                  strokeWidth={1.6}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    selectSingleNote(note.id);
                    openEditor(note.id, note.text);
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    selectSingleNote(note.id);
                    openEditor(note.id, note.text);
                  }}
                />
                <Text
                  x={decryptButtonX}
                  y={decryptButtonY + 12}
                  width={decryptButtonWidth}
                  align="center"
                  fontSize={Math.max(11, Math.min(16, noteView.w * 0.07))}
                  letterSpacing={2.4}
                  fill={atelierPalette.text}
                  text="DECRYPT"
                  listening={false}
                />
              </>
            ) : (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={noteCornerRadius}
                  fill={baseShellFill}
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: resolvedNoteColor })}
                  strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
                  shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                {isPaperShellNote && (
                  <Rect width={noteView.w} height={noteView.h} cornerRadius={noteCornerRadius} fill={resolvedNoteColor} opacity={paperTintOpacity} listening={false} />
                )}
                {isQuote && (
                  <Rect x={0} y={0} width={4} height={noteView.h} cornerRadius={[noteCornerRadius, 0, 0, noteCornerRadius]} fill={atelierPalette.terracotta} listening={false} />
                )}
              </>
            )}
            {isHighlighted && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={noteCornerRadius}
                stroke="#fbbf24"
                strokeWidth={1.2}
                opacity={0.8}
                dash={[7, 4]}
              />
            )}
            {isPinned && (
              <Text
                x={Math.max(12, noteView.w - 42)}
                y={10}
                width={30}
                align="right"
                fontSize={10}
                fontStyle="bold"
                fill="#334155"
                text="PIN"
              />
            )}
            {showHeatmap && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={noteCornerRadius}
                fill="#ef4444"
                opacity={0.08 + recencyIntensity(noteView.updatedAt, heatmapReferenceTs) * 0.35}
              />
            )}

            {colorWashOpacity > 0 && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={noteCornerRadius}
                fill="#ffffff"
                opacity={colorWashOpacity}
              />
            )}
            {!isPrivate && !isImageNote && !isEisenhower && !isBookmark && !isJournal && !isQuote && !isAudio && !isVideo && !looksLikeCode && !looksLikeFile && !isStandardNote && (
              <Text
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                fontSize={(isJournal ? Math.max(17, noteTextStyle.fontSize) : noteTextStyle.fontSize) * textSpringFactor}
                fontFamily={isQuote ? "Newsreader" : noteTextFontFamily}
                fontStyle={isQuote ? "italic" : isCanon ? "bold" : "normal"}
                fill={resolvedTextColor}
                lineHeight={isJournal ? 1.72 : noteTextStyle.lineHeight}
                align={isVocabulary ? "center" : (noteView.textAlign ?? "left")}
                verticalAlign={noteView.textVAlign ?? NOTE_DEFAULTS.textVAlign}
                text={noteTextContent}
                onClick={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  event.cancelBubble = true;
                  selectSingleNote(note.id);
                  if (isVocabulary) {
                    toggleVocabularyFlip(note.id);
                  } else {
                    openEditor(note.id, noteView.text);
                  }
                }}
              />
            )}
            {isJournal && (
              <>
                <Text
                  x={journalDateX}
                  y={20}
                  width={journalDateWidth}
                  fontSize={10}
                  fontFamily="Newsreader"
                  fontStyle="italic"
                  fill={colorWithAlpha(atelierPalette.mutedText, 0.62)}
                  letterSpacing={1.8}
                  text={journalDateLabel.toUpperCase()}
                  listening={false}
                />
                <Text
                  x={journalHorizontalInset}
                  y={52}
                  width={Math.max(0, noteView.w - journalHorizontalInset * 2)}
                  fontSize={23}
                  fontFamily="Newsreader"
                  fontStyle="italic"
                  fill={atelierPalette.text}
                  text={journalTitle}
                  ellipsis
                  listening={false}
                />
                <Text
                  x={journalHorizontalInset}
                  y={92}
                  width={Math.max(0, noteView.w - journalHorizontalInset * 2)}
                  height={Math.max(0, noteView.h - 114)}
                  fontSize={18}
                  fontFamily="Newsreader"
                  lineHeight={1.58}
                  fill={colorWithAlpha(atelierPalette.text, 0.82)}
                  text={journalBody}
                  ellipsis
                  listening={false}
                />
              </>
            )}
            {isQuote && !isEisenhower && (
              <>
                <Text
                  x={Math.max(24, noteView.w - 54)}
                  y={14}
                  width={34}
                  align="right"
                  fontSize={38}
                  fontFamily="Newsreader"
                  fill={colorWithAlpha(atelierPalette.terracotta, 0.18)}
                  text="””"
                  listening={false}
                />
                <Text
                  x={24}
                  y={34}
                  width={Math.max(0, noteView.w - 50)}
                  height={Math.max(24, noteView.h - quoteFooterHeight - 64)}
                  fontSize={Math.max(20, Math.min(30, Math.min(noteView.w / 6.6, noteView.h / 4.6)))}
                  fontFamily="Newsreader"
                  fontStyle="italic"
                  fill={resolvedTextColor}
                  lineHeight={1.18}
                  text={noteTextContent}
                  ellipsis
                  listening={false}
                />
              </>
            )}
            {isCanon && canonTitle && !isEisenhower && (
              <Text
                x={12}
                y={13}
                width={Math.max(0, noteView.w - 24)}
                fontSize={11}
                fontStyle="bold"
                fill={resolvedTextColor}
                text={canonTitle}
                wrap="none"
                ellipsis
                listening={false}
              />
            )}
            {looksLikeCode && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={18} fill="#1E1E1E" listening={false} />
                <Rect width={noteView.w} height={noteView.h} cornerRadius={18} stroke="rgba(255,255,255,0.06)" strokeWidth={1} listening={false} />
                <Rect x={18} y={18} width={10} height={10} cornerRadius={5} fill="#FF5F56" listening={false} />
                <Rect x={34} y={18} width={10} height={10} cornerRadius={5} fill="#FFBD2E" listening={false} />
                <Rect x={50} y={18} width={10} height={10} cornerRadius={5} fill="#27C93F" listening={false} />
                <Text
                  x={Math.max(108, noteView.w - 144)}
                  y={18}
                  width={92}
                  align="right"
                  fontSize={9}
                  fontFamily="JetBrains Mono"
                  fontStyle="bold"
                  letterSpacing={1.1}
                  fill="rgba(255,255,255,0.42)"
                  text={(parsedCodeNote?.fileName ?? "main.py").toUpperCase()}
                  ellipsis
                  listening={false}
                />
                <Group x={Math.max(18, noteView.w - 48)} y={16} listening={false}>
                  <Rect x={6} y={2} width={12} height={14} cornerRadius={2} fill="rgba(255,255,255,0.14)" />
                  <Rect x={2} y={6} width={12} height={14} cornerRadius={2} fill="rgba(255,255,255,0.24)" />
                </Group>
                {renderedCodeLines.map((line, lineIndex) => {
                  const segments = tokenizeCodeLine(line, parsedCodeNote?.language ?? "plain");
                  let cursorX = 22;
                  const baseY = 64 + lineIndex * 26;
                  return (
                    <Group key={`${note.id}-code-line-${lineIndex}`} listening={false}>
                      {segments.map((segment, segmentIndex) => {
                        const fill =
                          segment.tone === "keyword" ? "#c586c0" :
                            segment.tone === "string" ? "#ce9178" :
                              segment.tone === "comment" ? "#6a9955" :
                                segment.tone === "number" ? "#b5cea8" :
                                  segment.tone === "function" ? "#dcdcaa" :
                                    segment.tone === "variable" ? "#9cdcfe" :
                                      segment.tone === "property" ? "#7fc7ff" :
                                        segment.tone === "command" ? "#4fc1ff" :
                                          "#d4d4d4";
                        const text = segment.text.replace(/\t/g, "  ");
                        const widthEstimate = text.length * 7.2;
                        const node = (
                          <Text
                            key={`${note.id}-code-line-${lineIndex}-segment-${segmentIndex}`}
                            x={cursorX}
                            y={baseY}
                            fontSize={12}
                            fontFamily="JetBrains Mono"
                            lineHeight={1.45}
                            fill={fill}
                            text={text}
                          />
                        );
                        cursorX += widthEstimate;
                        return node;
                      })}
                    </Group>
                  );
                })}
              </>
            )}
            {isAudio && (
              <WallAudioNoteRenderer
                note={noteView}
                title={audioTitle}
                meta={audioMeta}
                currentTime={audioCurrentTime}
                duration={audioDuration}
                isPlaying={isAudioPlaying}
                playingCurrentTimeSeconds={playingAudioCurrentTimeSeconds}
                isTimeLocked={isTimeLocked}
                onToggleAudioPlayback={onToggleAudioPlayback}
                onOpenAudioNote={onOpenAudioNote}
                onDownloadAudioNote={onDownloadAudioNote}
              />
            )}
            {isVideo && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={22} fill={atelierPalette.paper} stroke={colorWithAlpha(atelierPalette.quietText, 0.14)} strokeWidth={1} listening={false} />
                <Group x={18} y={18}>
                  <Rect
                    width={Math.max(0, noteView.w - 36)}
                    height={Math.max(0, noteView.h - 124)}
                    cornerRadius={18}
                    fill="rgba(0,0,0,0.001)"
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                    }}
                    onTouchStart={(event) => {
                      event.cancelBubble = true;
                    }}
                    onClick={(event) => {
                      if (isTimeLocked) {
                        return;
                      }
                      event.cancelBubble = true;
                      onToggleInlineVideoPlayback(note.id);
                    }}
                    onTap={(event) => {
                      if (isTimeLocked) {
                        return;
                      }
                      event.cancelBubble = true;
                      onToggleInlineVideoPlayback(note.id);
                    }}
                  />
                  <Rect width={Math.max(0, noteView.w - 36)} height={Math.max(0, noteView.h - 124)} cornerRadius={18} fill="#11120f" listening={false} />
                  {loadedVideoPoster ? (
                    <KonvaImage
                      image={loadedVideoPoster}
                      x={0}
                      y={0}
                      width={Math.max(0, noteView.w - 36)}
                      height={Math.max(0, noteView.h - 124)}
                      cornerRadius={18}
                      listening={false}
                    />
                  ) : null}
                  <Rect width={Math.max(0, noteView.w - 36)} height={Math.max(0, noteView.h - 124)} cornerRadius={18} fill={isInlineVideoPlaying ? "rgba(17,18,15,0.08)" : "rgba(17,18,15,0.16)"} listening={false} />
                  {!isInlineVideoPlaying ? (
                    <>
                      <Rect x={Math.max(18, (noteView.w - 102) / 2)} y={Math.max(18, (noteView.h - 124) / 2 - 26)} width={66} height={66} cornerRadius={20} fill={colorWithAlpha(atelierPalette.terracotta, 0.9)} shadowColor="rgba(0,0,0,0.24)" shadowBlur={14} shadowOffsetY={6} listening={false} />
                      <Line points={[Math.max(43, (noteView.w - 102) / 2 + 26), Math.max(33, (noteView.h - 124) / 2 - 8), Math.max(43, (noteView.w - 102) / 2 + 26), Math.max(33, (noteView.h - 124) / 2 + 20), Math.max(67, (noteView.w - 102) / 2 + 48), Math.max(33, (noteView.h - 124) / 2 + 6)]} closed fill="#fffaf4" listening={false} />
                    </>
                  ) : (
                    <>
                      <Rect x={20} y={20} width={74} height={24} cornerRadius={12} fill="rgba(17,18,15,0.56)" listening={false} />
                      <Text x={20} y={27} width={74} align="center" fontSize={10} fontStyle="bold" letterSpacing={1.4} fill="rgba(255,250,244,0.92)" text="PLAYING" listening={false} />
                    </>
                  )}
                  <Text x={20} y={Math.max(18, noteView.h - 120)} width={72} fontSize={12} fontFamily="JetBrains Mono" fill="rgba(255,250,244,0.88)" text={videoCurrentTime} listening={false} />
                  <Rect x={Math.max(92, noteView.w * 0.22)} y={Math.max(18, noteView.h - 115)} width={Math.max(56, noteView.w - 184)} height={6} cornerRadius={3} fill="rgba(255,255,255,0.24)" listening={false} />
                  <Rect x={Math.max(92, noteView.w * 0.22)} y={Math.max(18, noteView.h - 115)} width={Math.max(28, Math.max(56, noteView.w - 184) * 0.36)} height={6} cornerRadius={3} fill={atelierPalette.terracotta} listening={false} />
                  <Text x={Math.max(0, noteView.w - 108)} y={Math.max(18, noteView.h - 120)} width={72} align="right" fontSize={12} fontFamily="JetBrains Mono" fill="rgba(255,250,244,0.88)" text={videoDuration} listening={false} />
                </Group>
                <Text x={22} y={Math.max(0, noteView.h - 84)} width={Math.max(0, noteView.w - 92)} fontSize={Math.max(18, Math.min(25, noteView.w / 11.5))} fontFamily="Newsreader" fontStyle="italic" fill={atelierPalette.text} text={videoTitle} ellipsis listening={false} />
                {videoMeta ? <Text x={22} y={Math.max(0, noteView.h - 50)} width={Math.max(0, noteView.w - 96)} fontSize={10} letterSpacing={1.2} fill={colorWithAlpha(atelierPalette.quietText, 0.76)} text={videoMeta} ellipsis listening={false} /> : null}
                <Group x={Math.max(18, noteView.w - 54)} y={Math.max(0, noteView.h - 56)} onClick={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onDownloadVideoNote(note.id); }} onTap={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onDownloadVideoNote(note.id); }}>
                  <Text x={0} y={0} width={16} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text="↓" listening={false} />
                </Group>
                <Group x={Math.max(42, noteView.w - 30)} y={Math.max(0, noteView.h - 56)} onClick={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onOpenVideoNote(note.id); }} onTap={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onOpenVideoNote(note.id); }}>
                  <Text x={0} y={0} width={16} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text="↗" listening={false} />
                </Group>
              </>
            )}
            {looksLikeFile && (
              <WallFileNoteRenderer
                note={noteView}
                label={fileLabel}
                meta={fileMeta}
                isTimeLocked={isTimeLocked}
                onDownloadFileNote={onDownloadFileNote}
              />
            )}
            {showStandardTextCard && (
              <>
                <Text
                  x={20}
                  y={20}
                  width={Math.max(0, noteView.w - 40)}
                  fontSize={16}
                  fontFamily={noteTextFontFamily}
                  fontStyle="bold"
                  fill={atelierPalette.text}
                  text={standardTitle}
                  ellipsis
                  listening={false}
                />
                {standardBody && (
                  <Text
                    x={20}
                    y={50}
                    width={Math.max(0, noteView.w - 40)}
                    height={Math.max(0, noteView.h - 70 - wikiFooterHeight)}
                    fontSize={15}
                    fontFamily={noteTextFontFamily}
                    lineHeight={1.58}
                    fill={atelierPalette.mutedText}
                    text={standardBody}
                    ellipsis
                    listening={false}
                  />
                )}
              </>
            )}
            {isQuote && (quoteAttribution || quoteSource) && !isEisenhower && (
              <>
                {quoteAttribution && (
                  <Text
                    x={24}
                    y={Math.max(12, noteView.h - (quoteFooterLines > 1 ? 38 : 24))}
                    width={Math.max(0, noteView.w - 48)}
                    fontSize={10}
                    fontStyle="bold"
                    fill={colorWithAlpha(atelierPalette.forest, 0.82)}
                    letterSpacing={1.6}
                    text={`- ${quoteAttribution.toUpperCase()}`}
                    wrap="none"
                    ellipsis
                    listening={false}
                  />
                )}
                {quoteSource && (
                  <Text
                    x={24}
                    y={Math.max(12, noteView.h - 20)}
                    width={Math.max(0, noteView.w - 48)}
                    fontSize={9}
                    fill={colorWithAlpha(atelierPalette.mutedText, 0.68)}
                    letterSpacing={1.1}
                    text={quoteSource.toUpperCase()}
                    wrap="none"
                    ellipsis
                    listening={false}
                  />
                )}
              </>
            )}
            {wikiLinks.length > 0 && !isImageNote && !isVocabulary && !isEisenhower && !isBookmark && (
              <>
                {wikiLinks.slice(0, 4).map((wikiLink, index) => {
                  const column = index % 2;
                  const row = Math.floor(index / 2);
                  const chipWidth = Math.max(74, Math.min((noteView.w - 30) / 2, 112));
                  const x = 12 + column * (chipWidth + 8);
                  const y = Math.max(12, noteView.h - 28 - row * 20 - (showNoteTags ? 20 : 0));
                  return (
                    <Group
                      key={`${note.id}-wiki-${wikiLink.targetNoteId}`}
                      onClick={(event) => {
                        if (isTimeLocked) {
                          return;
                        }
                        event.cancelBubble = true;
                        onNavigateWikiLink(wikiLink.targetNoteId);
                      }}
                      onTap={(event) => {
                        if (isTimeLocked) {
                          return;
                        }
                        event.cancelBubble = true;
                        onNavigateWikiLink(wikiLink.targetNoteId);
                      }}
                    >
                      <Rect
                        x={x}
                        y={y}
                        width={chipWidth}
                        height={16}
                        cornerRadius={8}
                        fill="rgba(248,250,252,0.9)"
                        stroke="rgba(100,116,139,0.55)"
                        strokeWidth={0.8}
                      />
                      <Text
                        x={x + 7}
                        y={y + 2}
                        width={chipWidth - 14}
                        fontSize={10}
                        fontStyle="bold"
                        fill="#475569"
                        text={wikiLink.title}
                        wrap="none"
                        ellipsis
                      />
                    </Group>
                  );
                })}
              </>
            )}


            {isVocabulary && (
              <Text
                x={12}
                y={Math.max(10, noteView.h - 23)}
                width={Math.max(0, noteView.w - 24)}
                align="center"
                fontSize={10}
                fontStyle="bold"
                fill="#FFFFFF"
                text={isVocabularyBack ? "Back • Tap to flip" : "Front • Tap to flip"}
                onClick={(event) => {
                  if (isTimeLocked) {
                    return;
                  }
                  event.cancelBubble = true;
                  toggleVocabularyFlip(note.id);
                }}
              />
            )}
            {showNoteTags && !isPrivate && !isImageNote && !isEisenhower && !isVideo &&
              noteTags.map((tag, index) => (
                <Group key={`${note.id}-tag-${tag}`}>
                  <Rect
                    x={12 + index * 64}
                    y={Math.max(10, noteView.h - 25)}
                    width={60}
                    height={16}
                    cornerRadius={8}
                    fill={tagPalette.bg}
                    stroke={tagPalette.border}
                    strokeWidth={0.8}
                  />
                  <Text
                    x={16 + index * 64}
                    y={Math.max(12, noteView.h - 23)}
                    width={52}
                    fontSize={10}
                    fill={tagPalette.text}
                    text={`#${tag}`}
                    wrap="none"
                    ellipsis
                  />
                </Group>
              ))}
            {showNoteTags && !isPrivate && !isImageNote && !isEisenhower && !isVideo && overflowTags > 0 && (
              <Text
                x={Math.max(12, noteView.w - 36)}
                y={Math.max(12, noteView.h - 23)}
                width={24}
                align="right"
                fontSize={10}
                fill={tagPalette.text}
                text={`+${overflowTags}`}
              />
            )}
          </Group>
        );
      })}
    </>
  );
};
