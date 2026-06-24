import { formatJournalDateLabel } from "@/components/wall/wall-canvas-helpers";
import { atelierPalette, getContrastTextColor, getNoteCornerRadius, resolveNoteFillColor } from "@/components/wall/spatial/notes/note-style";
import { resolveImageAssetUrl, resolveVideoPosterAssetUrl } from "@/features/wall/asset-records";
import { formatAudioDuration } from "@/features/wall/audio-notes";
import { isPrivateNote } from "@/features/wall/private-notes";
import type { Note, WallAssetMap } from "@/features/wall/types";
import { formatVideoDuration } from "@/features/wall/video-notes";
import { getWallNoteViewModel, stripWikiLinkMarkup } from "@/features/wall/wall-note-view-model";

export type WallNotePresentation = {
  resolvedNoteColor: string;
  noteCornerRadius: number;
  noteTextStyle: { fontSize: number; lineHeight: number };
  noteTextFontFamily: string;
  isQuote: boolean;
  isCanon: boolean;
  isJournal: boolean;
  isEisenhower: boolean;
  isPrivate: boolean;
  isBookmark: boolean;
  isAudio: boolean;
  isVideo: boolean;
  isStandardNote: boolean;
  canonTitle?: string;
  quoteAttribution: string;
  quoteSource: string;
  quoteFooterLines: number;
  quoteFooterHeight: number;
  quoteBodyTopInset: number;
  canonTitleInset: number;
  textX: number;
  textWidth: number;
  imageUrl?: string;
  bookmarkImageUrl?: string;
  bookmarkFaviconUrl?: string;
  isImageNote: boolean;
  baseShellFill: string;
  resolvedTextColor: string;
  paperTintOpacity: number;
  imageCaption: string;
  standardTitle: string;
  standardBody: string;
  looksLikeCode: boolean;
  looksLikeFile: boolean;
  fileLabel: string;
  fileMeta: string;
  audioTitle: string;
  audioMeta: string;
  isAudioPlaying: boolean;
  audioCurrentTime: string;
  audioDuration: string;
  isInlineVideoPlaying: boolean;
  videoTitle: string;
  videoMeta: string;
  videoDuration: string;
  videoCurrentTime: string;
  videoPoster?: string;
  journalTitle: string;
  journalBody: string;
  journalDateLabel: string;
  showStandardTextCard: boolean;
  wikiLinks: Array<{ targetNoteId: string; title: string }>;
  wikiFooterHeight: number;
  quoteBodyText: string;
  noteTextContent: string;
  noteTags: string[];
  overflowTags: number;
  textY: number;
  textHeight: number;
};

type BuildWallNotePresentationOptions = {
  note: Note;
  noteView: Note;
  resolvedAssetRecords: WallAssetMap;
  wikiLinks: Array<{ targetNoteId: string; title: string }>;
  playingAudioNoteId?: string;
  playingAudioCurrentTimeSeconds?: number;
  playingAudioDurationSeconds?: number;
  inlinePlayingVideoNoteId?: string;
  getNoteTextStyle: (size?: Note["textSize"], textSizePx?: number) => { fontSize: number; lineHeight: number };
  getNoteTextFontFamily: (font?: Note["textFont"]) => string;
  truncateNoteText: (text: string, note: Note) => string;
};

export const buildWallNotePresentation = ({
  note,
  noteView,
  resolvedAssetRecords,
  wikiLinks,
  playingAudioNoteId,
  playingAudioCurrentTimeSeconds,
  playingAudioDurationSeconds,
  inlinePlayingVideoNoteId,
  getNoteTextStyle,
  getNoteTextFontFamily,
  truncateNoteText,
}: BuildWallNotePresentationOptions): WallNotePresentation => {
  const resolvedNoteColor = resolveNoteFillColor(noteView);
  const noteTextStyle = getNoteTextStyle(noteView.textSize, noteView.textSizePx);
  const noteTextFontFamily = getNoteTextFontFamily(noteView.textFont);
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
  const bookmarkMetadata = noteView.bookmark?.metadata;
  const bookmarkImageUrl = bookmarkMetadata?.imageUrl?.trim();
  const bookmarkFaviconUrl = bookmarkMetadata?.faviconUrl?.trim();
  const isImageNote = Boolean(imageUrl);
  const baseShellFill = isStandardNote ? "#FFFFFF" : atelierPalette.paper;
  const defaultTextColor =
    isQuote || isJournal || isBookmark || isImageNote || isPrivate || isAudio ? getContrastTextColor(resolvedNoteColor) : atelierPalette.text;
  const resolvedTextColor = noteView.textColor ?? defaultTextColor;
  const paperTintOpacity = isStandardNote ? 0.02 : isQuote ? 0.06 : 0.1;
  const noteViewModel = getWallNoteViewModel(noteView, { surface: "canvas-full", uppercaseMeta: true });
  const imageCaption = noteViewModel.imageCaption;
  const strippedNoteText = stripWikiLinkMarkup(noteView.text);
  const standardTitle = isStandardNote ? noteViewModel.standardTitle : "";
  const standardBody = isStandardNote ? noteViewModel.standardBody : strippedNoteText;
  const looksLikeCode = /(^|\n)\s*(def |const |let |function |class |import |from |<\w)|=>|\{\s*$|console\.|return\s+/m.test(strippedNoteText);
  const fileNameMatch = strippedNoteText.match(/([\w-]+\.(pdf|docx?|txt|png|jpe?g|zip|csv|md))/i);
  const looksLikeFile = !isAudio && !isVideo && (noteView.noteKind === "file" || Boolean(fileNameMatch));
  const fileLabel = looksLikeFile ? noteViewModel.title : "Document";
  const fileMeta = looksLikeFile ? noteViewModel.metaDisplay : "File note";
  const audioTitle = noteViewModel.title;
  const audioMeta = noteViewModel.metaDisplay;
  const isAudioPlaying = isAudio && playingAudioNoteId === note.id;
  const audioDurationSeconds = isAudioPlaying ? playingAudioDurationSeconds ?? noteView.audio?.durationSeconds : noteView.audio?.durationSeconds;
  const audioCurrentTime = formatAudioDuration(isAudioPlaying ? playingAudioCurrentTimeSeconds : 0);
  const audioDuration = formatAudioDuration(audioDurationSeconds);
  const isInlineVideoPlaying = isVideo && inlinePlayingVideoNoteId === note.id;
  const videoTitle = noteViewModel.title;
  const videoMeta = noteViewModel.metaDisplay;
  const videoDuration = formatVideoDuration(noteView.video?.durationSeconds);
  const videoCurrentTime = formatVideoDuration(noteView.video?.durationSeconds ? Math.max(0, Math.round(noteView.video.durationSeconds * 0.35)) : 0);
  const videoPoster = resolveVideoPosterAssetUrl(noteView, resolvedAssetRecords);
  const journalTitle = noteViewModel.journalTitle;
  const journalBody = noteViewModel.journalBody;
  const showStandardTextCard = !isPrivate && isStandardNote && !isAudio && !isVideo && !isImageNote && !isBookmark && !isEisenhower && !looksLikeCode && !looksLikeFile && !isJournal && !isQuote;
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
  const textY = isImageNote ? 0 : 12 + quoteBodyTopInset + canonTitleInset + (isJournal ? 56 : 0);
  const textHeight = isImageNote
    ? 0
    : Math.max(0, noteView.h - 56 - quoteFooterHeight - quoteBodyTopInset - canonTitleInset - (isJournal ? 56 : 0) - wikiFooterHeight);
  const journalDateLabel = isJournal ? formatJournalDateLabel(noteView.createdAt) : "";

  return {
    resolvedNoteColor,
    noteCornerRadius: getNoteCornerRadius(noteView),
    noteTextStyle,
    noteTextFontFamily,
    isQuote,
    isCanon,
    isJournal,
    isEisenhower,
    isPrivate,
    isBookmark,
    isAudio,
    isVideo,
    isStandardNote,
    canonTitle,
    quoteAttribution,
    quoteSource,
    quoteFooterLines,
    quoteFooterHeight,
    quoteBodyTopInset,
    canonTitleInset,
    textX,
    textWidth,
    imageUrl,
    bookmarkImageUrl,
    bookmarkFaviconUrl,
    isImageNote,
    baseShellFill,
    resolvedTextColor,
    paperTintOpacity,
    imageCaption,
    standardTitle,
    standardBody,
    looksLikeCode,
    looksLikeFile,
    fileLabel,
    fileMeta,
    audioTitle,
    audioMeta,
    isAudioPlaying,
    audioCurrentTime,
    audioDuration,
    isInlineVideoPlaying,
    videoTitle,
    videoMeta,
    videoDuration,
    videoCurrentTime,
    videoPoster,
    journalTitle,
    journalBody,
    journalDateLabel,
    showStandardTextCard,
    wikiLinks,
    wikiFooterHeight,
    quoteBodyText,
    noteTextContent,
    noteTags,
    overflowTags,
    textY,
    textHeight,
  };
};
