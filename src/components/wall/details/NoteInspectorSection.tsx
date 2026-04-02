"use client";

import { useRef, useState } from "react";

import {
  detailButton,
  detailChip,
  detailField,
  detailInsetCard,
  detailMutedPanel,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionTitle,
} from "@/components/wall/details/detailSectionStyles";
import { APOD_NOTE_DEFAULTS, defaultApodNoteState } from "@/features/wall/apod";
import { createAudioNoteState, getAudioNoteMeta, getAudioNoteTitle, toAudioNotePatch } from "@/features/wall/audio-notes";
import { createVideoNoteState, getVideoNoteMeta, getVideoNoteTitle, toVideoNotePatch, VIDEO_NOTE_DEFAULTS } from "@/features/wall/video-notes";
import {
  DEFAULT_POETRY_MATCH_TYPE,
  DEFAULT_POETRY_SEARCH_FIELD,
  defaultPoetryNoteState,
  normalizePoetryMatchType,
  normalizePoetrySearchField,
  normalizePoetrySearchQuery,
  POETRY_SEARCH_FIELD_OPTIONS,
} from "@/features/wall/poetry";
import { AUDIO_NOTE_DEFAULTS, EISENHOWER_NOTE_DEFAULTS, JOURNAL_NOTE_DEFAULTS, NOTE_COLORS, NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS, POETRY_NOTE_DEFAULTS } from "@/features/wall/constants";
import { createBookmarkNoteState, normalizeBookmarkUrl, WEB_BOOKMARK_DEFAULTS } from "@/features/wall/bookmarks";
import { createFileNoteState, getFileNoteMeta, getFileNoteTitle, normalizeFileUrl, toFileNotePatch } from "@/features/wall/file-notes";
import { createImageNoteState, getImageNoteFilename, getImageNoteMeta, renameImageNoteFile, toImageNotePatch } from "@/features/wall/image-notes";
import { ECONOMIST_MAGAZINE_SOURCES, ECONOMIST_NOTE_DEFAULTS, formatEconomistNoteText, getEconomistMagazineSource, getEconomistNoteSourceId } from "@/features/wall/economist";
import { createEisenhowerNotePayload } from "@/features/wall/eisenhower";
import { sanitizeStandardNoteColor } from "@/features/wall/special-notes";
import type { Note, NoteTextFont, PoetrySearchField, PoetrySearchMatchType } from "@/features/wall/types";

type PoetryRefreshOptions = {
  force?: boolean;
  field?: PoetrySearchField;
  query?: string;
  matchType?: PoetrySearchMatchType;
};

type NoteInspectorSectionProps = {
  selectedNote?: Note;
  notes: Note[];
  isTimeLocked: boolean;
  hasJokerNote: boolean;
  hasThroneNote: boolean;
  linkingFromNoteId?: string;
  isFocused: boolean;
  backlinks: Array<{ noteId: string; title: string }>;
  onNavigateLinkedNote: (noteId: string) => void;
  onTextFontChange: (font: NoteTextFont) => void;
  onTextSizeChange: (sizePx: number) => void;
  onTextColorChange: (color: string) => void;
  onTextHorizontalAlignChange: (align: "left" | "center" | "right") => void;
  onTextVerticalAlignChange: (align: "top" | "middle" | "bottom") => void;
  onBackgroundColorChange: (color: string) => void;
  onDuplicate: (noteId: string) => void;
  pageReference?: { docId: string; blockId: string };
  pageConversion?: { docId: string };
  onReferenceInPage: (noteId: string) => void;
  onOpenPageReference: (noteId: string) => void;
  onUndoPageReference: (noteId: string) => void;
  onConvertToPage: (noteId: string) => void;
  onOpenConvertedPage: (noteId: string) => void;
  onUndoPageConversion: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onToggleHighlight: (noteId: string) => void;
  onToggleFocus: (noteId: string) => void;
  onToggleOrRefreshJoker: (noteId: string) => void;
  onToggleOrRefreshThrone: (noteId: string) => void;
  onRefreshPoetry: (noteId: string, options?: PoetryRefreshOptions) => void;
  onRefreshEconomist: (noteId: string, year?: string) => void;
  onStartLink: (noteId: string) => void;
  onUpdateNote: (noteId: string, patch: Partial<Note>) => void;
  onSubmitBookmarkUrl: (noteId: string, url: string, options?: { force?: boolean }) => void;
  onOpenBookmarkUrl: (url: string) => void;
  onSelectImageNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitImageNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameImageNote: (noteId: string, name: string) => void;
  onOpenImageNote: (noteId: string) => void;
  onDownloadImageNote: (noteId: string) => void;
  onSelectFileNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitFileNoteUrl: (noteId: string, url: string) => void;
  onOpenFileNote: (noteId: string) => void;
  onDownloadFileNote: (noteId: string) => void;
  onSelectAudioNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitAudioNoteUrl: (noteId: string, url: string) => void;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  onSelectVideoNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitVideoNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameVideoNote: (noteId: string, name: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
  privateNoteSupported: boolean;
  isPrivateEnabled: boolean;
  isPrivateUnlocked: boolean;
  onProtectPrivateNote: (noteId: string) => void;
  onUnlockPrivateNote: (noteId: string) => void;
  onLockPrivateNote: (noteId: string) => void;
  onRemovePrivateProtection: (noteId: string) => void;
};

const sectionBlockClass = "space-y-2 border-t border-[var(--color-border-muted)] pt-3 first:border-t-0 first:pt-0";
const sectionLabelClass = "text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]";
const segmentedRowClass = "grid grid-cols-3 gap-1";
const segmentedButtonClass = `${detailButton} px-0 py-2 text-center text-[11px]`;
const segmentedButtonActiveClass =
  "rounded-[0.95rem] border border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.10)] px-0 py-2 text-center text-[11px] font-medium text-[var(--color-accent-strong)] shadow-[var(--shadow-sm)]";
const actionGridClass = "grid grid-cols-2 gap-2";

const typeButtonClass = (active: boolean) =>
  active
    ? "rounded-[0.95rem] border border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.10)] px-2 py-2 text-[11px] font-medium text-[var(--color-accent-strong)] shadow-[var(--shadow-sm)]"
    : detailButton;

const colorSwatchClass = "h-7 w-8 cursor-pointer overflow-hidden rounded-md border border-[var(--color-border)] bg-transparent p-0";

const CODE_NOTE_TEMPLATE = `\`\`\`ts
const idea = "";
\`\`\``;
const CODE_NOTE_COLOR = "#1F1F21";
const CODE_NOTE_TEXT_COLOR = "#D4D4D4";
const CODE_NOTE_TEXT_SIZE = 14;

const isCodeNoteText = (text: string) =>
  /^```[\w-]*\n[\s\S]*\n```$/.test(text.trim()) ||
  /(^|\n)\s*(def |const |let |function |class |import |from |<\w)|=>|\{\s*$|console\.|return\s+/m.test(text);

const toCodeNoteText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return CODE_NOTE_TEMPLATE;
  }
  if (/^```[\w-]*\n[\s\S]*\n```$/.test(trimmed)) {
    return trimmed;
  }
  return `\`\`\`
${trimmed}
\`\`\``;
};

const fromCodeNoteText = (text: string) => {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[^\n`]*\n([\s\S]*?)\n```$/);
  return match?.[1] ?? text;
};

export const NoteInspectorSection = ({
  selectedNote,
  notes,
  isTimeLocked,
  hasJokerNote,
  hasThroneNote,
  linkingFromNoteId,
  isFocused,
  backlinks,
  onNavigateLinkedNote,
  onTextFontChange,
  onTextSizeChange,
  onTextColorChange,
  onTextHorizontalAlignChange,
  onTextVerticalAlignChange,
  onBackgroundColorChange,
  onDuplicate,
  pageReference,
  pageConversion,
  onReferenceInPage,
  onOpenPageReference,
  onUndoPageReference,
  onConvertToPage,
  onOpenConvertedPage,
  onUndoPageConversion,
  onTogglePin,
  onToggleHighlight,
  onToggleFocus,
  onToggleOrRefreshJoker,
  onToggleOrRefreshThrone,
  onRefreshPoetry,
  onRefreshEconomist,
  onStartLink,
  onUpdateNote,
  onSubmitBookmarkUrl,
  onOpenBookmarkUrl,
  onSelectImageNoteFile,
  onSubmitImageNoteUrl,
  onRenameImageNote,
  onOpenImageNote,
  onDownloadImageNote,
  onSelectFileNoteFile,
  onSubmitFileNoteUrl,
  onOpenFileNote,
  onDownloadFileNote,
  onSelectAudioNoteFile,
  onSubmitAudioNoteUrl,
  onOpenAudioNote,
  onDownloadAudioNote,
  onSelectVideoNoteFile,
  onSubmitVideoNoteUrl,
  onRenameVideoNote,
  onOpenVideoNote,
  onDownloadVideoNote,
  privateNoteSupported,
  isPrivateEnabled,
  isPrivateUnlocked,
  onProtectPrivateNote,
  onUnlockPrivateNote,
  onLockPrivateNote,
  onRemovePrivateProtection,
}: NoteInspectorSectionProps) => {
  const [poetrySearchField, setPoetrySearchField] = useState<PoetrySearchField>(
    selectedNote?.noteKind === "poetry" ? normalizePoetrySearchField(selectedNote.poetry?.searchField) : DEFAULT_POETRY_SEARCH_FIELD,
  );
  const [poetrySearchQuery, setPoetrySearchQuery] = useState(
    selectedNote?.noteKind === "poetry" ? normalizePoetrySearchQuery(selectedNote.poetry?.searchQuery) : "",
  );
  const [poetryMatchType, setPoetryMatchType] = useState<PoetrySearchMatchType>(
    selectedNote?.noteKind === "poetry" ? normalizePoetryMatchType(selectedNote.poetry?.matchType) : DEFAULT_POETRY_MATCH_TYPE,
  );
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  if (!selectedNote) {
    return null;
  }

  const selectedMagazineSourceId = selectedNote.noteKind === "economist" ? getEconomistNoteSourceId(selectedNote) ?? "economist" : "economist";
  const isCodeNote = selectedNote.noteKind === "standard" && isCodeNoteText(selectedNote.text);
  const usedMagazineSourceIds = new Set(
    notes
      .filter((note) => note.id !== selectedNote.id && note.noteKind === "economist")
      .map((note) => getEconomistNoteSourceId(note))
      .filter((sourceId): sourceId is NonNullable<ReturnType<typeof getEconomistNoteSourceId>> => Boolean(sourceId)),
  );
  const preferredMagazineSourceId =
    ECONOMIST_MAGAZINE_SOURCES.find((source) => !usedMagazineSourceIds.has(source.sourceId))?.sourceId ?? selectedMagazineSourceId;

  const applyImageNote = () => {
    const imagePatch = toImageNotePatch(createImageNoteState(selectedNote.file ?? { url: selectedNote.imageUrl ?? "" }), {
      caption: selectedNote.text,
      preserveSize: selectedNote.noteKind === "image",
    });
    onUpdateNote(selectedNote.id, {
      ...imagePatch,
      w: selectedNote.noteKind === "image" ? selectedNote.w : imagePatch.w,
      h: selectedNote.noteKind === "image" ? selectedNote.h : imagePatch.h,
    });
  };

  const applyCodeNote = () => {
    onUpdateNote(selectedNote.id, {
      noteKind: "standard",
      text: toCodeNoteText(selectedNote.text),
      quoteAuthor: undefined,
      quoteSource: undefined,
      canon: undefined,
      eisenhower: undefined,
      bookmark: undefined,
      apod: undefined,
      poetry: undefined,
      economist: undefined,
      imageUrl: undefined,
      vocabulary: undefined,
      color: CODE_NOTE_COLOR,
      textColor: CODE_NOTE_TEXT_COLOR,
      textSizePx: CODE_NOTE_TEXT_SIZE,
      textAlign: "left",
      textVAlign: "top",
      w: Math.max(selectedNote.w, 320),
      h: Math.max(selectedNote.h, 220),
      tags: [...new Set([...selectedNote.tags, "code"])],
    });
  };

  const setNoteKind = (kind: Note["noteKind"]) => {
    const nextKind = selectedNote.noteKind === kind ? "standard" : kind;
    const toStandard = nextKind === "standard" && selectedNote.noteKind !== "standard";
    const toQuote = nextKind === "quote" && selectedNote.noteKind !== "quote";
    const toCanon = nextKind === "canon" && selectedNote.noteKind !== "canon";
    const toJournal = nextKind === "journal" && selectedNote.noteKind !== "journal";
    const toEisenhower = nextKind === "eisenhower" && selectedNote.noteKind !== "eisenhower";
    const toBookmark = nextKind === "web-bookmark" && selectedNote.noteKind !== "web-bookmark";
    const toApod = nextKind === "apod" && selectedNote.noteKind !== "apod";
    const toPoetry = nextKind === "poetry" && selectedNote.noteKind !== "poetry";
    const toEconomist = nextKind === "economist" && selectedNote.noteKind !== "economist";
    const toFile = nextKind === "file" && selectedNote.noteKind !== "file";
    const toAudio = nextKind === "audio" && selectedNote.noteKind !== "audio";
    const toVideo = nextKind === "video" && selectedNote.noteKind !== "video";
    const fromCodeNote = selectedNote.noteKind === "standard" && isCodeNoteText(selectedNote.text);
    const economistSource = getEconomistMagazineSource(toEconomist ? preferredMagazineSourceId : selectedMagazineSourceId);
    const filePatch = toFile ? toFileNotePatch(createFileNoteState(selectedNote.file)) : undefined;
    const audioPatch = toAudio ? toAudioNotePatch(createAudioNoteState(selectedNote.audio)) : undefined;
    const videoPatch = toVideo ? toVideoNotePatch(createVideoNoteState(selectedNote.video)) : undefined;

    onUpdateNote(selectedNote.id, {
      ...(filePatch ?? {}),
      ...(audioPatch ?? {}),
      ...(videoPatch ?? {}),
      noteKind: nextKind,
      text: toFile
        ? filePatch?.text ?? selectedNote.text
        : toAudio
          ? audioPatch?.text ?? selectedNote.text
          : toVideo
            ? videoPatch?.text ?? selectedNote.text
          : toBookmark
            ? ""
            : toEconomist
              ? formatEconomistNoteText({ sourceName: economistSource.sourceName, displayLabel: "Latest cover", displayDate: "" })
              : toStandard && fromCodeNote
                ? fromCodeNoteText(selectedNote.text)
                : toStandard && selectedNote.noteKind === "file"
                  ? selectedNote.file?.name ?? selectedNote.text
                  : toStandard && selectedNote.noteKind === "audio"
                    ? selectedNote.audio?.name ?? selectedNote.text
                    : toStandard && selectedNote.noteKind === "video"
                      ? selectedNote.video?.name ?? selectedNote.text
                      : selectedNote.text,
      quoteAuthor: toStandard ? undefined : toQuote ? "" : toEconomist ? economistSource.sourceUrl : undefined,
      quoteSource: toStandard ? undefined : toQuote ? "" : toEconomist ? "Latest cover" : undefined,
      canon: toCanon
        ? {
            mode: "single",
            title: "",
            statement: "",
            interpretation: "",
            example: "",
            source: "",
            items: [{ id: `canon-item-${Date.now()}`, title: "", text: "", interpretation: "" }],
          }
        : undefined,
      eisenhower: toStandard ? undefined : toEisenhower ? createEisenhowerNotePayload(selectedNote.createdAt) : undefined,
      bookmark: toStandard ? undefined : toBookmark ? createBookmarkNoteState(selectedNote.bookmark?.url ?? "") : undefined,
      apod: toStandard ? undefined : toApod ? defaultApodNoteState(selectedNote.apod) : undefined,
      poetry: toStandard ? undefined : toPoetry ? defaultPoetryNoteState(selectedNote.poetry) : undefined,
      economist: toStandard || toFile || toAudio || toVideo ? undefined : selectedNote.economist,
      file: toStandard || toAudio || toVideo ? undefined : filePatch?.file,
      audio: toStandard || toFile || toVideo ? undefined : audioPatch?.audio,
      video: toStandard || toFile || toAudio ? undefined : videoPatch?.video,
      imageUrl: toStandard || toBookmark || toApod || toPoetry || toEconomist || toFile || toAudio || toVideo ? undefined : selectedNote.imageUrl,
      vocabulary: toStandard || toCanon || toJournal || toEisenhower || toBookmark || toApod || toPoetry || toEconomist || toFile || toAudio || toVideo ? undefined : selectedNote.vocabulary,
      color: toStandard
        ? sanitizeStandardNoteColor(fromCodeNote ? NOTE_COLORS[0] ?? "#FEEA89" : selectedNote.color, NOTE_COLORS[0] ?? "#FEEA89")
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.color
          : toApod
            ? APOD_NOTE_DEFAULTS.color
            : toFile
              ? filePatch?.color ?? selectedNote.color
              : toAudio
                ? audioPatch?.color ?? AUDIO_NOTE_DEFAULTS.color
                : toVideo
                  ? videoPatch?.color ?? VIDEO_NOTE_DEFAULTS.color
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.color
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.color
                    : toJournal
                      ? JOURNAL_NOTE_DEFAULTS.color
                      : toEisenhower
                        ? EISENHOWER_NOTE_DEFAULTS.color
                        : selectedNote.color,
      textFont: toStandard
        ? NOTE_DEFAULTS.textFont
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.textFont
          : toApod
            ? APOD_NOTE_DEFAULTS.textFont
            : toFile
              ? filePatch?.textFont ?? selectedNote.textFont
              : toAudio
                ? audioPatch?.textFont ?? selectedNote.textFont
                : toVideo
                  ? videoPatch?.textFont ?? selectedNote.textFont
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.textFont
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.textFont
                    : toJournal
                      ? JOURNAL_NOTE_DEFAULTS.textFont
                      : toEisenhower
                        ? EISENHOWER_NOTE_DEFAULTS.textFont
                        : selectedNote.textFont,
      textColor: toStandard
        ? NOTE_DEFAULTS.textColor
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.textColor
          : toApod
            ? APOD_NOTE_DEFAULTS.textColor
            : toFile
              ? filePatch?.textColor ?? selectedNote.textColor
              : toAudio
                ? audioPatch?.textColor ?? selectedNote.textColor
                : toVideo
                  ? videoPatch?.textColor ?? selectedNote.textColor
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.textColor
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.textColor
                    : toJournal
                      ? JOURNAL_NOTE_DEFAULTS.textColor
                      : toEisenhower
                        ? EISENHOWER_NOTE_DEFAULTS.textColor
                        : selectedNote.textColor,
      textSizePx: toStandard
        ? NOTE_DEFAULTS.textSizePx
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.textSizePx
          : toApod
            ? APOD_NOTE_DEFAULTS.textSizePx
            : toFile
              ? filePatch?.textSizePx ?? selectedNote.textSizePx
              : toAudio
                ? audioPatch?.textSizePx ?? selectedNote.textSizePx
                : toVideo
                  ? videoPatch?.textSizePx ?? selectedNote.textSizePx
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.textSizePx
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.textSizePx
                    : toJournal
                      ? JOURNAL_NOTE_DEFAULTS.textSizePx
                      : toEisenhower
                        ? EISENHOWER_NOTE_DEFAULTS.textSizePx
                        : selectedNote.textSizePx,
      w: toStandard
        ? NOTE_DEFAULTS.width
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.width
          : toApod
            ? APOD_NOTE_DEFAULTS.width
            : toFile
              ? filePatch?.w ?? selectedNote.w
              : toAudio
                ? audioPatch?.w ?? selectedNote.w
                : toVideo
                  ? videoPatch?.w ?? selectedNote.w
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.width
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.width
                    : toEisenhower
                      ? EISENHOWER_NOTE_DEFAULTS.width
                      : selectedNote.w,
      h: toStandard
        ? NOTE_DEFAULTS.height
        : toBookmark
          ? WEB_BOOKMARK_DEFAULTS.height
          : toApod
            ? APOD_NOTE_DEFAULTS.height
            : toFile
              ? filePatch?.h ?? selectedNote.h
              : toAudio
                ? audioPatch?.h ?? selectedNote.h
                : toVideo
                  ? videoPatch?.h ?? selectedNote.h
                : toPoetry
                  ? POETRY_NOTE_DEFAULTS.height
                  : toEconomist
                    ? ECONOMIST_NOTE_DEFAULTS.height
                    : toEisenhower
                      ? EISENHOWER_NOTE_DEFAULTS.height
                      : selectedNote.h,
      tags: toJournal
        ? [...new Set([...selectedNote.tags, "journal"])]
        : toEisenhower
          ? [...new Set([...selectedNote.tags, "matrix", "priority"])]
          : toBookmark
            ? [...new Set([...selectedNote.tags, "bookmark", "link"])]
            : toApod
              ? [...new Set([...selectedNote.tags, "space", "nasa", "apod"])]
              : toFile
                ? ["file"]
                : toAudio
                  ? ["audio"]
                  : toVideo
                    ? ["video"]
                  : toPoetry
                    ? [...new Set([...selectedNote.tags, "poetry", "poem"])]
                    : toEconomist
                      ? [economistSource.sourceId, "cover", "magazine"]
                      : selectedNote.tags,
    });
  };

  const applyMagazineSource = (sourceId: string) => {
    const source = getEconomistMagazineSource(sourceId);
    onUpdateNote(selectedNote.id, {
      text: formatEconomistNoteText({ sourceName: source.sourceName, displayLabel: "Latest cover", displayDate: "" }),
      quoteAuthor: source.sourceUrl,
      quoteSource: "Latest cover",
      imageUrl: undefined,
      tags: [source.sourceId, "cover", "magazine"],
    });
    onRefreshEconomist(selectedNote.id);
  };

  const normalizedPoetryQuery = normalizePoetrySearchQuery(poetrySearchQuery);
  const effectivePoetryMatchType = poetrySearchField === "linecount" ? "exact" : poetryMatchType;
  const poetryFieldMeta = POETRY_SEARCH_FIELD_OPTIONS.find((option) => option.value === poetrySearchField) ?? POETRY_SEARCH_FIELD_OPTIONS[0];
  const canSearchPoetry = poetrySearchField === "random" || Boolean(normalizedPoetryQuery);
  const poetrySearchSummary =
    selectedNote.noteKind === "poetry"
      ? normalizePoetrySearchField(selectedNote.poetry?.searchField) === "random"
        ? "Daily random poem"
        : `${normalizePoetrySearchField(selectedNote.poetry?.searchField)}: ${selectedNote.poetry?.searchQuery || "Not set"}`
      : "";

  return (
    <section className={detailSectionCard} aria-label="Note inspector">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={detailSectionTitle}>Note Inspector</p>
          <h4 className={detailSectionHeading}>{isCodeNote ? "Code note" : selectedNote.noteKind === "standard" ? "Default note" : `${selectedNote.noteKind} note`}</h4>
          <p className={detailSectionDescription}>Typography, backlinks, styling, and note properties for the current selection.</p>
        </div>
        <div className={detailInsetCard}>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Selected</p>
          <p className="mt-1 text-xs font-medium text-[var(--color-text)]">1 note</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Privacy</p>
          {isPrivateEnabled ? (
            <div className="grid gap-2">
              <div className={detailMutedPanel}>{isPrivateUnlocked ? "This note is currently unlocked in this browser session. The wall still shows a protected shell." : "This note is protected. Enter the password to unlock it."}</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => (isPrivateUnlocked ? onLockPrivateNote(selectedNote.id) : onUnlockPrivateNote(selectedNote.id))} className={detailButton} disabled={isTimeLocked}>
                  {isPrivateUnlocked ? "Lock note" : "Unlock note"}
                </button>
                <button type="button" onClick={() => onRemovePrivateProtection(selectedNote.id)} className={detailButton} disabled={isTimeLocked || !isPrivateUnlocked}>
                  Remove protection
                </button>
              </div>
            </div>
          ) : privateNoteSupported ? (
            <div className="grid gap-2">
              <div className={detailMutedPanel}>Seal this note behind a password. Content stays hidden on the wall and in standard exports.</div>
              <button type="button" onClick={() => onProtectPrivateNote(selectedNote.id)} className={detailButton} disabled={isTimeLocked}>Protect note</button>
            </div>
          ) : (
            <div className={detailMutedPanel}>This note cannot be protected right now.</div>
          )}
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Text</p>
          <div className="grid gap-2">
            <select
              value={selectedNote.textFont ?? "nunito"}
              onChange={(event) => onTextFontChange(event.target.value as NoteTextFont)}
              className={detailField}
              disabled={isTimeLocked || isPrivateEnabled}
              aria-label="Font family"
            >
              {NOTE_TEXT_FONTS.map((option) => (
                <option key={`inspector-font-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select
                value={selectedNote.textSizePx ?? NOTE_DEFAULTS.textSizePx}
                onChange={(event) => onTextSizeChange(Number(event.target.value))}
                className={detailField}
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Font size"
              >
                {NOTE_TEXT_SIZE_OPTIONS.map((size) => (
                  <option key={`inspector-size-${size}`} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
              <label className="flex min-w-[6.25rem] items-center justify-between rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] shadow-[var(--shadow-sm)]">
                <span>Color</span>
                <input
                  type="color"
                  value={selectedNote.textColor ?? NOTE_DEFAULTS.textColor}
                  onChange={(event) => onTextColorChange(event.target.value.toUpperCase())}
                  className={colorSwatchClass}
                  disabled={isTimeLocked || isPrivateEnabled}
                  aria-label="Text color"
                />
              </label>
            </div>
          </div>
        </div>

        {selectedNote.noteKind === "quote" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Quote Details</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={selectedNote.quoteAuthor ?? ""}
                onChange={(event) => onUpdateNote(selectedNote.id, { quoteAuthor: event.target.value })}
                className={detailField}
                placeholder="Author"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Quote author"
              />
              <input
                type="text"
                value={selectedNote.quoteSource ?? ""}
                onChange={(event) => onUpdateNote(selectedNote.id, { quoteSource: event.target.value })}
                className={detailField}
                placeholder="Source"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Quote source"
              />
            </div>
          </div>
        )}

        {selectedNote.noteKind === "web-bookmark" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Bookmark</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={selectedNote.bookmark?.url ?? ""}
                onChange={(event) =>
                  onUpdateNote(selectedNote.id, {
                    bookmark: {
                      ...(selectedNote.bookmark ?? createBookmarkNoteState()),
                      url: event.target.value,
                      normalizedUrl: normalizeBookmarkUrl(event.target.value),
                    },
                  })
                }
                onBlur={(event) => {
                  if (event.target.value.trim()) {
                    onSubmitBookmarkUrl(selectedNote.id, event.target.value);
                  }
                }}
                className={detailField}
                placeholder="https://example.com"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Bookmark URL"
              />
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onSubmitBookmarkUrl(selectedNote.id, selectedNote.bookmark?.url ?? "")} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Fetch</button>
                <button type="button" onClick={() => onSubmitBookmarkUrl(selectedNote.id, selectedNote.bookmark?.url ?? "", { force: true })} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Refresh</button>
                <button
                  type="button"
                  onClick={() => {
                    const targetUrl = selectedNote.bookmark?.metadata?.finalUrl ?? selectedNote.bookmark?.normalizedUrl ?? selectedNote.bookmark?.url;
                    if (targetUrl) {
                      onOpenBookmarkUrl(targetUrl);
                    }
                  }}
                  className={detailButton}
                  disabled={!selectedNote.bookmark?.url}
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedNote.noteKind === "image" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Image</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={getImageNoteFilename(selectedNote.file)}
                onChange={(event) => onRenameImageNote(selectedNote.id, event.target.value)}
                className={detailField}
                placeholder="Image file name"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Image file name"
              />
              <textarea
                value={selectedNote.text}
                onChange={(event) => onUpdateNote(selectedNote.id, { text: event.target.value })}
                className={`${detailField} min-h-20 resize-y`}
                placeholder="Caption"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Image caption"
              />
              <input
                type="text"
                value={selectedNote.file?.source === "link" ? selectedNote.file.url : selectedNote.imageUrl ?? ""}
                onChange={(event) =>
                  onUpdateNote(selectedNote.id, {
                    ...renameImageNoteFile(selectedNote, getImageNoteFilename(selectedNote.file)),
                    imageUrl: event.target.value,
                    file: createImageNoteState({
                      ...(selectedNote.file ?? createImageNoteState()),
                      source: "link",
                      url: event.target.value,
                    }),
                  })
                }
                onBlur={(event) => {
                  const normalized = normalizeFileUrl(event.target.value);
                  if (normalized) {
                    void onSubmitImageNoteUrl(selectedNote.id, normalized);
                  }
                }}
                className={detailField}
                placeholder="https://example.com/image.jpg"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Image URL"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => imageInputRef.current?.click()} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Upload Image</button>
                <button type="button" onClick={() => void onSubmitImageNoteUrl(selectedNote.id, selectedNote.file?.source === "link" ? selectedNote.file.url : selectedNote.imageUrl ?? "")} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Save Link</button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onSelectImageNoteFile(selectedNote.id, file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onOpenImageNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.imageUrl}>Open Image</button>
                <button type="button" onClick={() => onDownloadImageNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.imageUrl}>Download Image</button>
              </div>
              <div className={detailMutedPanel}>{`${getImageNoteFilename(selectedNote.file)}${selectedNote.file ? ` • ${getImageNoteMeta(selectedNote.file)}` : ""}`}</div>
            </div>
          </div>
        )}

        {selectedNote.noteKind === "file" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>File</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={selectedNote.file?.source === "link" ? selectedNote.file.url : ""}
                onChange={(event) =>
                  onUpdateNote(selectedNote.id, {
                    ...toFileNotePatch(
                      createFileNoteState({
                        ...(selectedNote.file ?? createFileNoteState()),
                        source: "link",
                        url: event.target.value,
                      }),
                    ),
                  })
                }
                onBlur={(event) => {
                  const normalized = normalizeFileUrl(event.target.value);
                  if (normalized) {
                    onSubmitFileNoteUrl(selectedNote.id, normalized);
                  }
                }}
                className={detailField}
                placeholder="https://example.com/document.pdf"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="File URL"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Upload File</button>
                <button type="button" onClick={() => onSubmitFileNoteUrl(selectedNote.id, selectedNote.file?.source === "link" ? selectedNote.file.url : "")} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Save Link</button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onSelectFileNoteFile(selectedNote.id, file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onOpenFileNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.file?.url}>Open</button>
                <button type="button" onClick={() => onDownloadFileNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.file?.url}>Download</button>
              </div>
              <div className={detailMutedPanel}>{`${getFileNoteTitle(selectedNote.file)}${selectedNote.file ? ` • ${getFileNoteMeta(selectedNote.file)}` : ""}`}</div>
            </div>
          </div>
        )}

        {selectedNote.noteKind === "audio" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Audio</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={selectedNote.audio?.source === "link" ? selectedNote.audio.url : ""}
                onChange={(event) =>
                  onUpdateNote(selectedNote.id, {
                    ...toAudioNotePatch(
                      createAudioNoteState({
                        ...(selectedNote.audio ?? createAudioNoteState()),
                        source: "link",
                        url: event.target.value,
                      }),
                    ),
                  })
                }
                onBlur={(event) => {
                  const normalized = normalizeFileUrl(event.target.value);
                  if (normalized) {
                    onSubmitAudioNoteUrl(selectedNote.id, normalized);
                  }
                }}
                className={detailField}
                placeholder="https://example.com/audio.mp3"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Audio URL"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => audioInputRef.current?.click()} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Upload Audio</button>
                <button type="button" onClick={() => onSubmitAudioNoteUrl(selectedNote.id, selectedNote.audio?.source === "link" ? selectedNote.audio.url : "")} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Save Link</button>
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onSelectAudioNoteFile(selectedNote.id, file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onOpenAudioNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.audio?.url}>Open Audio</button>
                <button type="button" onClick={() => onDownloadAudioNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.audio?.url}>Download Audio</button>
              </div>
              <div className={detailMutedPanel}>{`${getAudioNoteTitle(selectedNote.audio)}${selectedNote.audio ? ` • ${getAudioNoteMeta(selectedNote.audio)}` : ""}`}</div>
            </div>
          </div>
        )}


        {selectedNote.noteKind === "video" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Video</p>
            <div className="grid gap-2">
              <input
                type="text"
                value={selectedNote.video?.name ?? ""}
                onChange={(event) => onRenameVideoNote(selectedNote.id, event.target.value)}
                className={detailField}
                placeholder="Video file name"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Video file name"
              />
              <input
                type="text"
                value={selectedNote.video?.source === "link" ? selectedNote.video.url : ""}
                onChange={(event) =>
                  onUpdateNote(selectedNote.id, {
                    ...toVideoNotePatch(
                      createVideoNoteState({
                        ...(selectedNote.video ?? createVideoNoteState()),
                        source: "link",
                        url: event.target.value,
                      }),
                    ),
                  })
                }
                onBlur={(event) => {
                  const normalized = normalizeFileUrl(event.target.value);
                  if (normalized) {
                    void onSubmitVideoNoteUrl(selectedNote.id, normalized);
                  }
                }}
                className={detailField}
                placeholder="https://example.com/video.mp4"
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Video URL"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => videoInputRef.current?.click()} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Upload Video</button>
                <button type="button" onClick={() => void onSubmitVideoNoteUrl(selectedNote.id, selectedNote.video?.source === "link" ? selectedNote.video.url : "")} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>Save Link</button>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onSelectVideoNoteFile(selectedNote.id, file);
                  }
                  event.currentTarget.value = "";
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onOpenVideoNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.video?.url}>Open Video</button>
                <button type="button" onClick={() => onDownloadVideoNote(selectedNote.id)} className={detailButton} disabled={!selectedNote.video?.url}>Download Video</button>
              </div>
              <div className={detailMutedPanel}>{`${getVideoNoteTitle(selectedNote.video)}${selectedNote.video ? ` • ${getVideoNoteMeta(selectedNote.video)}` : ""}`}</div>
            </div>
          </div>
        )}

        {selectedNote.noteKind === "poetry" && (
          <div className={sectionBlockClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={sectionLabelClass}>Poetry Search</p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-muted)]">Search PoetryDB by author, title, lines, or line count. Results pick one matching poem and future refreshes reuse the saved method.</p>
              </div>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{poetrySearchSummary}</span>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={poetrySearchField}
                  onChange={(event) => {
                    const nextField = normalizePoetrySearchField(event.target.value);
                    setPoetrySearchField(nextField);
                    if (nextField === "linecount") {
                      setPoetryMatchType("exact");
                    }
                  }}
                  className={detailField}
                  disabled={isTimeLocked || isPrivateEnabled}
                  aria-label="Poetry search field"
                >
                  {POETRY_SEARCH_FIELD_OPTIONS.map((option) => (
                    <option key={`poetry-search-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={poetryMatchType}
                  onChange={(event) => setPoetryMatchType(normalizePoetryMatchType(event.target.value))}
                  className={detailField}
                  disabled={isTimeLocked || isPrivateEnabled || poetrySearchField === "random" || poetrySearchField === "linecount"}
                  aria-label="Poetry search match"
                >
                  <option value="partial">Partial match</option>
                  <option value="exact">Exact match</option>
                </select>
              </div>
              {poetrySearchField !== "random" && (
                <input
                  type="text"
                  value={poetrySearchQuery}
                  onChange={(event) => setPoetrySearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSearchPoetry && !isTimeLocked) {
                      onRefreshPoetry(selectedNote.id, {
                        force: true,
                        field: poetrySearchField,
                        query: normalizedPoetryQuery,
                        matchType: effectivePoetryMatchType,
                      });
                    }
                  }}
                  className={detailField}
                  placeholder={poetryFieldMeta?.placeholder}
                  disabled={isTimeLocked || isPrivateEnabled}
                  aria-label="Poetry search value"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onRefreshPoetry(selectedNote.id, {
                      force: true,
                      field: poetrySearchField,
                      query: normalizedPoetryQuery,
                      matchType: effectivePoetryMatchType,
                    })
                  }
                  className={detailButton}
                  disabled={isTimeLocked || isPrivateEnabled || !canSearchPoetry}
                >
                  {poetrySearchField === "random" ? "Fetch Random" : "Search Poetry"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPoetrySearchField(DEFAULT_POETRY_SEARCH_FIELD);
                    setPoetrySearchQuery("");
                    setPoetryMatchType(DEFAULT_POETRY_MATCH_TYPE);
                    onRefreshPoetry(selectedNote.id, {
                      force: true,
                      field: DEFAULT_POETRY_SEARCH_FIELD,
                      query: "",
                      matchType: DEFAULT_POETRY_MATCH_TYPE,
                    });
                  }}
                  className={detailButton}
                  disabled={isTimeLocked || isPrivateEnabled}
                >
                  Reset to Random
                </button>
              </div>
              {selectedNote.poetry?.error && <p className="text-[11px] leading-5 text-[#B42318]">{selectedNote.poetry.error}</p>}
            </div>
          </div>
        )}

        {selectedNote.noteKind === "economist" && (
          <div className={sectionBlockClass}>
            <p className={sectionLabelClass}>Magazine Source</p>
            <div className="grid gap-2">
              <select
                value={selectedMagazineSourceId}
                onChange={(event) => applyMagazineSource(event.target.value)}
                className={detailField}
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Magazine cover source"
              >
                {ECONOMIST_MAGAZINE_SOURCES.map((source) => (
                  <option key={`magazine-source-${source.sourceId}`} value={source.sourceId}>
                    {source.sourceName}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={selectedNote.economist?.year ?? ""}
                  onChange={(event) =>
                    onUpdateNote(selectedNote.id, {
                      economist: {
                        status: selectedNote.economist?.status ?? "ready",
                        ...selectedNote.economist,
                        year: event.target.value.trim() || undefined,
                      },
                    })
                  }
                  className={detailField}
                  placeholder="Year (e.g. 2024)"
                  disabled={isTimeLocked || isPrivateEnabled || selectedMagazineSourceId !== "economist"}
                  aria-label="Magazine cover year"
                />
                <button
                  type="button"
                  onClick={() => onRefreshEconomist(selectedNote.id, selectedNote.economist?.year)}
                  className={detailButton}
                  disabled={isTimeLocked || isPrivateEnabled}
                >
                  Refresh Cover
                </button>
              </div>
              <button type="button" onClick={() => onOpenBookmarkUrl(selectedNote.quoteAuthor ?? getEconomistMagazineSource(selectedMagazineSourceId).sourceUrl)} className={detailButton}>Open Source</button>
            </div>
          </div>
        )}

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Backlinks</p>
          {backlinks.length === 0 ? (
            <div className={detailMutedPanel}>No notes reference this note yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {backlinks.map((backlink) => (
                <button
                  key={`backlink-${backlink.noteId}`}
                  type="button"
                  onClick={() => onNavigateLinkedNote(backlink.noteId)}
                  className={detailChip}
                >
                  {backlink.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Page Interchange</p>
          <div className={actionGridClass}>
            {pageReference ? (
              <>
                <button type="button" onClick={() => onOpenPageReference(selectedNote.id)} className={detailButton}>
                  Open Page Ref
                </button>
                <button type="button" onClick={() => onUndoPageReference(selectedNote.id)} className={detailButton} disabled={isTimeLocked}>
                  Undo Reference
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onReferenceInPage(selectedNote.id)} className={detailButton} disabled={isTimeLocked}>
                Reference In Page
              </button>
            )}
            {pageConversion ? (
              <>
                <button type="button" onClick={() => onOpenConvertedPage(selectedNote.id)} className={detailButton}>
                  Open Converted Page
                </button>
                <button type="button" onClick={() => onUndoPageConversion(selectedNote.id)} className={detailButton} disabled={isTimeLocked}>
                  Undo Convert
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onConvertToPage(selectedNote.id)} className={detailButton} disabled={isTimeLocked || isPrivateEnabled}>
                Convert To Page
              </button>
            )}
          </div>
          <div className={detailMutedPanel}>
            Keep wall/page links in the details panel only. References add a page-side link block without changing the note, and conversions create a page doc while leaving the wall note visually unchanged.
          </div>
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Alignment</p>
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-[11px] text-[var(--color-text-muted)]">Horizontal</p>
              <div className={segmentedRowClass}>
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => onTextHorizontalAlignChange(align)}
                    className={(selectedNote.textAlign ?? "left") === align ? segmentedButtonActiveClass : segmentedButtonClass}
                    disabled={isTimeLocked || isPrivateEnabled}
                  >
                    {align[0]?.toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] text-[var(--color-text-muted)]">Vertical</p>
              <div className={segmentedRowClass}>
                {(["top", "middle", "bottom"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => onTextVerticalAlignChange(align)}
                    className={(selectedNote.textVAlign ?? NOTE_DEFAULTS.textVAlign) === align ? segmentedButtonActiveClass : segmentedButtonClass}
                    disabled={isTimeLocked || isPrivateEnabled}
                  >
                    {align[0]?.toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Note Style</p>
          <div className="grid gap-2">
            <label className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] shadow-[var(--shadow-sm)]">
              <span>Background</span>
              <input
                type="color"
                value={selectedNote.color ?? NOTE_COLORS[0] ?? "#FEEA89"}
                onChange={(event) => onBackgroundColorChange(event.target.value.toUpperCase())}
                className={colorSwatchClass}
                disabled={isTimeLocked || isPrivateEnabled}
                aria-label="Background color"
              />
            </label>
          </div>
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Note Type</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setNoteKind("standard")} className={typeButtonClass(selectedNote.noteKind === "standard" && !isCodeNote)} disabled={isTimeLocked || isPrivateEnabled}>Default</button>
            <button type="button" onClick={applyCodeNote} className={typeButtonClass(isCodeNote)} disabled={isTimeLocked || isPrivateEnabled}>Code</button>
            <button type="button" onClick={() => setNoteKind("quote")} className={typeButtonClass(selectedNote.noteKind === "quote")} disabled={isTimeLocked || isPrivateEnabled}>Quote</button>
            <button type="button" onClick={() => setNoteKind("canon")} className={typeButtonClass(selectedNote.noteKind === "canon")} disabled={isTimeLocked || isPrivateEnabled}>Canon</button>
            <button type="button" onClick={() => setNoteKind("journal")} className={typeButtonClass(selectedNote.noteKind === "journal")} disabled={isTimeLocked || isPrivateEnabled}>Journal</button>
            <button type="button" onClick={() => setNoteKind("eisenhower")} className={typeButtonClass(selectedNote.noteKind === "eisenhower")} disabled={isTimeLocked || isPrivateEnabled}>Eisenhower</button>
            <button type="button" onClick={() => setNoteKind("web-bookmark")} className={typeButtonClass(selectedNote.noteKind === "web-bookmark")} disabled={isTimeLocked || isPrivateEnabled}>Bookmark</button>
            <button type="button" onClick={applyImageNote} className={typeButtonClass(selectedNote.noteKind === "image")} disabled={isTimeLocked || isPrivateEnabled}>Image</button>
            <button type="button" onClick={() => setNoteKind("file")} className={typeButtonClass(selectedNote.noteKind === "file")} disabled={isTimeLocked || isPrivateEnabled}>File</button>
            <button type="button" onClick={() => setNoteKind("audio")} className={typeButtonClass(selectedNote.noteKind === "audio")} disabled={isTimeLocked || isPrivateEnabled}>Audio</button>
            <button type="button" onClick={() => setNoteKind("video")} className={typeButtonClass(selectedNote.noteKind === "video")} disabled={isTimeLocked || isPrivateEnabled}>Video</button>
            <button type="button" onClick={() => setNoteKind("apod")} className={typeButtonClass(selectedNote.noteKind === "apod")} disabled={isTimeLocked || isPrivateEnabled}>APOD</button>
            <button type="button" onClick={() => selectedNote.noteKind === "poetry" ? onRefreshPoetry(selectedNote.id) : setNoteKind("poetry")} className={typeButtonClass(selectedNote.noteKind === "poetry")} disabled={isTimeLocked || isPrivateEnabled}>{selectedNote.noteKind === "poetry" ? "Refresh Poetry" : "Poetry"}</button>
            <button type="button" onClick={() => selectedNote.noteKind === "economist" ? onRefreshEconomist(selectedNote.id) : setNoteKind("economist")} className={typeButtonClass(selectedNote.noteKind === "economist")} disabled={isTimeLocked || isPrivateEnabled}>{selectedNote.noteKind === "economist" ? "Refresh Cover" : "Magazine Cover"}</button>
            <button type="button" onClick={() => onToggleOrRefreshJoker(selectedNote.id)} className={typeButtonClass(selectedNote.noteKind === "joker")} disabled={isTimeLocked || isPrivateEnabled}>
              {selectedNote.noteKind === "joker" || hasJokerNote ? "Refresh Joker" : "Joker"}
            </button>
            <button type="button" onClick={() => onToggleOrRefreshThrone(selectedNote.id)} className={typeButtonClass(selectedNote.noteKind === "throne")} disabled={isTimeLocked || isPrivateEnabled}>
              {selectedNote.noteKind === "throne" || hasThroneNote ? "Refresh Throne" : "Throne"}
            </button>
          </div>
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Actions</p>
          <div className={actionGridClass}>
            <button type="button" onClick={() => onDuplicate(selectedNote.id)} className={detailButton} disabled={isTimeLocked}>Duplicate</button>
            <button type="button" onClick={() => onTogglePin(selectedNote.id)} className={selectedNote.pinned ? segmentedButtonActiveClass : detailButton} disabled={isTimeLocked}>{selectedNote.pinned ? "Unpin" : "Pin"}</button>
            <button type="button" onClick={() => onStartLink(selectedNote.id)} className={linkingFromNoteId === selectedNote.id ? segmentedButtonActiveClass : detailButton} disabled={isTimeLocked}>Link</button>
            <button type="button" onClick={() => onToggleHighlight(selectedNote.id)} className={selectedNote.highlighted ? segmentedButtonActiveClass : detailButton} disabled={isTimeLocked}>{selectedNote.highlighted ? "Unhighlight" : "Highlight"}</button>
            <button type="button" onClick={() => onToggleFocus(selectedNote.id)} className={isFocused ? segmentedButtonActiveClass : detailButton} disabled={isTimeLocked}>{isFocused ? "Exit Focus" : "Focus"}</button>
          </div>
        </div>
      </div>
    </section>
  );
};


