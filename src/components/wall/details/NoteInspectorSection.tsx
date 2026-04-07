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
import type { Note, NoteTextFont } from "@/features/wall/types";
import { NOTE_COLORS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS } from "@/features/wall/constants";

type NoteInspectorSectionProps = {
  selectedNote?: Note;
  isTimeLocked: boolean;
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

const sectionRow = "grid gap-2 sm:grid-cols-2";
const buttonRow = "flex flex-wrap gap-2";

export const NoteInspectorSection = ({
  selectedNote,
  isTimeLocked,
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
  onStartLink,
  privateNoteSupported,
  isPrivateEnabled,
  isPrivateUnlocked,
  onProtectPrivateNote,
  onUnlockPrivateNote,
  onLockPrivateNote,
  onRemovePrivateProtection,
}: NoteInspectorSectionProps) => {
  if (!selectedNote) {
    return null;
  }

  const disabled = isTimeLocked;

  return (
    <section className={detailSectionCard}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={detailSectionTitle}>Note</p>
          <h3 className={detailSectionHeading}>{selectedNote.noteKind ?? "standard"}</h3>
          <p className={detailSectionDescription}>Typography, layout, links, and note-level actions for the current selection.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedNote.pinned ? <span className={detailChip}>Pinned</span> : null}
          {selectedNote.highlighted ? <span className={detailChip}>Highlighted</span> : null}
          {isFocused ? <span className={detailChip}>Focused</span> : null}
        </div>
      </div>

      <div className={sectionRow}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Font</span>
          <select
            className={detailField}
            value={selectedNote.textFont ?? "manrope"}
            disabled={disabled}
            onChange={(event) => onTextFontChange(event.target.value as NoteTextFont)}
          >
            {NOTE_TEXT_FONTS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Text size</span>
          <select
            className={detailField}
            value={String(selectedNote.textSizePx ?? 16)}
            disabled={disabled}
            onChange={(event) => onTextSizeChange(Number(event.target.value))}
          >
            {NOTE_TEXT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </label>
      </div>

      <div className={sectionRow}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Text color</span>
          <input className={detailField} type="color" value={selectedNote.textColor ?? "#1F2937"} disabled={disabled} onChange={(event) => onTextColorChange(event.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Background</span>
          <select className={detailField} value={selectedNote.color} disabled={disabled} onChange={(event) => onBackgroundColorChange(event.target.value)}>
            {NOTE_COLORS.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={sectionRow}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Horizontal align</span>
          <select className={detailField} value={selectedNote.textAlign ?? "left"} disabled={disabled} onChange={(event) => onTextHorizontalAlignChange(event.target.value as "left" | "center" | "right")}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Vertical align</span>
          <select className={detailField} value={selectedNote.textVAlign ?? "top"} disabled={disabled} onChange={(event) => onTextVerticalAlignChange(event.target.value as "top" | "middle" | "bottom")}>
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>

      <div className={buttonRow}>
        <button type="button" className={detailButton} disabled={disabled} onClick={() => onDuplicate(selectedNote.id)}>Duplicate</button>
        <button type="button" className={detailButton} disabled={disabled} onClick={() => onTogglePin(selectedNote.id)}>{selectedNote.pinned ? "Unpin" : "Pin"}</button>
        <button type="button" className={detailButton} disabled={disabled} onClick={() => onToggleHighlight(selectedNote.id)}>{selectedNote.highlighted ? "Unhighlight" : "Highlight"}</button>
        <button type="button" className={detailButton} disabled={disabled} onClick={() => onToggleFocus(selectedNote.id)}>{isFocused ? "Unfocus" : "Focus"}</button>
        <button type="button" className={detailButton} disabled={disabled || linkingFromNoteId === selectedNote.id} onClick={() => onStartLink(selectedNote.id)}>
          {linkingFromNoteId === selectedNote.id ? "Linking..." : "Start Link"}
        </button>
      </div>

      <div className={detailInsetCard}>
        <p className={detailSectionTitle}>Page Interchange</p>
        <div className={buttonRow}>
          <button type="button" className={detailButton} disabled={disabled} onClick={() => onReferenceInPage(selectedNote.id)}>Reference In Page</button>
          <button type="button" className={detailButton} disabled={disabled} onClick={() => onConvertToPage(selectedNote.id)}>Convert To Page</button>
          {pageReference ? <button type="button" className={detailButton} onClick={() => onOpenPageReference(selectedNote.id)}>Open Page Ref</button> : null}
          {pageReference ? <button type="button" className={detailButton} disabled={disabled} onClick={() => onUndoPageReference(selectedNote.id)}>Undo Ref</button> : null}
          {pageConversion ? <button type="button" className={detailButton} onClick={() => onOpenConvertedPage(selectedNote.id)}>Open Page</button> : null}
          {pageConversion ? <button type="button" className={detailButton} disabled={disabled} onClick={() => onUndoPageConversion(selectedNote.id)}>Undo Convert</button> : null}
        </div>
      </div>

      {privateNoteSupported ? (
        <div className={detailMutedPanel}>
          <p className={detailSectionTitle}>Privacy</p>
          <div className={buttonRow}>
            {!isPrivateEnabled ? <button type="button" className={detailButton} disabled={disabled} onClick={() => onProtectPrivateNote(selectedNote.id)}>Protect</button> : null}
            {isPrivateEnabled && !isPrivateUnlocked ? <button type="button" className={detailButton} onClick={() => onUnlockPrivateNote(selectedNote.id)}>Unlock</button> : null}
            {isPrivateEnabled && isPrivateUnlocked ? <button type="button" className={detailButton} onClick={() => onLockPrivateNote(selectedNote.id)}>Lock</button> : null}
            {isPrivateEnabled ? <button type="button" className={detailButton} disabled={disabled} onClick={() => onRemovePrivateProtection(selectedNote.id)}>Remove Protection</button> : null}
          </div>
        </div>
      ) : null}

      {backlinks.length > 0 ? (
        <div className={detailInsetCard}>
          <p className={detailSectionTitle}>Backlinks</p>
          <div className="flex flex-wrap gap-2">
            {backlinks.map((backlink) => (
              <button key={backlink.noteId} type="button" className={detailButton} onClick={() => onNavigateLinkedNote(backlink.noteId)}>
                {backlink.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};
