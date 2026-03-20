"use client";

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
import { defaultPoetryNoteState } from "@/features/wall/poetry";
import { EISENHOWER_NOTE_DEFAULTS, JOURNAL_NOTE_DEFAULTS, NOTE_COLORS, NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS, POETRY_NOTE_DEFAULTS } from "@/features/wall/constants";
import { createBookmarkNoteState, normalizeBookmarkUrl, WEB_BOOKMARK_DEFAULTS } from "@/features/wall/bookmarks";
import { createEisenhowerNotePayload } from "@/features/wall/eisenhower";
import type { Note, NoteTextFont } from "@/features/wall/types";

type NoteInspectorSectionProps = {
  selectedNote?: Note;
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
  onTogglePin: (noteId: string) => void;
  onToggleHighlight: (noteId: string) => void;
  onToggleFocus: (noteId: string) => void;
  onToggleOrRefreshJoker: (noteId: string) => void;
  onToggleOrRefreshThrone: (noteId: string) => void;
  onStartLink: (noteId: string) => void;
  onUpdateNote: (noteId: string, patch: Partial<Note>) => void;
  onSubmitBookmarkUrl: (noteId: string, url: string, options?: { force?: boolean }) => void;
  onOpenBookmarkUrl: (url: string) => void;
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

export const NoteInspectorSection = ({
  selectedNote,
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
  onTogglePin,
  onToggleHighlight,
  onToggleFocus,
  onToggleOrRefreshJoker,
  onToggleOrRefreshThrone,
  onStartLink,
  onUpdateNote,
  onSubmitBookmarkUrl,
  onOpenBookmarkUrl,
}: NoteInspectorSectionProps) => {
  if (!selectedNote) {
    return null;
  }

  const setNoteKind = (kind: Note["noteKind"]) => {
    const toQuote = kind === "quote" && selectedNote.noteKind !== "quote";
    const toCanon = kind === "canon" && selectedNote.noteKind !== "canon";
    const toJournal = kind === "journal" && selectedNote.noteKind !== "journal";
    const toEisenhower = kind === "eisenhower" && selectedNote.noteKind !== "eisenhower";
    const toBookmark = kind === "web-bookmark" && selectedNote.noteKind !== "web-bookmark";
    const toApod = kind === "apod" && selectedNote.noteKind !== "apod";
    const toPoetry = kind === "poetry" && selectedNote.noteKind !== "poetry";

    onUpdateNote(selectedNote.id, {
      noteKind: selectedNote.noteKind === kind ? "standard" : kind,
      text: toBookmark ? "" : selectedNote.text,
      quoteAuthor: toQuote ? "" : undefined,
      quoteSource: toQuote ? "" : undefined,
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
      eisenhower: toEisenhower ? createEisenhowerNotePayload(selectedNote.createdAt) : undefined,
      bookmark: toBookmark ? createBookmarkNoteState(selectedNote.bookmark?.url ?? "") : undefined,
      apod: toApod ? defaultApodNoteState(selectedNote.apod) : undefined,
      poetry: toPoetry ? defaultPoetryNoteState(selectedNote.poetry) : undefined,
      imageUrl: toBookmark || toApod || toPoetry ? undefined : selectedNote.imageUrl,
      vocabulary: toCanon || toJournal || toEisenhower || toBookmark || toApod || toPoetry ? undefined : selectedNote.vocabulary,
      color: toBookmark ? WEB_BOOKMARK_DEFAULTS.color : toApod ? APOD_NOTE_DEFAULTS.color : toPoetry ? POETRY_NOTE_DEFAULTS.color : toJournal ? JOURNAL_NOTE_DEFAULTS.color : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.color : selectedNote.color,
      textFont: toBookmark ? WEB_BOOKMARK_DEFAULTS.textFont : toApod ? APOD_NOTE_DEFAULTS.textFont : toPoetry ? POETRY_NOTE_DEFAULTS.textFont : toJournal ? JOURNAL_NOTE_DEFAULTS.textFont : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.textFont : selectedNote.textFont,
      textColor: toBookmark ? WEB_BOOKMARK_DEFAULTS.textColor : toApod ? APOD_NOTE_DEFAULTS.textColor : toPoetry ? POETRY_NOTE_DEFAULTS.textColor : toJournal ? JOURNAL_NOTE_DEFAULTS.textColor : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.textColor : selectedNote.textColor,
      textSizePx: toBookmark ? WEB_BOOKMARK_DEFAULTS.textSizePx : toApod ? APOD_NOTE_DEFAULTS.textSizePx : toPoetry ? POETRY_NOTE_DEFAULTS.textSizePx : toJournal ? JOURNAL_NOTE_DEFAULTS.textSizePx : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.textSizePx : selectedNote.textSizePx,
      w: toBookmark ? WEB_BOOKMARK_DEFAULTS.width : toApod ? APOD_NOTE_DEFAULTS.width : toPoetry ? POETRY_NOTE_DEFAULTS.width : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.width : selectedNote.w,
      h: toBookmark ? WEB_BOOKMARK_DEFAULTS.height : toApod ? APOD_NOTE_DEFAULTS.height : toPoetry ? POETRY_NOTE_DEFAULTS.height : toEisenhower ? EISENHOWER_NOTE_DEFAULTS.height : selectedNote.h,
      tags: toJournal
        ? [...new Set([...selectedNote.tags, "journal"])]
        : toEisenhower
          ? [...new Set([...selectedNote.tags, "matrix", "priority"])]
          : toBookmark
            ? [...new Set([...selectedNote.tags, "bookmark", "link"])]
            : toApod
              ? [...new Set([...selectedNote.tags, "space", "nasa", "apod"])]
              : toPoetry
                ? [...new Set([...selectedNote.tags, "poetry", "poem"])]
                : selectedNote.tags,
    });
  };

  return (
    <section className={detailSectionCard} aria-label="Note inspector">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={detailSectionTitle}>Note Inspector</p>
          <h4 className={detailSectionHeading}>{selectedNote.noteKind === "standard" ? "Standard note" : `${selectedNote.noteKind} note`}</h4>
          <p className={detailSectionDescription}>Typography, backlinks, styling, and note properties for the current selection.</p>
        </div>
        <div className={detailInsetCard}>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Selected</p>
          <p className="mt-1 text-xs font-medium text-[var(--color-text)]">1 note</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Text</p>
          <div className="grid gap-2">
            <select
              value={selectedNote.textFont ?? "nunito"}
              onChange={(event) => onTextFontChange(event.target.value as NoteTextFont)}
              className={detailField}
              disabled={isTimeLocked}
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
                disabled={isTimeLocked}
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
                  disabled={isTimeLocked}
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
                disabled={isTimeLocked}
                aria-label="Quote author"
              />
              <input
                type="text"
                value={selectedNote.quoteSource ?? ""}
                onChange={(event) => onUpdateNote(selectedNote.id, { quoteSource: event.target.value })}
                className={detailField}
                placeholder="Source"
                disabled={isTimeLocked}
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
                disabled={isTimeLocked}
                aria-label="Bookmark URL"
              />
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onSubmitBookmarkUrl(selectedNote.id, selectedNote.bookmark?.url ?? "")} className={detailButton} disabled={isTimeLocked}>Fetch</button>
                <button type="button" onClick={() => onSubmitBookmarkUrl(selectedNote.id, selectedNote.bookmark?.url ?? "", { force: true })} className={detailButton} disabled={isTimeLocked}>Refresh</button>
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
                    disabled={isTimeLocked}
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
                    disabled={isTimeLocked}
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
                disabled={isTimeLocked}
                aria-label="Background color"
              />
            </label>
          </div>
        </div>

        <div className={sectionBlockClass}>
          <p className={sectionLabelClass}>Note Type</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setNoteKind("quote")} className={typeButtonClass(selectedNote.noteKind === "quote")} disabled={isTimeLocked}>Quote</button>
            <button type="button" onClick={() => setNoteKind("canon")} className={typeButtonClass(selectedNote.noteKind === "canon")} disabled={isTimeLocked}>Canon</button>
            <button type="button" onClick={() => setNoteKind("journal")} className={typeButtonClass(selectedNote.noteKind === "journal")} disabled={isTimeLocked}>Journal</button>
            <button type="button" onClick={() => setNoteKind("eisenhower")} className={typeButtonClass(selectedNote.noteKind === "eisenhower")} disabled={isTimeLocked}>Eisenhower</button>
            <button type="button" onClick={() => setNoteKind("web-bookmark")} className={typeButtonClass(selectedNote.noteKind === "web-bookmark")} disabled={isTimeLocked}>Bookmark</button>
            <button type="button" onClick={() => setNoteKind("apod")} className={typeButtonClass(selectedNote.noteKind === "apod")} disabled={isTimeLocked}>APOD</button>
            <button type="button" onClick={() => setNoteKind("poetry")} className={typeButtonClass(selectedNote.noteKind === "poetry")} disabled={isTimeLocked}>Poetry</button>
            <button type="button" onClick={() => onToggleOrRefreshJoker(selectedNote.id)} className={typeButtonClass(selectedNote.noteKind === "joker")} disabled={isTimeLocked}>
              {selectedNote.noteKind === "joker" || hasJokerNote ? "Refresh Joker" : "Joker"}
            </button>
            <button type="button" onClick={() => onToggleOrRefreshThrone(selectedNote.id)} className={typeButtonClass(selectedNote.noteKind === "throne")} disabled={isTimeLocked}>
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

