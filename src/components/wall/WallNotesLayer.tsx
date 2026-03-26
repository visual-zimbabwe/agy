"use client";

import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Circle, Group, Image as KonvaImage, Line, Rect, Text } from "react-konva";
import type Konva from "konva";

import { EisenhowerMatrixNote } from "@/components/wall/EisenhowerMatrixNote";
import { formatJournalDateLabel } from "@/components/wall/wall-canvas-helpers";
import { getApodCaption, isApodNote } from "@/features/wall/apod";
import { bookmarkUrlLabel, resolveBookmarkDisplaySize, WEB_BOOKMARK_ACCENT } from "@/features/wall/bookmarks";
import { CURRENCY_NOTE_DEFAULTS, isCurrencyNote } from "@/features/wall/currency";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { getPoetryFooterHeight, getPoetryHeaderHeight } from "@/features/wall/poetry";
import { isPrivateNote, privateNoteTitle } from "@/features/wall/private-notes";
import { jokerLoadingText } from "@/features/wall/joker";
import { DEFAULT_STANDARD_NOTE_COLOR, sanitizeStandardNoteColor } from "@/features/wall/special-notes";
import { AUDIO_WAVEFORM_BARS, formatAudioDuration, getAudioNoteMeta, getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getFileNoteMetaCaps, getFileNoteTitle } from "@/features/wall/file-notes";
import { formatVideoDuration, getVideoNoteMeta, getVideoNoteTitle } from "@/features/wall/video-notes";
import { throneLoadingText } from "@/features/wall/throne";
import type { LinkType, Note } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };


const IMAGE_NOTE_PADDING = 6;
const IMAGE_NOTE_RADIUS = 16;
const IMAGE_NOTE_CAPTION_GAP = 8;
const IMAGE_NOTE_CAPTION_FONT_SIZE = 12;
const IMAGE_NOTE_CAPTION_LINE_HEIGHT = 1.28;
const IMAGE_NOTE_CAPTION_MAX_LINES = 3;

const THRONE_NOTE_BACKGROUND = "#35322f";
const THRONE_NOTE_TEXT = "#f5f0e8";
const THRONE_NOTE_MUTED = "rgba(245,240,232,0.42)";
const THRONE_NOTE_RULE = "rgba(245,240,232,0.18)";
const THRONE_NOTE_ACCENT = "#a67a10";
const THRONE_SHIELD_POINTS = [7, 0, 14, 3, 14, 14, 7, 24, 0, 14, 0, 3];

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

const getImageNoteAutoHeight = (note: Pick<Note, "w">, caption: string, image?: HTMLImageElement) => {
  const availableWidth = Math.max(1, note.w - IMAGE_NOTE_PADDING * 2);
  const captionHeight = estimateImageCaptionHeight(note.w, caption);
  const captionGap = captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0;
  const fallbackHeight = availableWidth * 0.7;

  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + fallbackHeight + captionGap + captionHeight));
  }

  const intrinsicHeight = image.naturalHeight * (availableWidth / image.naturalWidth);
  return Math.max(NOTE_DEFAULTS.minHeight, Math.round(IMAGE_NOTE_PADDING * 2 + intrinsicHeight + captionGap + captionHeight));
};

const getContainedImageLayout = (note: Pick<Note, "w" | "h">, caption: string, image?: HTMLImageElement) => {
  const captionHeight = estimateImageCaptionHeight(note.w, caption);
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

const splitJokerText = (text: string) => {
  const stripped = stripWikiLinkMarkup(text);
  const lines = stripped.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    setup: lines[0] || stripped.trim() || "Why don't scientists trust atoms?",
    punchline: lines.slice(1).join(" ") || "Because they make up everything!",
  };
};

const resolveNoteFillColor = (note: Note) => {
  if (note.noteKind === "joker") {
    return "#D6FF57";
  }
  if (note.noteKind === "throne") {
    return "#FF2400";
  }
  if (isCurrencyNote(note)) {
    return CURRENCY_NOTE_DEFAULTS.color;
  }
  return sanitizeStandardNoteColor(note.color, DEFAULT_STANDARD_NOTE_COLOR);
};

const atelierPalette = {
  paper: "#FFFCF8",
  paperShadow: "#1C1C19",
  paperStroke: "rgba(223,192,184,0.58)",
  paperStrokeStrong: "#A33818",
  text: "#1C1C19",
  mutedText: "#5A4B43",
  quietText: "#8C7C72",
  terracotta: "#A33818",
  forest: "#4D6356",
  gold: "#755717",
  glass: "rgba(252,249,244,0.72)",
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  if (![3, 6].includes(normalized.length)) {
    return { r: 28, g: 28, b: 25 };
  }
  const expanded = normalized.length === 3 ? normalized.split("").map((value) => `${value}${value}`).join("") : normalized;
  const intValue = Number.parseInt(expanded, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
};

const colorWithAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

const getContrastTextColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.56 ? atelierPalette.text : "#FFFCF8";
};

const getNoteStrokeColor = ({
  isSelected,
  isHovered,
  isHighlighted,
  accent,
}: {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  accent: string;
}) => {
  if (isHighlighted) {
    return "#F59E0B";
  }
  if (isSelected) {
    return atelierPalette.paperStrokeStrong;
  }
  if (isHovered) {
    return colorWithAlpha(accent, 0.48);
  }
  return atelierPalette.paperStroke;
};

const getNoteCornerRadius = (note: Note) => {
  if (note.noteKind === "economist") {
    return 12;
  }
  if (note.noteKind === "standard") {
    return 18;
  }
  if (note.noteKind === "quote" || note.noteKind === "journal") {
    return 16;
  }
  return 14;
};

const formatCurrencyDisplayRate = (value: number) => value.toFixed(value >= 1 ? 2 : 4);

const getCurrencyDisplayState = (baseCurrency?: string, usdRate?: number, previousUsdRate?: number) => {
  const safeBaseCurrency = baseCurrency ?? "USD";
  const safeUsdRate = typeof usdRate === "number" && Number.isFinite(usdRate) && usdRate > 0 ? usdRate : 1;
  const displayRate = 1 / safeUsdRate;
  const previousDisplayRate =
    typeof previousUsdRate === "number" && Number.isFinite(previousUsdRate) && previousUsdRate > 0 ? 1 / previousUsdRate : undefined;
  const changePercent = previousDisplayRate
    ? ((displayRate - previousDisplayRate) / previousDisplayRate) * 100
    : 0;

  return {
    pairLabel: `USD / ${safeBaseCurrency}`,
    quoteLabel: `${safeBaseCurrency} per 1 USD`,
    displayRate,
    changePercent,
  };
};

const formatCurrencyChangeBadge = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded.toFixed(1)}%`;
};

const formatCurrencyUpdatedAgo = (value?: number) => {
  if (!value) {
    return "Updated just now";
  }

  const elapsedMs = Date.now() - value;
  if (elapsedMs < 60_000) {
    return "Updated just now";
  }
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes}m ago`;
  }
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Updated ${elapsedHours}h ago`;
  }
  const elapsedDays = Math.round(elapsedHours / 24);
  return `Updated ${elapsedDays}d ago`;
};

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
  onDownloadFileNote: (noteId: string) => void;
  onToggleAudioPlayback: (noteId: string) => void;
  playingAudioNoteId?: string;
  playingAudioCurrentTimeSeconds?: number;
  playingAudioDurationSeconds?: number;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
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
  onDownloadFileNote,
  onToggleAudioPlayback,
  playingAudioNoteId,
  playingAudioCurrentTimeSeconds,
  playingAudioDurationSeconds,
  onOpenAudioNote,
  onDownloadAudioNote,
  onOpenVideoNote,
  onDownloadVideoNote,
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
          .flatMap((note) => [note.imageUrl?.trim(), note.bookmark?.metadata?.imageUrl?.trim(), note.bookmark?.metadata?.faviconUrl?.trim(), note.video?.posterDataUrl?.trim()])
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

      const caption = isApodNote(note) ? getApodCaption(note) : note.text.trim();
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
        const resolvedNoteColor = resolveNoteFillColor(noteView);
        const vocabulary = noteView.vocabulary;
        const isVocabulary = Boolean(vocabulary);
        const isQuote = noteView.noteKind === "quote";
        const isCanon = noteView.noteKind === "canon";
        const isJournal = noteView.noteKind === "journal";
        const isEisenhower = noteView.noteKind === "eisenhower";
        const isPoetry = noteView.noteKind === "poetry";
        const isPrivate = isPrivateNote(noteView);
        const isJoker = noteView.noteKind === "joker";
        const isThrone = noteView.noteKind === "throne";
        const isCurrency = isCurrencyNote(noteView);
        const isBookmark = noteView.noteKind === "web-bookmark";
        const isApod = isApodNote(noteView);
        const isEconomist = noteView.noteKind === "economist";
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
        const poetryAuthor = isPoetry ? noteView.poetry?.author?.trim() || noteView.quoteAuthor?.trim() || "Unknown Poet" : "";
        const quoteAttribution = noteView.quoteAuthor?.trim() ?? "";
        const quoteSource = noteView.quoteSource?.trim() ?? "";
        const quoteFooterLines = isQuote ? (quoteAttribution ? (quoteSource ? 2 : 1) : quoteSource ? 1 : 0) : 0;
        const quoteFooterHeight = isQuote ? (quoteFooterLines > 1 ? 40 : quoteFooterLines === 1 ? 24 : 0) : 0;
        const quoteBodyTopInset = isQuote ? 44 : 0;
        const canonTitleInset = isCanon && canonTitle ? 16 : 0;
        const poetryHeaderInset = isPoetry ? getPoetryHeaderHeight() : 0;
        const poetryFooterInset = isPoetry ? getPoetryFooterHeight(noteView.w, noteView.poetry) : 0;
        const journalHorizontalInset = 20;
        const isApiQuoteNote = isJoker || isThrone;
        const textX = isQuote ? 24 : isJournal ? journalHorizontalInset : isPoetry ? 26 : 12;
        const textWidth = Math.max(0, noteView.w - (isQuote ? 50 : isJournal ? journalHorizontalInset * 2 : isPoetry ? 52 : 24));
        const currencyState = noteView.currency;
        const currencyDisplay = getCurrencyDisplayState(currencyState?.baseCurrency, currencyState?.usdRate, currencyState?.previousUsdRate);
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
        const noteCornerRadius = getNoteCornerRadius(noteView);
        const isPaperShellNote = !isCurrency && !isJoker && !isThrone;
        const baseShellFill = isThrone ? THRONE_NOTE_BACKGROUND : isJoker ? "#F0CB88" : isCurrency ? CURRENCY_NOTE_DEFAULTS.color : isStandardNote ? "#FFFFFF" : atelierPalette.paper;
        const defaultTextColor =
          isQuote || isJournal || isBookmark || isApod || isImageNote || isPrivate || isPoetry || isEconomist || isAudio ? getContrastTextColor(resolvedNoteColor) : atelierPalette.text;
        const resolvedTextColor = noteView.textColor ?? defaultTextColor;
        const paperTintOpacity = isPaperShellNote ? (isStandardNote ? 0.02 : isPoetry ? 0.04 : isQuote ? 0.06 : isVocabulary ? 0.14 : 0.1) : 0;
        const isApodMediaCard = isApod;
        const imageCaption = isApod ? getApodCaption(noteView) : noteView.text.trim();
        const imageNoteLayout = isImageNote ? getContainedImageLayout(noteView, imageCaption, noteImage) : null;
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
        const videoTitle = getVideoNoteTitle(noteView.video);
        const videoMeta = getVideoNoteMeta(noteView.video).toUpperCase();
        const videoDuration = formatVideoDuration(noteView.video?.durationSeconds);
        const videoCurrentTime = formatVideoDuration(noteView.video?.durationSeconds ? Math.max(0, Math.round(noteView.video.durationSeconds * 0.35)) : 0);
        const videoPoster = noteView.video?.posterDataUrl?.trim();
        const loadedVideoPoster = videoPoster ? loadedImagesByUrl[videoPoster] : undefined;
        const journalTitle = noteLines[0] ?? "Dear Wall,";
        const journalBody = noteLines.slice(1).join("\n") || strippedNoteText;
        const showStandardTextCard = !isPrivate && isStandardNote && !isAudio && !isVideo && !isImageNote && !isBookmark && !isApodMediaCard && !isEisenhower && !isCurrency && !isEconomist && !looksLikeCode && !looksLikeFile && !isJournal && !isQuote && !isVocabulary && !isPoetry && !isJoker && !isThrone;
        const wikiLinks = wikiLinksByNoteId[note.id] ?? [];
        const wikiFooterRows = wikiLinks.length > 2 ? 2 : wikiLinks.length > 0 ? 1 : 0;
        const wikiFooterHeight = wikiFooterRows > 0 ? 28 + (wikiFooterRows - 1) * 20 : 0;
        const noteTextContent = isPrivate
          ? ""
          : isCurrency || isBookmark
          ? ""
          : isApodMediaCard
          ? imageCaption || noteView.apod?.error || noteView.apod?.title || "NASA APOD"
          : isImageNote
          ? imageCaption
          : isJoker
            ? strippedNoteText || jokerLoadingText
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
            : isPoetry
              ? strippedNoteText || noteView.poetry?.error || "Loading poem..."
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
        const jokerText = isJoker ? splitJokerText(strippedNoteText || jokerLoadingText) : null;
        const jokerQuestionY = 50;
        const jokerRuleY = Math.max(90, Math.min(noteView.h - 54, Math.round(noteView.h * 0.56)));
        const jokerPunchlineY = jokerRuleY + 12;
        const textY = isApodMediaCard || isImageNote ? 0 : 12 + quoteBodyTopInset + canonTitleInset + poetryHeaderInset + (isJournal ? 56 : 0);
        const textHeight = isApodMediaCard || isImageNote
          ? 0
          : Math.max(0, noteView.h - 56 - quoteFooterHeight - quoteBodyTopInset - canonTitleInset - poetryHeaderInset - poetryFooterInset - (isJournal ? 56 : 0) - wikiFooterHeight);
        const throneQuoteText = isThrone
          ? strippedNoteText === throneLoadingText
            ? strippedNoteText
            : `“${strippedNoteText || "A mind needs books as a sword needs a whetstone, if it is to keep its edge."}”`
          : "";
        const throneAuthorLabel = isThrone ? quoteAttribution || "Tyrion Lannister" : "";
        const throneAuthorWidth = isThrone ? Math.max(88, Math.min(noteView.w - 96, 144)) : 0;
        const throneAuthorX = isThrone ? (noteView.w - throneAuthorWidth) / 2 : 0;
        const throneRuleY = isThrone ? Math.max(124, noteView.h - 30) : 0;
        const throneQuoteHeight = isThrone ? Math.max(34, throneRuleY - 62) : 0;
        const journalDateLabel = isJournal ? formatJournalDateLabel(noteView.createdAt) : "";
        const journalDateWidth = Math.max(0, noteView.w - journalHorizontalInset * 2);
        const journalDateX = journalHorizontalInset;
        const decryptButtonWidth = Math.min(184, Math.max(128, noteView.w * 0.56));
        const decryptButtonX = Math.max(26, noteView.w / 2 - decryptButtonWidth / 2);
        const decryptButtonY = Math.max(noteView.h - 74, noteView.h * 0.72);


        const economistLines = isEconomist ? noteView.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
        const economistMasthead = economistLines[0] || "Magazine";
        const economistIssueLabel = noteView.economist?.issueDate?.trim() || noteView.quoteSource?.trim() || "Latest issue";
        const economistSubhead = noteView.economist?.mainStory?.trim() || "Curated issue";

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
              if (isApod || isPoetry || noteView.noteKind === "file") {
                openEditor(note.id, noteView.text);
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
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={18}
                  fill={atelierPalette.paper}
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: atelierPalette.forest })}
                  strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={isStandardNote ? (isFlashing ? 34 : isDragging ? 28 : 20) : isFlashing ? 28 : isDragging ? 24 : 16}
                  shadowOpacity={isStandardNote ? (isFlashing ? 0.12 : isDragging ? 0.1 : 0.06) : isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                {(() => {
                  const hasThumb = Boolean(bookmarkImage) && bookmarkDisplaySize !== "compact";
                  const thumbWidth = bookmarkDisplaySize === "expanded" ? 178 : 156;
                  const thumbHeight = bookmarkDisplaySize === "expanded" ? Math.max(92, noteView.h - 28) : Math.max(78, noteView.h - 34);
                  const thumbX = hasThumb ? Math.max(16, noteView.w - thumbWidth - 16) : 0;
                  const thumbY = hasThumb ? Math.max(14, (noteView.h - thumbHeight) / 2) : 0;
                  const contentWidth = Math.max(0, noteView.w - (hasThumb ? thumbWidth + 48 : 32));
                  const titleY = 24;
                  const descriptionY = 52;
                  const footerY = Math.max(16, noteView.h - 28);
                  const targetUrl = bookmarkMetadata?.finalUrl || bookmarkState?.normalizedUrl || bookmarkState?.url;
                  const sourceLabel = bookmarkUrlLabel(bookmarkState?.url || bookmarkState?.normalizedUrl || bookmarkMetadata?.finalUrl || "") || bookmarkMetadata?.siteName?.trim() || bookmarkMetadata?.domain || "Website";

                  return (
                    <>
                      <Group
                        x={Math.max(16, noteView.w - 84)}
                        y={14}
                        onClick={(event) => {
                          if (isTimeLocked) {
                            return;
                          }
                          event.cancelBubble = true;
                          if (targetUrl) {
                            openExternalUrl(targetUrl);
                          }
                        }}
                        onTap={(event) => {
                          if (isTimeLocked) {
                            return;
                          }
                          event.cancelBubble = true;
                          if (targetUrl) {
                            openExternalUrl(targetUrl);
                          }
                        }}
                      >
                        <Rect width={68} height={24} cornerRadius={12} fill="rgba(0,71,83,0.08)" stroke="rgba(0,71,83,0.16)" strokeWidth={1} />
                        <Text x={0} y={7} width={68} align="center" fontSize={10} fontStyle="bold" fill="#0B3F49" text="OPEN" />
                      </Group>
                      <Text
                        x={16}
                        y={titleY}
                        width={contentWidth}
                        fontSize={bookmarkDisplaySize === "compact" ? 14 : 17}
                        fontStyle="bold"
                        fill="#122C34"
                        text={bookmarkMetadata?.title?.trim() || bookmarkMetadata?.domain || "Paste a URL"}
                        ellipsis
                        lineHeight={1.16}
                        listening={false}
                      />
                      {bookmarkDisplaySize !== "compact" && (
                        <Text
                          x={16}
                          y={descriptionY}
                          width={contentWidth}
                          height={Math.max(24, noteView.h - 84)}
                          fontSize={12}
                          lineHeight={1.32}
                          fill="rgba(18,44,52,0.72)"
                          text={bookmarkMetadata?.description?.trim() || bookmarkState?.error || "Bookmark preview is still loading metadata."}
                          ellipsis
                          listening={false}
                        />
                      )}
                      {hasThumb ? (
                        <>
                          <Rect x={thumbX} y={thumbY} width={thumbWidth} height={thumbHeight} cornerRadius={14} fill="rgba(0,71,83,0.06)" stroke="rgba(0,71,83,0.10)" strokeWidth={1} listening={false} />
                          {bookmarkImage ? (
                            <KonvaImage x={thumbX} y={thumbY} width={thumbWidth} height={thumbHeight} image={bookmarkImage} cornerRadius={14} listening={false} />
                          ) : null}
                          {!bookmarkImage ? (
                            <Text
                              x={thumbX + 12}
                              y={thumbY + thumbHeight / 2 - 8}
                              width={Math.max(0, thumbWidth - 24)}
                              align="center"
                              fontSize={11}
                              fontStyle="bold"
                              fill="rgba(0,71,83,0.58)"
                              text={bookmarkMetadata?.siteName?.trim() || bookmarkMetadata?.domain || "Preview"}
                              ellipsis
                              listening={false}
                            />
                          ) : null}
                        </>
                      ) : null}
                      <Group x={16} y={footerY} listening={false}>
                        {bookmarkFavicon ? (
                          <KonvaImage x={0} y={0} width={16} height={16} image={bookmarkFavicon} cornerRadius={4} listening={false} />
                        ) : (
                          <Rect x={0} y={0} width={16} height={16} cornerRadius={4} fill={WEB_BOOKMARK_ACCENT} listening={false} />
                        )}
                        <Text
                          x={24}
                          y={1}
                          width={Math.max(0, noteView.w - (hasThumb ? thumbWidth + 144 : 150))}
                          fontSize={11}
                          fill="rgba(18,44,52,0.72)"
                          text={sourceLabel}
                          ellipsis
                          listening={false}
                        />
                      </Group>
                    </>
                  );
                })()}
              </>
            ) : isApodMediaCard ? (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={IMAGE_NOTE_RADIUS}
                  fill={atelierPalette.paper}
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: resolvedNoteColor })}
                  strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={isStandardNote ? (isFlashing ? 34 : isDragging ? 28 : 20) : isFlashing ? 28 : isDragging ? 24 : 16}
                  shadowOpacity={isStandardNote ? (isFlashing ? 0.12 : isDragging ? 0.1 : 0.06) : isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                <Rect width={noteView.w} height={noteView.h} cornerRadius={IMAGE_NOTE_RADIUS} fill={resolvedNoteColor} opacity={0.08} listening={false} />
                {isImageNote && imageNoteLayout && noteImage ? (
                  <KonvaImage
                    x={imageNoteLayout.imageX}
                    y={imageNoteLayout.imageY}
                    width={imageNoteLayout.imageWidth}
                    height={imageNoteLayout.imageHeight}
                    image={noteImage}
                    cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
                    listening={false}
                  />
                ) : isImageNote && imageNoteLayout ? (
                  <>
                    <Rect
                      x={IMAGE_NOTE_PADDING}
                      y={IMAGE_NOTE_PADDING}
                      width={Math.max(1, noteView.w - IMAGE_NOTE_PADDING * 2)}
                      height={Math.max(1, noteView.h - IMAGE_NOTE_PADDING * 2 - imageNoteLayout.captionHeight - (imageNoteLayout.captionHeight > 0 ? IMAGE_NOTE_CAPTION_GAP : 0))}
                      cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
                      fill={colorWithAlpha(atelierPalette.text, 0.06)}
                      stroke={colorWithAlpha(atelierPalette.paperStrokeStrong, 0.16)}
                      strokeWidth={1}
                      dash={[6, 4]}
                      listening={false}
                    />
                    <Text
                      x={18}
                      y={Math.max(18, noteView.h / 2 - 8)}
                      width={Math.max(0, noteView.w - 36)}
                      align="center"
                      fontSize={11}
                      fill={colorWithAlpha(atelierPalette.mutedText, 0.88)}
                      text={noteView.apod?.error || (imageUrl && failedImagesByUrl[imageUrl] ? "Image failed to load" : "Loading image...")}
                      listening={false}
                    />
                  </>
                ) : (
                  <>
                    <Rect
                      x={IMAGE_NOTE_PADDING}
                      y={IMAGE_NOTE_PADDING}
                      width={Math.max(1, noteView.w - IMAGE_NOTE_PADDING * 2)}
                      height={Math.max(1, noteView.h - 74)}
                      cornerRadius={Math.max(IMAGE_NOTE_RADIUS - 2, 12)}
                      fill="#31302D"
                      listening={false}
                    />
                    <Rect x={18} y={18} width={Math.max(1, noteView.w - 36)} height={Math.max(1, noteView.h - 120)} cornerRadius={14} fill="rgba(255,255,255,0.04)" listening={false} />
                    <Rect x={noteView.w / 2 - 32} y={Math.max(28, (noteView.h - 150) / 2)} width={64} height={64} cornerRadius={32} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.26)" strokeWidth={1} listening={false} />
                    <Text x={noteView.w / 2 - 8} y={Math.max(48, (noteView.h - 150) / 2 + 13)} width={16} align="center" fontSize={24} fontStyle="bold" fill="#FFFCF8" text="▶" listening={false} />
                    <Rect x={18} y={Math.max(28, noteView.h - 92)} width={Math.max(1, noteView.w - 36)} height={6} cornerRadius={3} fill="rgba(255,255,255,0.18)" listening={false} />
                    <Rect x={18} y={Math.max(28, noteView.h - 92)} width={Math.max(48, Math.min(noteView.w - 36, (noteView.w - 36) * 0.34))} height={6} cornerRadius={3} fill={atelierPalette.terracotta} listening={false} />
                    <Text
                      x={18}
                      y={Math.max(18, noteView.h - 76)}
                      width={Math.max(0, noteView.w - 92)}
                      fontSize={14}
                      fontStyle="bold"
                      fill="#FFFCF8"
                      text={noteView.apod?.title?.trim() || "NASA APOD"}
                      ellipsis
                      listening={false}
                    />
                    <Text
                      x={Math.max(18, noteView.w - 70)}
                      y={Math.max(18, noteView.h - 74)}
                      width={52}
                      align="right"
                      fontSize={9}
                      fill="rgba(255,252,248,0.58)"
                      text={noteView.apod?.date?.trim() || "MEDIA"}
                      ellipsis
                      listening={false}
                    />
                    <Text
                      x={18}
                      y={Math.max(18, noteView.h - 52)}
                      width={Math.max(0, noteView.w - 36)}
                      fontSize={9}
                      fontStyle="bold"
                      fill={colorWithAlpha("#FFFCF8", 0.68)}
                      text="SOURCE: MULTIMEDIA API"
                      listening={false}
                    />
                  </>
                )}
                {imageCaption && (
                  <>
                    <Rect
                      x={IMAGE_NOTE_PADDING}
                      y={Math.max(IMAGE_NOTE_PADDING, noteView.h - 58)}
                      width={Math.max(1, noteView.w - IMAGE_NOTE_PADDING * 2)}
                      height={Math.min(52, Math.max(30, noteView.h - Math.max(IMAGE_NOTE_PADDING, noteView.h - 58) - IMAGE_NOTE_PADDING))}
                      cornerRadius={12}
                      fill="#FFFFFF"
                      opacity={0.94}
                      listening={false}
                    />
                    <Text
                      x={14}
                      y={Math.max(11, noteView.h - 50)}
                      width={Math.max(0, noteView.w - 28)}
                      height={36}
                      fontSize={IMAGE_NOTE_CAPTION_FONT_SIZE}
                      fontFamily={isQuote || isPoetry ? "Newsreader" : noteTextFontFamily}
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
            ) : isEconomist && imageNoteLayout ? (
              <>
                <Rect
                  x={16}
                  y={18}
                  width={Math.max(1, noteView.w - 16)}
                  height={Math.max(1, noteView.h - 10)}
                  cornerRadius={10}
                  fill="rgba(28,28,25,0.08)"
                  rotation={5}
                  listening={false}
                />
                <Rect
                  x={6}
                  y={8}
                  width={Math.max(1, noteView.w - 8)}
                  height={Math.max(1, noteView.h - 2)}
                  cornerRadius={10}
                  fill="rgba(255,255,255,0.76)"
                  stroke="rgba(223,192,184,0.42)"
                  strokeWidth={0.9}
                  rotation={-2.5}
                  listening={false}
                />
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
                {noteImage ? (
                  <KonvaImage
                    x={0}
                    y={0}
                    width={noteView.w}
                    height={Math.max(1, noteView.h * 0.72)}
                    image={noteImage}
                    cornerRadius={[noteCornerRadius, noteCornerRadius, 0, 0]}
                    listening={false}
                  />
                ) : (
                  <Rect
                    x={0}
                    y={0}
                    width={noteView.w}
                    height={Math.max(1, noteView.h * 0.72)}
                    cornerRadius={[noteCornerRadius, noteCornerRadius, 0, 0]}
                    fill="#DDD6CE"
                    listening={false}
                  />
                )}
                <Rect
                  x={0}
                  y={Math.max(0, noteView.h - 136)}
                  width={noteView.w}
                  height={136}
                  fill="rgba(255,252,248,0.97)"
                  listening={false}
                />

                <Text
                  x={16}
                  y={Math.max(0, noteView.h - 118)}
                  width={Math.max(0, noteView.w - 32)}
                  fontSize={10}
                  fontStyle="bold"
                  fill={atelierPalette.terracotta}
                  text={(economistIssueLabel || "Latest issue").toUpperCase()}
                  wrap="none"
                  ellipsis
                  listening={false}
                />
                <Text
                  x={16}
                  y={Math.max(0, noteView.h - 94)}
                  width={Math.max(0, noteView.w - 32)}
                  height={48}
                  fontSize={18}
                  fontStyle="bold"
                  fill={atelierPalette.text}
                  text={economistSubhead}
                  lineHeight={1.15}
                  ellipsis
                  listening={false}
                />
                <Text
                  x={16}
                  y={Math.max(0, noteView.h - 42)}
                  width={Math.max(0, noteView.w - 32)}
                  fontSize={18}
                  fontFamily="Newsreader"
                  fontStyle="bold"
                  fill={atelierPalette.text}
                  text={economistMasthead.toUpperCase()}
                  wrap="none"
                  ellipsis
                  listening={false}
                />
                <Text
                  x={16}
                  y={Math.max(0, noteView.h - 22)}
                  width={Math.max(0, noteView.w - 32)}
                  fontSize={9}
                  fill={atelierPalette.quietText}
                  text="SOURCE: MAGAZINE API"
                  wrap="none"
                  ellipsis
                  listening={false}
                />
              </>
            ) : isImageNote && imageNoteLayout ? (
              <>
                <Rect
                  width={noteView.w}
                  height={noteView.h}
                  cornerRadius={IMAGE_NOTE_RADIUS}
                  fill={atelierPalette.paper}
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: resolvedNoteColor })}
                  strokeWidth={isHighlighted ? 2.4 : isSelected ? 2 : isHovered ? 1.3 : 0.9}
                  shadowColor={atelierPalette.paperShadow}
                  shadowBlur={isFlashing ? 28 : isDragging ? 24 : 16}
                  shadowOpacity={isFlashing ? 0.18 : isDragging ? 0.14 : 0.08}
                  shadowOffsetY={isDragging ? 7 : 3}
                />
                <Rect width={noteView.w} height={noteView.h} cornerRadius={IMAGE_NOTE_RADIUS} fill={resolvedNoteColor} opacity={0.08} listening={false} />
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
                      fill={colorWithAlpha(atelierPalette.text, 0.06)}
                      stroke={colorWithAlpha(atelierPalette.paperStrokeStrong, 0.16)}
                      strokeWidth={1}
                      dash={[6, 4]}
                      listening={false}
                    />
                    <Text
                      x={18}
                      y={Math.max(18, noteView.h / 2 - 8)}
                      width={Math.max(0, noteView.w - 36)}
                      align="center"
                      fontSize={11}
                      fill={colorWithAlpha(atelierPalette.mutedText, 0.88)}
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
                      fontFamily={isQuote || isPoetry ? "Newsreader" : noteTextFontFamily}
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
                  stroke={getNoteStrokeColor({ isSelected, isHovered, isHighlighted, accent: isThrone ? atelierPalette.gold : isJoker ? atelierPalette.terracotta : resolvedNoteColor })}
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
                {isPoetry && (
                  <>
                    <Text x={18} y={20} width={Math.max(0, noteView.w - 36)} align="center" fontSize={9} fontStyle="bold" fill={colorWithAlpha(atelierPalette.quietText, 0.54)} text="SOURCE: POETRY API" listening={false} />
                    <Line points={[24, Math.max(24, noteView.h - poetryFooterInset), Math.max(24, noteView.w - 24), Math.max(24, noteView.h - poetryFooterInset)]} stroke={colorWithAlpha(atelierPalette.paperStrokeStrong, 0.16)} strokeWidth={1} listening={false} />
                  </>
                )}
              </>
            )}
            {isCurrency && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={noteCornerRadius} fill={atelierPalette.paper} listening={false} />
                <Text x={18} y={18} width={Math.max(0, noteView.w - 36)} fontSize={9} fontStyle="bold" fill={colorWithAlpha(atelierPalette.quietText, 0.75)} text="CURRENCY PAIR" listening={false} />
                <Text x={18} y={36} width={Math.max(0, noteView.w - 128)} fontSize={20} fontStyle="bold" fill={atelierPalette.text} text={currencyDisplay.pairLabel} listening={false} />
                <Rect x={Math.max(112, noteView.w - 88)} y={34} width={52} height={18} cornerRadius={6} fill="#DCEEDD" listening={false} />
                <Text x={Math.max(112, noteView.w - 88)} y={39} width={52} align="center" fontSize={10} fontStyle="bold" fill={atelierPalette.forest} text={formatCurrencyChangeBadge(currencyDisplay.changePercent)} listening={false} />
                <Line
                  points={[Math.max(18, noteView.w - 38), 42, Math.max(18, noteView.w - 31), 35, Math.max(18, noteView.w - 24), 41, Math.max(18, noteView.w - 12), 28]}
                  stroke={atelierPalette.forest}
                  strokeWidth={2.2}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
                <Line
                  points={[Math.max(18, noteView.w - 18), 28, Math.max(18, noteView.w - 12), 28, Math.max(18, noteView.w - 12), 34]}
                  stroke={atelierPalette.forest}
                  strokeWidth={2.2}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
                <Text x={18} y={72} width={Math.max(92, noteView.w - 132)} fontSize={32} fontStyle="bold" fill={atelierPalette.text} text={formatCurrencyDisplayRate(currencyDisplay.displayRate)} listening={false} />
                <Text x={Math.min(noteView.w - 132, 112)} y={85} width={Math.max(0, noteView.w - 130)} fontSize={11} fill={atelierPalette.mutedText} text={currencyDisplay.quoteLabel} listening={false} />
                <Line
                  points={[
                    18,
                    136,
                    Math.max(34, noteView.w * 0.18),
                    132,
                    Math.max(54, noteView.w * 0.3),
                    142,
                    Math.max(84, noteView.w * 0.42),
                    122,
                    Math.max(112, noteView.w * 0.56),
                    144,
                    Math.max(146, noteView.w * 0.72),
                    102,
                    Math.max(184, noteView.w * 0.86),
                    112,
                    Math.max(208, noteView.w - 18),
                    132,
                  ]}
                  stroke="#D5DBD7"
                  strokeWidth={2.8}
                  bezier
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
                <Text
                  x={18}
                  y={Math.max(18, noteView.h - 28)}
                  width={Math.max(0, noteView.w - 142)}
                  fontSize={9}
                  fill={colorWithAlpha(atelierPalette.quietText, 0.72)}
                  text={currencyState?.rateSource === "default" ? "SOURCE: DEFAULT RATE" : "SOURCE: CURRENCY API"}
                  listening={false}
                />
                <Text
                  x={Math.max(112, noteView.w - 116)}
                  y={Math.max(18, noteView.h - 28)}
                  width={98}
                  align="right"
                  fontSize={9}
                  fill={colorWithAlpha(atelierPalette.quietText, 0.72)}
                  text={formatCurrencyUpdatedAgo(currencyState?.rateUpdatedAt)}
                  listening={false}
                />
              </>
            )}
            {isApiQuoteNote && (
              <>
                {isJoker && (
                  <>
                    <Line
                      points={[Math.max(18, noteView.w - 74), 18, Math.max(24, noteView.w - 68), 12, Math.max(30, noteView.w - 62), 18]}
                      stroke={colorWithAlpha(atelierPalette.gold, 0.5)}
                      strokeWidth={3.4}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                    <Line
                      points={[Math.max(18, noteView.w - 46), 18, Math.max(24, noteView.w - 40), 12, Math.max(30, noteView.w - 34), 18]}
                      stroke={colorWithAlpha(atelierPalette.gold, 0.5)}
                      strokeWidth={3.4}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                    <Line
                      points={[Math.max(18, noteView.w - 74), 34, Math.max(24, noteView.w - 64), 43, Math.max(30, noteView.w - 54), 46, Math.max(36, noteView.w - 44), 43, Math.max(42, noteView.w - 34), 34]}
                      stroke={colorWithAlpha(atelierPalette.gold, 0.36)}
                      strokeWidth={8}
                      bezier
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                  </>
                )}
                {isJoker && jokerText && (
              <>
                <Text
                  x={16}
                  y={jokerQuestionY}
                  width={Math.max(0, noteView.w - 32)}
                  height={Math.max(18, jokerRuleY - jokerQuestionY - 8)}
                  fontSize={16}
                  fontFamily={noteTextFontFamily}
                  fill="#261900"
                  lineHeight={1.65}
                  text={truncateNoteText(jokerText.setup, { ...noteView, text: jokerText.setup, h: Math.max(jokerRuleY - jokerQuestionY, 36) }) || jokerText.setup}
                  ellipsis
                  listening={false}
                />
                <Line
                  points={[16, jokerRuleY, Math.max(16, noteView.w - 16), jokerRuleY]}
                  stroke="rgba(38,25,0,0.10)"
                  strokeWidth={1}
                  listening={false}
                />
                <Text
                  x={16}
                  y={jokerPunchlineY}
                  width={Math.max(0, noteView.w - 32)}
                  height={Math.max(18, noteView.h - jokerPunchlineY - 16)}
                  fontSize={18}
                  fontFamily={noteTextFontFamily}
                  fontStyle="bold"
                  fill="rgba(38,25,0,0.92)"
                  lineHeight={1.55}
                  text={truncateNoteText(jokerText.punchline, { ...noteView, text: jokerText.punchline, h: Math.max(noteView.h - jokerPunchlineY - 12, 36) }) || jokerText.punchline}
                  ellipsis
                  listening={false}
                />
              </>
            )}
            {isThrone && (
                  <Line
                    x={Math.max(18, noteView.w - 32)}
                    y={14}
                    points={THRONE_SHIELD_POINTS}
                    closed
                    fill={THRONE_NOTE_ACCENT}
                    stroke={colorWithAlpha("#000000", 0.08)}
                    strokeWidth={0.8}
                    listening={false}
                  />
                )}
                <Text
                  x={16}
                  y={16}
                  width={Math.max(0, noteView.w - 32)}
                  fontSize={9}
                  fontStyle="bold"
                  fill={isJoker ? colorWithAlpha("#5D4201", 0.72) : THRONE_NOTE_MUTED}
                  text={isJoker ? "SOURCE: JOKES API" : "SOURCE: GOT API"}
                  listening={false}
                />
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
            {!isPrivate && !isThrone && !isJoker && !isApodMediaCard && !isImageNote && !isEisenhower && !isCurrency && !isBookmark && !isEconomist && !isJournal && !isQuote && !isAudio && !isVideo && !looksLikeCode && !looksLikeFile && !isStandardNote && (
              <Text
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                fontSize={(isJournal ? Math.max(17, noteTextStyle.fontSize) : noteTextStyle.fontSize) * textSpringFactor}
                fontFamily={isQuote || isPoetry ? "Newsreader" : noteTextFontFamily}
                fontStyle={isQuote || isPoetry ? "italic" : isCanon ? "bold" : "normal"}
                fill={resolvedTextColor}
                lineHeight={isJournal ? 1.72 : isPoetry ? 1.68 : noteTextStyle.lineHeight}
                align={isVocabulary || isPoetry ? "center" : (noteView.textAlign ?? "left")}
                verticalAlign={isPoetry ? "middle" : (noteView.textVAlign ?? NOTE_DEFAULTS.textVAlign)}
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
            {isThrone && (
              <>
                <Text
                  x={18}
                  y={48}
                  width={Math.max(0, noteView.w - 36)}
                  height={throneQuoteHeight}
                  fontSize={Math.max(19, Math.min(24, noteView.w / 10))}
                  fontFamily="Cormorant Garamond"
                  fontStyle={strippedNoteText === throneLoadingText ? "normal" : "italic"}
                  fill={THRONE_NOTE_TEXT}
                  lineHeight={1.28}
                  text={throneQuoteText}
                  ellipsis
                  listening={false}
                />
                <Line
                  points={[18, throneRuleY + 8, Math.max(18, throneAuthorX - 8), throneRuleY + 8]}
                  stroke={THRONE_NOTE_RULE}
                  strokeWidth={1}
                  listening={false}
                />
                <Text
                  x={throneAuthorX}
                  y={throneRuleY}
                  width={throneAuthorWidth}
                  align="center"
                  fontSize={14}
                  fontFamily="Cormorant Garamond"
                  fill="rgba(245,240,232,0.74)"
                  text={throneAuthorLabel}
                  wrap="none"
                  ellipsis
                  listening={false}
                />
                <Line
                  points={[Math.min(noteView.w - 18, throneAuthorX + throneAuthorWidth + 8), throneRuleY + 8, Math.max(18, noteView.w - 18), throneRuleY + 8]}
                  stroke={THRONE_NOTE_RULE}
                  strokeWidth={1}
                  listening={false}
                />
              </>
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
            {isPoetry && (
              <>
                <Text
                  x={18}
                  y={Math.max(18, noteView.h - poetryFooterInset + 28)}
                  width={Math.max(0, noteView.w - 36)}
                  align="center"
                  fontSize={14}
                  fontStyle="normal"
                  fontFamily="Manrope"
                  fill={colorWithAlpha(atelierPalette.terracotta, 0.78)}
                  text={poetryAuthor}
                  ellipsis
                  listening={false}
                />
              </>
            )}
            {looksLikeCode && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={14} fill="#1E1E1E" listening={false} />
                <Rect x={0} y={0} width={noteView.w} height={40} cornerRadius={[14, 14, 0, 0]} fill="#252526" listening={false} />
                <Rect x={16} y={15} width={10} height={10} cornerRadius={5} fill="#FF5F56" listening={false} />
                <Rect x={31} y={15} width={10} height={10} cornerRadius={5} fill="#FFBD2E" listening={false} />
                <Rect x={46} y={15} width={10} height={10} cornerRadius={5} fill="#27C93F" listening={false} />
                <Text x={Math.max(72, noteView.w - 132)} y={16} width={76} align="right" fontSize={9} fill="rgba(255,255,255,0.4)" text={fileNameMatch?.[1] ?? "main.py"} ellipsis listening={false} />
                <Text x={Math.max(18, noteView.w - 48)} y={16} width={30} align="right" fontSize={9} fill="rgba(255,255,255,0.28)" text="COPY" listening={false} />
                <Text
                  x={16}
                  y={56}
                  width={Math.max(0, noteView.w - 32)}
                  height={Math.max(0, noteView.h - 72)}
                  fontSize={12}
                  fontFamily="JetBrains Mono"
                  lineHeight={1.45}
                  fill="#D4D4D4"
                  text={strippedNoteText}
                  ellipsis
                  listening={false}
                />
              </>
            )}
            {isAudio && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={18} fill={atelierPalette.paper} stroke={colorWithAlpha(atelierPalette.quietText, 0.16)} strokeWidth={1} listening={false} />
                <Rect x={24} y={24} width={58} height={58} cornerRadius={16} fill={colorWithAlpha(atelierPalette.forest, 0.1)} listening={false} />
                <Text x={24} y={38} width={58} align="center" fontSize={26} fill={atelierPalette.forest} text="♪" listening={false} />
                <Group
                  x={Math.max(24, noteView.w / 2 - 28)}
                  y={24}
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
                    onToggleAudioPlayback(note.id);
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    onToggleAudioPlayback(note.id);
                  }}
                >
                  <Rect width={56} height={22} cornerRadius={11} fill={colorWithAlpha(atelierPalette.terracotta, 0.1)} stroke={colorWithAlpha(atelierPalette.terracotta, 0.18)} strokeWidth={1} />
                  <Text x={0} y={6} width={56} align="center" fontSize={11} fontStyle="bold" fill={colorWithAlpha(atelierPalette.terracotta, 0.82)} text={isAudioPlaying ? "PAUSE" : "PLAY"} listening={false} />
                </Group>
                <Group x={Math.max(20, noteView.w - 86)} y={26} onClick={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onDownloadAudioNote(note.id); }} onTap={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onDownloadAudioNote(note.id); }}>
                  <Text x={0} y={0} width={18} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.8)} text="↓" listening={false} />
                </Group>
                <Group x={Math.max(44, noteView.w - 48)} y={26} onClick={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onOpenAudioNote(note.id); }} onTap={(event) => { if (isTimeLocked) { return; } event.cancelBubble = true; onOpenAudioNote(note.id); }}>
                  <Text x={0} y={0} width={18} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.8)} text="↗" listening={false} />
                </Group>
                <Text x={24} y={96} width={Math.max(0, noteView.w - 48)} fontSize={Math.max(24, Math.min(34, noteView.w / 11))} fontFamily="Newsreader" fontStyle="italic" fill={atelierPalette.text} text={audioTitle} ellipsis listening={false} />
                {audioMeta ? <Text x={24} y={132} width={Math.max(0, noteView.w - 48)} fontSize={10} letterSpacing={1.2} fill={colorWithAlpha(atelierPalette.quietText, 0.78)} text={audioMeta} ellipsis listening={false} /> : null}
                {AUDIO_WAVEFORM_BARS.map((value, index) => {
                  const barWidth = Math.max(8, Math.floor((noteView.w - 76) / AUDIO_WAVEFORM_BARS.length));
                  const x = 24 + index * (barWidth + 2);
                  const pulseOffset = isAudioPlaying ? ((index + Math.floor((playingAudioCurrentTimeSeconds ?? 0) * 8)) % 3) * 2 : 0;
                  const barHeight = Math.max(10, Math.round(40 * value) - pulseOffset);
                  const active = isAudioPlaying ? index >= 3 && index <= 5 : index >= 4 && index <= 5;
                  return (
                    <Rect key={`${note.id}-audio-wave-${index}`} x={x} y={Math.max(160, noteView.h - 80 - barHeight)} width={barWidth} height={barHeight} cornerRadius={barWidth / 2} fill={active ? atelierPalette.terracotta : colorWithAlpha('#DFC0B8', 0.44)} listening={false} />
                  );
                })}
                <Text x={24} y={Math.max(180, noteView.h - 28)} width={72} fontSize={12} fontFamily="JetBrains Mono" fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text={audioCurrentTime} listening={false} />
                <Text x={Math.max(0, noteView.w / 2 - 40)} y={Math.max(180, noteView.h - 29)} width={80} align="center" fontSize={10} fontStyle="bold" letterSpacing={1.3} fill={colorWithAlpha(atelierPalette.terracotta, 0.66)} text={isAudioPlaying ? "PLAYING" : "READY"} listening={false} />
                <Text x={Math.max(24, noteView.w - 96)} y={Math.max(180, noteView.h - 28)} width={72} align="right" fontSize={12} fontFamily="JetBrains Mono" fill={colorWithAlpha(atelierPalette.quietText, 0.82)} text={audioDuration} listening={false} />
              </>
            )}
            {isVideo && (
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={22} fill={atelierPalette.paper} stroke={colorWithAlpha(atelierPalette.quietText, 0.14)} strokeWidth={1} listening={false} />
                <Group
                  x={18}
                  y={18}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    onOpenVideoNote(note.id);
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    onOpenVideoNote(note.id);
                  }}
                >
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
                  <Rect width={Math.max(0, noteView.w - 36)} height={Math.max(0, noteView.h - 124)} cornerRadius={18} fill="rgba(17,18,15,0.16)" listening={false} />
                  <Rect x={Math.max(18, (noteView.w - 102) / 2)} y={Math.max(18, (noteView.h - 124) / 2 - 26)} width={66} height={66} cornerRadius={20} fill={colorWithAlpha(atelierPalette.terracotta, 0.9)} shadowColor="rgba(0,0,0,0.24)" shadowBlur={14} shadowOffsetY={6} listening={false} />
                  <Line points={[Math.max(43, (noteView.w - 102) / 2 + 26), Math.max(33, (noteView.h - 124) / 2 - 8), Math.max(43, (noteView.w - 102) / 2 + 26), Math.max(33, (noteView.h - 124) / 2 + 20), Math.max(67, (noteView.w - 102) / 2 + 48), Math.max(33, (noteView.h - 124) / 2 + 6)]} closed fill="#fffaf4" listening={false} />
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
              <>
                <Rect width={noteView.w} height={noteView.h} cornerRadius={14} fill={atelierPalette.paper} stroke={colorWithAlpha(atelierPalette.quietText, 0.16)} strokeWidth={1} listening={false} />
                <Rect x={18} y={Math.max(16, noteView.h / 2 - 30)} width={46} height={46} cornerRadius={12} fill={colorWithAlpha(atelierPalette.terracotta, 0.10)} listening={false} />
                <Text x={18} y={Math.max(25, noteView.h / 2 - 21)} width={46} align="center" fontSize={22} fill={atelierPalette.terracotta} text="▤" listening={false} />
                <Text x={78} y={Math.max(18, noteView.h / 2 - 24)} width={Math.max(0, noteView.w - 120)} fontSize={13} fontStyle="bold" fill={atelierPalette.text} text={fileLabel} ellipsis listening={false} />
                <Text x={78} y={Math.max(38, noteView.h / 2 - 4)} width={Math.max(0, noteView.w - 120)} fontSize={10} fill={colorWithAlpha(atelierPalette.quietText, 0.8)} text={fileMeta.toUpperCase()} ellipsis listening={false} />
                <Group
                  x={Math.max(18, noteView.w - 42)}
                  y={Math.max(26, noteView.h / 2 - 18)}
                  onClick={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    onDownloadFileNote(note.id);
                  }}
                  onTap={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    event.cancelBubble = true;
                    onDownloadFileNote(note.id);
                  }}
                >
                  <Text x={0} y={0} width={18} align="center" fontSize={16} fill={colorWithAlpha(atelierPalette.quietText, 0.58)} text="↓" listening={false} />
                </Group>
              </>
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
            {wikiLinks.length > 0 && !isApodMediaCard && !isImageNote && !isVocabulary && !isEisenhower && !isJoker && !isThrone && !isBookmark && !isPoetry && !isEconomist && (
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
            {showNoteTags && !isPrivate && !isApodMediaCard && !isImageNote && !isEisenhower && !isJoker && !isThrone && !isPoetry && !isEconomist && !isVideo &&
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
            {showNoteTags && !isPrivate && !isApodMediaCard && !isImageNote && !isEisenhower && !isJoker && !isThrone && !isPoetry && !isEconomist && !isVideo && overflowTags > 0 && (
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


