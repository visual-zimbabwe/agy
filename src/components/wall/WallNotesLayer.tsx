"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";

import { EisenhowerMatrixNote } from "@/components/wall/EisenhowerMatrixNote";
import {
  getImageNoteAutoHeight,
} from "@/components/wall/spatial/notes/note-layout";
import { buildWallNoteGroupProps } from "@/components/wall/spatial/notes/note-interaction";
import {
  atelierPalette,
  getContrastTextColor,
  getNoteCornerRadius,
  getNoteStrokeColor,
  resolveNoteFillColor,
} from "@/components/wall/spatial/notes/note-style";
import { WallAudioNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallAudioNoteRenderer";
import { WallBookmarkNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallBookmarkNoteRenderer";
import { WallCodeNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallCodeNoteRenderer";
import { WallCompactNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallCompactNoteRenderer";
import { WallFileNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallFileNoteRenderer";
import { WallImageNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallImageNoteRenderer";
import { WallJournalNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallJournalNoteRenderer";
import { WallNoteChromeOverlays } from "@/components/wall/spatial/notes/renderers/WallNoteChromeOverlays";
import { WallPrivateNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallPrivateNoteRenderer";
import { WallQuoteNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallQuoteNoteRenderer";
import { WallStandardNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallStandardNoteRenderer";
import { WallVideoNoteRenderer } from "@/components/wall/spatial/notes/renderers/WallVideoNoteRenderer";
import { formatJournalDateLabel } from "@/components/wall/wall-canvas-helpers";
import { deriveWallAssetRecords, mergeWallAssetRecords, resolveImageAssetUrl, resolveVideoPosterAssetUrl } from "@/features/wall/asset-records";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import { isPrivateNote } from "@/features/wall/private-notes";
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

        const groupProps = buildWallNoteGroupProps({
          note,
          noteView,
          isTimeLocked,
          isPinned,
          activeSelectedNoteIds,
          linkingFromNoteId,
          linkType,
          editingId,
          notesById,
          resizingNoteDrafts,
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
          createLink,
          resolveSnappedPosition,
          runHistoryGroup,
          moveNote,
          updateNote,
          duplicateNoteAt,
          openNoteEditor,
        });

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
        const journalTitle = noteLines[0] ?? "Dear Wall,";
        const journalBody = noteLines.slice(1).join("\n") || strippedNoteText;
        const showStandardTextCard = !isPrivate && isStandardNote && !isAudio && !isVideo && !isImageNote && !isBookmark && !isEisenhower && !looksLikeCode && !looksLikeFile && !isJournal && !isQuote && !isVocabulary;
        const wikiLinks = wikiLinksByNoteId[note.id] ?? [];
        const wikiFooterRows = wikiLinks.length > 2 ? 2 : wikiLinks.length > 0 ? 1 : 0;
        const wikiFooterHeight = wikiFooterRows > 0 ? 28 + (wikiFooterRows - 1) * 20 : 0;
        const quoteBodyText = isQuote
          ? truncateNoteText(strippedNoteText, {
              ...noteView,
              text: strippedNoteText,
              w: textWidth + 16,
              h: Math.max(40, noteView.h - quoteFooterHeight - quoteBodyTopInset - 18 - wikiFooterHeight),
            }) || "Add quote text"
          : "";
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
              ? quoteBodyText
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

        return (
          <Group key={note.id} {...groupProps}>
            {isJournal ? (
              <WallJournalNoteRenderer
                note={noteView}
                cornerRadius={noteCornerRadius}
                dateLabel={journalDateLabel}
                title={journalTitle}
                body={journalBody}
                isSelected={isSelected}
                isHovered={isHovered}
                isHighlighted={isHighlighted}
                isFlashing={isFlashing}
                isDragging={isDragging}
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
              <WallPrivateNoteRenderer
                note={noteView}
                cornerRadius={noteCornerRadius}
                isSelected={isSelected}
                isHovered={isHovered}
                isHighlighted={isHighlighted}
                isFlashing={isFlashing}
                isDragging={isDragging}
                isTimeLocked={isTimeLocked}
                selectSingleNote={selectSingleNote}
                openEditor={openEditor}
              />
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
            <WallNoteChromeOverlays
              note={noteView}
              cornerRadius={noteCornerRadius}
              isHighlighted={isHighlighted}
              isPinned={isPinned}
              showHeatmap={showHeatmap}
              heatmapReferenceTs={heatmapReferenceTs}
              colorWashOpacity={colorWashOpacity}
              showNoteTags={showNoteTags}
              isPrivate={isPrivate}
              isImageNote={isImageNote}
              isEisenhower={isEisenhower}
              isVideo={isVideo}
              isBookmark={isBookmark}
              isVocabulary={isVocabulary}
              isVocabularyBack={isVocabularyBack}
              wikiLinks={wikiLinks}
              noteTags={noteTags}
              overflowTags={overflowTags}
              tagPalette={tagPalette}
              isTimeLocked={isTimeLocked}
              recencyIntensity={recencyIntensity}
              onNavigateWikiLink={onNavigateWikiLink}
              onToggleVocabularyFlip={toggleVocabularyFlip}
            />
            {!isPrivate && !isImageNote && !isEisenhower && !isBookmark && !isJournal && !isQuote && !isAudio && !isVideo && !looksLikeCode && !looksLikeFile && !isStandardNote && (
              <Text
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                fontSize={noteTextStyle.fontSize * textSpringFactor}
                fontFamily={noteTextFontFamily}
                fontStyle={isCanon ? "bold" : "normal"}
                fill={resolvedTextColor}
                lineHeight={noteTextStyle.lineHeight}
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
            {isQuote && !isEisenhower ? (
              <WallQuoteNoteRenderer
                note={noteView}
                body={quoteBodyText}
                attribution={quoteAttribution}
                source={quoteSource}
                footerLines={quoteFooterLines}
                textColor={resolvedTextColor}
              />
            ) : null}
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
            {looksLikeCode ? <WallCodeNoteRenderer note={noteView} text={noteView.text} /> : null}
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
            {isVideo ? (
              <WallVideoNoteRenderer
                note={noteView}
                title={videoTitle}
                meta={videoMeta}
                currentTime={videoCurrentTime}
                duration={videoDuration}
                poster={loadedVideoPoster}
                isPlaying={isInlineVideoPlaying}
                isTimeLocked={isTimeLocked}
                onToggleInlineVideoPlayback={onToggleInlineVideoPlayback}
                onOpenVideoNote={onOpenVideoNote}
                onDownloadVideoNote={onDownloadVideoNote}
              />
            ) : null}
            {looksLikeFile && (
              <WallFileNoteRenderer
                note={noteView}
                label={fileLabel}
                meta={fileMeta}
                isTimeLocked={isTimeLocked}
                onDownloadFileNote={onDownloadFileNote}
              />
            )}
            {showStandardTextCard ? (
              <WallStandardNoteRenderer
                note={noteView}
                title={standardTitle}
                body={standardBody}
                fontFamily={noteTextFontFamily}
                wikiFooterHeight={wikiFooterHeight}
              />
            ) : null}
          </Group>
        );
      })}
    </>
  );
};
