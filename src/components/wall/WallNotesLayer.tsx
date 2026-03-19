"use client";

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Group, Image as KonvaImage, Line, Rect, Text } from "react-konva";
import type Konva from "konva";

import { EisenhowerMatrixNote } from "@/components/wall/EisenhowerMatrixNote";
import { formatJournalDateLabel } from "@/components/wall/wall-canvas-helpers";
import { inferBookmarkKindLabel, resolveBookmarkDisplaySize, WEB_BOOKMARK_ACCENT } from "@/features/wall/bookmarks";
import { CURRENCY_NOTE_TITLE, isCurrencyNote, parseCurrencyAmountInput } from "@/features/wall/currency";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { jokerLoadingText } from "@/features/wall/joker";
import type { LinkType, Note } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };

const buildJournalPagePoints = (width: number, height: number) => [10, 0, width - 18, 0, width, 14, width - 5, height - 16, width - 24, height, 20, height, 0, height - 12, 0, 10];

const estimateJournalDateWidth = (label: string, fontSize: number) => Math.max(92, label.length * fontSize * 0.52);

const IMAGE_NOTE_PADDING = 6;
const IMAGE_NOTE_RADIUS = 16;
const IMAGE_NOTE_CAPTION_GAP = 8;
const IMAGE_NOTE_CAPTION_FONT_SIZE = 12;
const IMAGE_NOTE_CAPTION_LINE_HEIGHT = 1.28;
const IMAGE_NOTE_CAPTION_MAX_LINES = 3;

const estimateImageCaptionHeight = (noteWidth: number, caption: string) => {
  const trimmed = caption.trim();
  if (!trimmed) {
    return 0;
  }
  const innerWidth = Math.max(72, noteWidth - 24);
  const approxCharsPerLine = Math.max(16, Math.floor(innerWidth / 7));
  const lines = Math.min(IMAGE_NOTE_CAPTION_MAX_LINES, Math.max(1, Math.ceil(trimmed.length / approxCharsPerLine)));
  return Math.ceil(lines * IMAGE_NOTE_CAPTION_FONT_SIZE * IMAGE_NOTE_CAPTION_LINE_HEIGHT + 18);
};

const getImageNoteAutoHeight = (note: Pick<Note, "w" | "text">, image?: HTMLImageElement) => {
  const availableWidth = Math.max(1, note.w - IMAGE_NOTE_PADDING * 2);
  const captionHeight = estimateImageCaptionHeight(note.w, note.text);
  const captionGap = captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0;
  const fallbackHeight = availableWidth * 0.7;

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + fallbackHeight + captionGap + captionHeight));
  }

  const intrinsicHeight = image.naturalHeight * (availableWidth / image.naturalWidth);
  return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + intrinsicHeight + captionGap + captionHeight));
};

const getContainedImageLayout = (note: Pick<Note, "w" | "h" | "text">, image?: HTMLImageElement) => {
  const captionHeight = estimateImageCaptionHeight(note.w, note.text);
  const captionGap = captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0;
  const availableWidth = Math.max(1, note.w - IMAGE_NOTE_PADDING * 2);
  const availableHeight = Math.max(1, note.h - IMAGE_NOTE_PADDING * 2 - captionHeight - captionGap);

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return {
      captionHeight,
      imageX: IMAGE_NOTE_PADDING,
      imageY: IMAGE_NOTE_PADDING,
      imageWidth: availableWidth,
      imageHeight: availableHeight,
    };
  }

  const widthRatio = availableWidth / image.naturalWidth;
  const heightRatio = availableHeight / image.naturalHeight;
  const scale = Math.min(widthRatio, heightRatio);
  const imageWidth = Math.max(1, image.naturalWidth * scale);
  const imageHeight = Math.max(1, image.naturalHeight * scale);

  return {
    captionHeight,
    imageX: IMAGE_NOTE_PADDING + (availableWidth - imageWidth) / 2,
    imageY: IMAGE_NOTE_PADDING + (availableHeight - imageHeight) / 2,
    imageWidth,
    imageHeight,
  };
};

const stripWikiLinkMarkup = (text: string) => text.replace(/\[\[([^\]\n]+?)\]\]/g, "$1");

type WallNotesLayerProps = {
  visibleNotes: Note[];
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
};

export const WallNotesLayer = ({
  visibleNotes,
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
}: WallNotesLayerProps) => {
  const previousColorRef = useRef<Record<string, string>>({});
  const previousTextSizeRef = useRef<Record<string, string>>({});
  const [colorWashOpacityByNote, setColorWashOpacityByNote] = useState<Record<string, number>>({});
  const [sizePulseScaleByNote, setSizePulseScaleByNote] = useState<Record<string, number>>({});
  const [loadedImagesByUrl, setLoadedImagesByUrl] = useState<Record<string, HTMLImageElement>>({});
  const [failedImagesByUrl, setFailedImagesByUrl] = useState<Record<string, true>>({});
  const colorWashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const sizePulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const imageLayoutSignatureRef = useRef<Record<string, string>>({});

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
    const urls = [
      ...new Set(
        visibleNotes
          .flatMap((note) => [note.imageUrl?.trim(), note.bookmark?.metadata?.imageUrl?.trim(), note.bookmark?.metadata?.faviconUrl?.trim()])
          .filter((url): url is string => Boolean(url)),
      ),
    ];
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
          return { ...previous, [url]: image };
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
  }, [failedImagesByUrl, loadedImagesByUrl, visibleNotes]);

  useEffect(() => {
    const nextSignatures: Record<string, string> = {};

    for (const note of visibleNotes) {
      const imageUrl = note.imageUrl?.trim();
      if (!imageUrl) {
        continue;
      }
      const image = loadedImagesByUrl[imageUrl];
      if (!image) {
        continue;
      }

      const signature = `${imageUrl}|${note.w}|${note.text.trim()}|${image.naturalWidth}x${image.naturalHeight}`;
      nextSignatures[note.id] = signature;
      if (imageLayoutSignatureRef.current[note.id] === signature) {
        continue;
      }

      const nextHeight = getImageNoteAutoHeight(note, image);
      if (Math.abs(note.h - nextHeight) > 2) {
        updateNote(note.id, { h: nextHeight });
      }
    }

    imageLayoutSignatureRef.current = nextSignatures;
  }, [loadedImagesByUrl, updateNote, visibleNotes]);

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
        const noteTextStyle = getNoteTextStyle(noteView.textSize, noteView.textSizePx);
        const noteTextFontFamily = getNoteTextFontFamily(noteView.textFont);
        const resolvedTextColor = noteView.textColor ?? NOTE_DEFAULTS.textColor;
        const vocabulary = noteView.vocabulary;
        const isVocabulary = Boolean(vocabulary);
        const isQuote = noteView.noteKind === "quote";
        const isCanon = noteView.noteKind === "canon";
        const isJournal = noteView.noteKind === "journal";
        const isEisenhower = noteView.noteKind === "eisenhower";
        const isJoker = noteView.noteKind === "joker";
        const isCurrency = isCurrencyNote(noteView);
        const isBookmark = noteView.noteKind === "web-bookmark";
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
        const quoteAttributionHeight = isQuote && quoteAttribution ? 18 : 0;
        const quoteMarkInset = isQuote ? 13 : 0;
        const canonTitleInset = isCanon && canonTitle ? 16 : 0;
        const journalWritingX = 56;
        const journalFirstLineY = 30;
        const journalLineGap = 31;
        const textX = isJoker ? 14 : isQuote ? 18 : isJournal ? journalWritingX : 12;
        const textWidth = Math.max(0, noteView.w - (isQuote ? 36 : isJournal ? journalWritingX + 18 : 24));
        const currencyState = noteView.currency;
        const currencyAmountUsd = parseCurrencyAmountInput(currencyState?.amountInput) * (currencyState?.usdRate ?? 1);
        const currencyTrendGlyph = currencyState?.trend === "up" ? "↑" : currencyState?.trend === "down" ? "↓" : "•";
        const imageUrl = noteView.imageUrl?.trim();
        const bookmarkState = noteView.bookmark;
        const bookmarkMetadata = bookmarkState?.metadata;
        const bookmarkDisplaySize = resolveBookmarkDisplaySize(noteView);
        const bookmarkImageUrl = bookmarkMetadata?.imageUrl?.trim();
        const bookmarkFaviconUrl = bookmarkMetadata?.faviconUrl?.trim();
        const bookmarkImage = bookmarkImageUrl ? loadedImagesByUrl[bookmarkImageUrl] : undefined;
        const bookmarkFavicon = bookmarkFaviconUrl ? loadedImagesByUrl[bookmarkFaviconUrl] : undefined;
        const noteImage = imageUrl ? loadedImagesByUrl[imageUrl] : undefined;
        const isImageNote = Boolean(imageUrl);
        const imageCaption = noteView.text.trim();
        const imageNoteLayout = isImageNote ? getContainedImageLayout(noteView, noteImage) : null;
        const strippedNoteText = stripWikiLinkMarkup(noteView.text);
        const wikiLinks = wikiLinksByNoteId[note.id] ?? [];
        const wikiFooterRows = wikiLinks.length > 2 ? 2 : wikiLinks.length > 0 ? 1 : 0;
        const wikiFooterHeight = wikiFooterRows > 0 ? 28 + (wikiFooterRows - 1) * 20 : 0;
        const noteTextContent = isCurrency || isBookmark
          ? ""
          : isImageNote
          ? imageCaption
          : isJoker
            ? truncateNoteText(strippedNoteText, { ...noteView, text: strippedNoteText, h: Math.max(noteView.h - 86, 40) }) || jokerLoadingText
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
                  w: textWidth + 24,
                  h: Math.max(40, noteView.h - quoteAttributionHeight - quoteMarkInset - 8 - wikiFooterHeight),
                }) || "Add quote text"
              : truncateNoteText(strippedNoteText, { ...noteView, text: strippedNoteText, h: Math.max(noteView.h - wikiFooterHeight, 40) }) || "Double-click or press Enter to edit";
        const visibleTagCount = noteView.w < 180 ? 1 : noteView.w < 240 ? 2 : 3;
        const noteTags = noteView.tags.slice(0, visibleTagCount);
        const overflowTags = Math.max(0, note.tags.length - noteTags.length);
        const tagPalette = noteTagChipPalette(noteView.color);
        const textY = isImageNote ? 0 : isJoker ? 52 : 12 + quoteMarkInset + canonTitleInset + (isJournal ? 43 : 0);
        const textHeight = isImageNote
          ? 0
          : Math.max(0, noteView.h - 56 - quoteAttributionHeight - quoteMarkInset - canonTitleInset - (isJournal ? 43 : 0) - wikiFooterHeight);
        const journalDateLabel = isJournal ? formatJournalDateLabel(noteView.createdAt) : "";
        const journalDateFontSize = Math.max(13, noteTextStyle.fontSize - 2);
        const journalDateUnderlineWidth = Math.min(estimateJournalDateWidth(journalDateLabel, journalDateFontSize), Math.max(0, noteView.w - journalWritingX - 18));
        const journalDateWidth = Math.max(0, noteView.w - journalWritingX - 18);
        const journalDateX = journalWritingX;

        const journalLineStartY = journalFirstLineY;
        const journalLineCount = isJournal ? Math.max(0, Math.floor((noteView.h - journalLineStartY - 18) / journalLineGap) + 1) : 0;
        const journalLineYs = Array.from({ length: journalLineCount }, (_, index) => journalLineStartY + index * journalLineGap);

        return (
          <Group
            key={note.id}
            ref={(node) => {
              noteNodeRefs.current[note.id] = node;
            }}
            x={noteView.x}
            y={noteView.y}
            width={noteView.w}
            height={noteView.h}
            draggable={!isTimeLocked && !isPinned}
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId((previous) => (previous === note.id ? undefined : previous))}
            onClick={(event) => {
              if (isTimeLocked) {
                selectSingleNote(note.id);
                return;
              }
              if (linkingFromNoteId && linkingFromNoteId !== note.id) {
                createLink(linkingFromNoteId, note.id, linkType);
                setLinkingFromNote(undefined);
                return;
              }
              if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                toggleSelectNote(note.id);
              } else {
                selectSingleNote(note.id);
              }
              if (editingId !== note.id) {
                setEditing(null);
              }
            }}
            onTap={(event) => {
              if (isTimeLocked) {
                selectSingleNote(note.id);
                return;
              }
              if (linkingFromNoteId && linkingFromNoteId !== note.id) {
                createLink(linkingFromNoteId, note.id, linkType);
                setLinkingFromNote(undefined);
                return;
              }
              if (event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey) {
                toggleSelectNote(note.id);
              } else {
                selectSingleNote(note.id);
              }
            }}
            onDblClick={() => {
              if (isTimeLocked) {
                return;
              }
              selectSingleNote(note.id);
              if (note.vocabulary) {
                toggleVocabularyFlip(note.id);
                return;
              }
              if (imageUrl) {
                openImageInsert(note.id);
                return;
              }
              openEditor(note.id, note.text);
            }}
            onDragStart={(event) => {
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
                  activeIds
                    .map((id) => notesById[id])
                    .filter((entry): entry is Note => {
                      if (!entry) {
                        return false;
                      }
                      return !entry.pinned;
                    })
                    .map((entry) => [entry.id, { x: entry.x, y: entry.y }]),
                );
                dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
              }
            }}
            onDragMove={(event) => {
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
                if (id === note.id) {
                  continue;
                }
                if (notesById[id]?.pinned) {
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
            }}
            onDragEnd={(event) => {
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
                    if (id === note.id) {
                      continue;
                    }
                    if (notesById[id]?.pinned) {
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
            }}
            onTransform={(event) => {
              if (isTimeLocked || isPinned || isCurrency) {
                return;
              }
              const node = event.target;
              const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
              const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
              node.scaleX(1);
              node.scaleY(1);
              setResizingNoteDrafts((previous) => ({
                ...previous,
                [note.id]: {
                  x: node.x(),
                  y: node.y(),
                  w: width,
                  h: height,
                },
              }));
            }}
            onTransformEnd={(event) => {
              if (isTimeLocked || isPinned || isCurrency) {
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
            }}
          >
            {isJournal ? (
              <Line
                points={buildJournalPagePoints(noteView.w, noteView.h)}
                closed
                fill="#FFFFFF"
                stroke={isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8"}
                strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.4 : 1}
                shadowColor="#101010"
                shadowBlur={isFlashing ? 18 : isDragging ? 14 : 4}
                shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.04}
                shadowOffsetY={isDragging ? 3 : 1}
                lineJoin="round"
                tension={0.12}
              />
            ) : isBookmark ? (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={22}
                  fill="#F7FBFB"
                  stroke={isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#2b5560" : "rgba(0,71,83,0.22)"}
                  strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.6 : 1}
                  shadowColor="#062b32"
                  shadowBlur={isFlashing ? 30 : isDragging ? 24 : 14}
                  shadowOpacity={isFlashing ? 0.32 : isDragging ? 0.24 : 0.14}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                <Rect width={noteView.w} height={8} cornerRadius={[22, 22, 0, 0]} fill={WEB_BOOKMARK_ACCENT} listening={false} />
                {bookmarkDisplaySize === "expanded" && bookmarkImage ? (
                  <>
                    <KonvaImage x={0} y={8} width={noteView.w} height={92} image={bookmarkImage} cornerRadius={[0, 0, 18, 18]} listening={false} />
                    <Rect x={0} y={8} width={noteView.w} height={92} fill="rgba(0,0,0,0.08)" listening={false} />
                  </>
                ) : null}
                {bookmarkDisplaySize === "comfortable" && bookmarkImage ? (
                  <>
                    <Rect
                      x={Math.max(16, noteView.w - 104)}
                      y={46}
                      width={88}
                      height={72}
                      cornerRadius={16}
                      fill="rgba(0,71,83,0.08)"
                      stroke="rgba(0,71,83,0.10)"
                      strokeWidth={1}
                      listening={false}
                    />
                    <KonvaImage x={Math.max(16, noteView.w - 104)} y={46} width={88} height={72} image={bookmarkImage} cornerRadius={16} listening={false} />
                  </>
                ) : null}
                <Text
                  x={16}
                  y={bookmarkDisplaySize === "expanded" ? 116 : 24}
                  width={Math.max(0, noteView.w - (bookmarkDisplaySize === "comfortable" && bookmarkImage ? 128 : 32))}
                  fontSize={bookmarkDisplaySize === "compact" ? 15 : bookmarkDisplaySize === "expanded" ? 18 : 17}
                  fontStyle="bold"
                  fill="#052C33"
                  text={bookmarkMetadata?.title?.trim() || bookmarkMetadata?.domain || "Paste a URL"}
                  ellipsis
                  lineHeight={1.18}
                  listening={false}
                />
                {bookmarkDisplaySize !== "compact" && (
                  <Text
                    x={16}
                    y={bookmarkDisplaySize === "expanded" ? 152 : 60}
                    width={Math.max(0, noteView.w - (bookmarkDisplaySize === "comfortable" && bookmarkImage ? 128 : 32))}
                    height={Math.max(0, noteView.h - (bookmarkDisplaySize === "expanded" ? 108 : 84))}
                    fontSize={12}
                    lineHeight={1.42}
                    fill="rgba(5,44,51,0.72)"
                    text={bookmarkMetadata?.description?.trim() || bookmarkState?.error || "Paste a URL to fetch bookmark metadata."}
                    ellipsis
                    listening={false}
                  />
                )}
                <Text
                  x={16}
                  y={22}
                  width={92}
                  fontSize={10}
                  fontStyle="bold"
                  fill="rgba(0,71,83,0.78)"
                  text={inferBookmarkKindLabel(bookmarkMetadata?.kind).toUpperCase()}
                  listening={false}
                />
                <Group
                  x={Math.max(16, noteView.w - 78)}
                  y={16}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    const targetUrl = bookmarkMetadata?.finalUrl || bookmarkState?.normalizedUrl || bookmarkState?.url;
                    if (targetUrl) {
                      openExternalUrl(targetUrl);
                    }
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    const targetUrl = bookmarkMetadata?.finalUrl || bookmarkState?.normalizedUrl || bookmarkState?.url;
                    if (targetUrl) {
                      openExternalUrl(targetUrl);
                    }
                  }}
                >
                  <Rect width={62} height={22} cornerRadius={11} fill="rgba(0,71,83,0.10)" stroke="rgba(0,71,83,0.20)" strokeWidth={1} />
                  <Text x={0} y={6} width={62} align="center" fontSize={10} fontStyle="bold" fill="#0B3F49" text="OPEN" />
                </Group>
                <Group x={16} y={Math.max(16, noteView.h - 34)} listening={false}>
                  {bookmarkFavicon ? (
                    <KonvaImage x={0} y={0} width={16} height={16} image={bookmarkFavicon} cornerRadius={4} listening={false} />
                  ) : (
                    <Rect x={0} y={0} width={16} height={16} cornerRadius={4} fill={WEB_BOOKMARK_ACCENT} listening={false} />
                  )}
                  <Text
                    x={24}
                    y={1}
                    width={Math.max(0, noteView.w - 130)}
                    fontSize={11}
                    fill="rgba(5,44,51,0.74)"
                    text={bookmarkMetadata?.siteName?.trim() || bookmarkMetadata?.domain || bookmarkState?.normalizedUrl || "Website"}
                    ellipsis
                    listening={false}
                  />
                  <Text
                    x={Math.max(88, noteView.w - 112)}
                    y={1}
                    width={96}
                    align="right"
                    fontSize={10}
                    fill="rgba(5,44,51,0.52)"
                    text={bookmarkState?.status === "ready" ? "Updated" : bookmarkState?.status === "loading" ? "Fetching" : bookmarkState?.status === "error" ? "Retry needed" : "Preview"}
                    listening={false}
                  />
                </Group>
              </>
            ) : isImageNote && imageNoteLayout ? (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={IMAGE_NOTE_RADIUS}
                  fill="#FFFFFF"
                  stroke={isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8"}
                  strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.4 : 1}
                  shadowColor="#101010"
                  shadowBlur={isFlashing ? 30 : isDragging ? 26 : 12}
                  shadowOpacity={isFlashing ? 0.36 : isDragging ? 0.28 : 0.14}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                <Rect width={noteView.w} height={noteView.h} cornerRadius={IMAGE_NOTE_RADIUS} fill={note.color} opacity={0.08} listening={false} />
                {noteImage ? (
                  <KonvaImage
                    x={imageNoteLayout.imageX}
                    y={imageNoteLayout.imageY}
                    width={imageNoteLayout.imageWidth}
                    height={imageNoteLayout.imageHeight}
                    image={noteImage}
                    cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
                    listening={false}
                  />
                ) : (
                  <>
                    <Rect
                      x={IMAGE_NOTE_PADDING}
                      y={IMAGE_NOTE_PADDING}
                      width={Math.max(1, noteView.w - IMAGE_NOTE_PADDING * 2)}
                      height={Math.max(1, noteView.h - IMAGE_NOTE_PADDING * 2 - imageNoteLayout.captionHeight - (imageNoteLayout.captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0))}
                      cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
                      fill="#F4F6FB"
                      stroke="#CBD5E1"
                      strokeWidth={1}
                      dash={[6, 4]}
                      listening={false}
                    />
                    <Text
                      x={14}
                      y={Math.max(18, noteView.h / 2 - 8)}
                      width={Math.max(0, noteView.w - 28)}
                      align="center"
                      fontSize={11}
                      fill="#64748B"
                      text={imageUrl && failedImagesByUrl[imageUrl] ? "Image failed to load" : "Loading image..."}
                      listening={false}
                    />
                  </>
                )}
                {imageCaption && (
                  <>
                    <Rect
                      x={IMAGE_NOTE_PADDING}
                      y={noteView.h - IMAGE_NOTE_PADDING - imageNoteLayout.captionHeight - 2}
                      width={Math.max(1, noteView.w - IMAGE_NOTE_PADDING * 2)}
                      height={imageNoteLayout.captionHeight + 2}
                      cornerRadius={12}
                      fill="#FFFFFF"
                      opacity={0.94}
                      listening={false}
                    />
                    <Text
                      x={14}
                      y={noteView.h - IMAGE_NOTE_PADDING - imageNoteLayout.captionHeight + 5}
                      width={Math.max(0, noteView.w - 28)}
                      height={Math.max(0, imageNoteLayout.captionHeight - 10)}
                      fontSize={IMAGE_NOTE_CAPTION_FONT_SIZE}
                      fontFamily={noteTextFontFamily}
                      lineHeight={IMAGE_NOTE_CAPTION_LINE_HEIGHT}
                      fill="#475569"
                      text={imageCaption}
                      ellipsis
                      onClick={(event) => {
                        if (isTimeLocked) {
                          return;
                        }
                        event.cancelBubble = true;
                        selectSingleNote(note.id);
                        openEditor(note.id, noteView.text);
                      }}
                    />
                  </>
                )}
              </>
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
            ) : (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
                fill={note.color}
                stroke={isHighlighted ? "#f59e0b" : isSelected ? "#0f172a" : isHovered ? "#52525b" : "#d4d4d8"}
                strokeWidth={isHighlighted ? 2.6 : isSelected ? 2.4 : isHovered ? 1.4 : 1}
                shadowColor="#101010"
                shadowBlur={isFlashing ? 30 : isDragging ? 26 : 12}
                shadowOpacity={isFlashing ? 0.36 : isDragging ? 0.28 : 0.14}
                shadowOffsetY={isDragging ? 7 : 3}
              />
            )}
            {isCurrency && (
              <>
                <Rect x={10} y={10} width={Math.max(1, noteView.w - 20)} height={32} cornerRadius={12} fill="rgba(255,255,255,0.08)" listening={false} />
                <Text x={18} y={18} width={Math.max(0, noteView.w - 36)} fontSize={11} fontStyle="bold" fill="#E6E0FF" text={CURRENCY_NOTE_TITLE} listening={false} />
                <Text x={16} y={56} width={Math.max(0, noteView.w - 32)} fontSize={22} fontStyle="bold" fill="#FFFFFF" text={`1 ${currencyState?.baseCurrency ?? "USD"} = ${(currencyState?.usdRate ?? 1).toFixed((currencyState?.usdRate ?? 1) >= 1 ? 2 : 4)} USD`} listening={false} />
                <Text x={16} y={94} width={Math.max(0, noteView.w - 32)} fontSize={15} fill="#DDD6FE" text={`1000 ${(currencyState?.baseCurrency ?? "USD")} = ${(currencyState?.thousandValueUsd ?? 1000).toFixed(2)} USD`} listening={false} />
                <Text x={16} y={124} width={Math.max(0, noteView.w - 32)} fontSize={13} fill="#DDD6FE" text={`${currencyState?.amountInput || "0"} ${(currencyState?.baseCurrency ?? "USD")} -> ${currencyAmountUsd.toFixed(2)} USD`} listening={false} />
                <Text x={16} y={Math.max(148, noteView.h - 46)} width={Math.max(0, noteView.w - 32)} fontSize={11} fill="#C4B5FD" text={`${currencyTrendGlyph} ${(currencyState?.rateSource ?? "default").toUpperCase()} • ${(currencyState?.detectedCountryName ?? "USD fallback").slice(0, 30)}`} listening={false} />
                {currencyState?.error && (
                  <Text x={16} y={Math.max(168, noteView.h - 24)} width={Math.max(0, noteView.w - 32)} fontSize={10} fill="#FECACA" text={currencyState.error} ellipsis listening={false} />
                )}
              </>
            )}
            {isJoker && (
              <>
                <Rect x={10} y={10} width={Math.max(1, noteView.w - 20)} height={30} cornerRadius={10} fill="rgba(46,16,101,0.12)" listening={false} />
                <Text x={18} y={17} width={Math.max(0, noteView.w - 120)} fontSize={11} fontStyle="bold" fill="#3F1277" text="JOKER CARD" listening={false} />
                <Text x={Math.max(18, noteView.w - 108)} y={17} width={90} align="right" fontSize={10} fontStyle="bold" fill="#4C1D95" text={noteView.quoteSource?.trim() || "Fresh joke"} listening={false} />
              </>
            )}
            {isHighlighted && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
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
                cornerRadius={14}
                fill="#ef4444"
                opacity={0.08 + recencyIntensity(noteView.updatedAt, heatmapReferenceTs) * 0.35}
              />
            )}
            {isJournal && (
              <>
                <Line points={[44, 12, 44, Math.max(22, noteView.h - 14)]} stroke="#e28d8d" strokeWidth={1} opacity={0.6} listening={false} />
                {journalLineYs.map((lineY, index) => (
                  <Line
                    key={`${note.id}-journal-line-${index}`}
                    points={[12, lineY, Math.max(18, noteView.w - 12), lineY]}
                    stroke="#e9e9e9"
                    strokeWidth={1}
                    opacity={1}
                    listening={false}
                  />
                ))}
                <Text
                  x={journalDateX}
                  y={13}
                  width={journalDateWidth}
                  align="left"
                  fontSize={journalDateFontSize}
                  fontFamily={noteTextFontFamily}
                  fill={resolvedTextColor}
                  text={journalDateLabel}
                  wrap="none"
                  listening={false}
                />
                <Line
                  points={[journalDateX, journalFirstLineY - 1, journalDateX + journalDateUnderlineWidth, journalFirstLineY - 1]}
                  stroke={resolvedTextColor}
                  strokeWidth={1.35}
                  opacity={0.82}
                  listening={false}
                />
              </>
            )}
            {colorWashOpacity > 0 && (
              <Rect
                width={noteView.w}
                height={noteView.h}
                cornerRadius={14}
                fill="#ffffff"
                opacity={colorWashOpacity}
              />
            )}
            {!isImageNote && !isEisenhower && !isCurrency && !isBookmark && (
              <Text
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                fontSize={(isJournal ? Math.max(17, noteTextStyle.fontSize) : noteTextStyle.fontSize) * textSpringFactor}
                fontFamily={noteTextFontFamily}
                fontStyle={isQuote ? "italic" : "normal"}
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
            {isQuote && !isEisenhower && (
              <Text
                x={14}
                y={11}
                width={24}
                align="left"
                fontSize={18}
                fontStyle="bold"
                fill={resolvedTextColor}
                opacity={0.75}
                text='"'
                listening={false}
              />
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
            {isQuote && quoteAttribution && !isEisenhower && (
              <Text
                x={12}
                y={Math.max(12, noteView.h - 25)}
                width={Math.max(0, noteView.w - 24)}
                align="right"
                fontSize={10}
                fontStyle="italic"
                fill={resolvedTextColor}
                text={quoteAttribution}
                listening={false}
              />
            )}
            {wikiLinks.length > 0 && !isImageNote && !isVocabulary && !isEisenhower && !isJoker && !isBookmark && (
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
            {isCurrency && (
              <>
                <Rect x={10} y={10} width={Math.max(1, noteView.w - 20)} height={32} cornerRadius={12} fill="rgba(255,255,255,0.08)" listening={false} />
                <Text x={18} y={18} width={Math.max(0, noteView.w - 36)} fontSize={11} fontStyle="bold" fill="#E6E0FF" text={CURRENCY_NOTE_TITLE} listening={false} />
                <Text x={16} y={56} width={Math.max(0, noteView.w - 32)} fontSize={22} fontStyle="bold" fill="#FFFFFF" text={`1 ${currencyState?.baseCurrency ?? "USD"} = ${(currencyState?.usdRate ?? 1).toFixed((currencyState?.usdRate ?? 1) >= 1 ? 2 : 4)} USD`} listening={false} />
                <Text x={16} y={94} width={Math.max(0, noteView.w - 32)} fontSize={15} fill="#DDD6FE" text={`1000 ${(currencyState?.baseCurrency ?? "USD")} = ${(currencyState?.thousandValueUsd ?? 1000).toFixed(2)} USD`} listening={false} />
                <Text x={16} y={124} width={Math.max(0, noteView.w - 32)} fontSize={13} fill="#DDD6FE" text={`${currencyState?.amountInput || "0"} ${(currencyState?.baseCurrency ?? "USD")} -> ${currencyAmountUsd.toFixed(2)} USD`} listening={false} />
                <Text x={16} y={Math.max(148, noteView.h - 46)} width={Math.max(0, noteView.w - 32)} fontSize={11} fill="#C4B5FD" text={`${currencyTrendGlyph} ${(currencyState?.rateSource ?? "default").toUpperCase()} • ${(currencyState?.detectedCountryName ?? "USD fallback").slice(0, 30)}`} listening={false} />
                {currencyState?.error && (
                  <Text x={16} y={Math.max(168, noteView.h - 24)} width={Math.max(0, noteView.w - 32)} fontSize={10} fill="#FECACA" text={currencyState.error} ellipsis listening={false} />
                )}
              </>
            )}
            {isJoker && (
              <Text
                x={14}
                y={Math.max(12, noteView.h - 22)}
                width={Math.max(0, noteView.w - 28)}
                fontSize={10}
                fontStyle="bold"
                fill="#4C1D95"
                text="jokeapi.dev"
                listening={false}
              />
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
            {showNoteTags && !isImageNote && !isEisenhower && !isJoker &&
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
            {showNoteTags && !isImageNote && !isEisenhower && !isJoker && overflowTags > 0 && (
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


















