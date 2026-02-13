"use client";

import { useRef } from "react";
import type { Dispatch, FocusEvent, SetStateAction } from "react";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { NoteTextFormattingToolbar } from "@/components/wall/NoteTextFormattingToolbar";
import { getNoteTextFontFamily, getNoteTextStyle } from "@/components/wall/wall-canvas-helpers";
import { NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS } from "@/features/wall/constants";
import { WallLinkContextMenu } from "@/components/wall/WallLinkContextMenu";
import { WallPresentationDock } from "@/components/wall/WallPresentationDock";
import { WallTimelineDock } from "@/components/wall/WallTimelineDock";
import { WallZoomControls } from "@/components/wall/WallZoomControls";
import type { LinkType, Note, NoteTextFont } from "@/features/wall/types";

type LinkContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  linkId?: string;
};

type WallFloatingUiProps = {
  editing: { id: string; text: string } | null;
  notesById: Record<string, Note>;
  linksById: Record<string, { id: string }>;
  camera: { x: number; y: number; zoom: number };
  isTimeLocked: boolean;
  editTagInput: string;
  editTagRenameFrom: string | null;
  setEditing: (value: { id: string; text: string } | null) => void;
  handleEditorBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  setEditTagInput: (value: string) => void;
  setEditTagRenameFrom: (value: string | null) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
  renameTagOnNote: (noteId: string, fromTag: string, toTag: string) => void;
  toScreenPoint: (worldX: number, worldY: number, camera: { x: number; y: number; zoom: number }) => { x: number; y: number };
  tagPreviewScreen?: { x: number; y: number };
  tagPreviewNote?: Note;
  tagPreviewPalette?: { bg: string; border: string; text: string };
  touchPaletteScreen?: { x: number; y: number };
  touchPaletteNote?: Note;
  quickActionScreen?: { x: number; y: number };
  primarySelectedNote?: Note;
  toolbarBtnActive: string;
  toolbarBtnCompact: string;
  applyColorToSelection: (color: string) => void;
  applyTextSizeToSelection: (sizePx: number) => void;
  applyTextFontToSelection: (font: NoteTextFont) => void;
  applyTextColorToSelection: (color: string) => void;
  applyTextHorizontalAlignToSelection: (align: "left" | "center" | "right") => void;
  applyTextVerticalAlignToSelection: (align: "top" | "middle" | "bottom") => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  duplicateNote: (noteId: string) => void;
  togglePinOnNote: (noteId: string) => void;
  toggleHighlightOnNote: (noteId: string) => void;
  isPrimaryNoteFocused: boolean;
  onToggleFocusNote: (noteId: string) => void;
  setLinkingFromNote: (noteId?: string) => void;
  linkingFromNoteId?: string;
  linkMenu: LinkContextMenuState;
  maxViewportWidth: number;
  maxViewportHeight: number;
  setLinkMenu: Dispatch<SetStateAction<LinkContextMenuState>>;
  deleteLink: (linkId: string) => void;
  updateLinkType: (linkId: string, type: LinkType) => void;
  onOpenCommandPalette: () => void;
  showHeatmap: boolean;
  timelineEntries: Array<{ ts: number }>;
  jumpToTimelineDay: (day: string) => void;
  timelineMode: boolean;
  timelineIndex: number;
  isTimelinePlaying: boolean;
  setIsTimelinePlaying: Dispatch<SetStateAction<boolean>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  presentationMode: boolean;
  presentationIndex: number;
  presentationNotesLength: number;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onCloseTouchPalette: () => void;
};

export const WallFloatingUi = ({
  editing,
  notesById,
  linksById,
  camera,
  isTimeLocked,
  editTagInput,
  editTagRenameFrom,
  setEditing,
  handleEditorBlur,
  setEditTagInput,
  setEditTagRenameFrom,
  addTagToNote,
  removeTagFromNote,
  renameTagOnNote,
  toScreenPoint,
  tagPreviewScreen,
  tagPreviewNote,
  tagPreviewPalette,
  touchPaletteScreen,
  touchPaletteNote,
  quickActionScreen,
  primarySelectedNote,
  toolbarBtnActive,
  toolbarBtnCompact,
  applyColorToSelection,
  applyTextSizeToSelection,
  applyTextFontToSelection,
  applyTextColorToSelection,
  applyTextHorizontalAlignToSelection,
  applyTextVerticalAlignToSelection,
  updateNote,
  duplicateNote,
  togglePinOnNote,
  toggleHighlightOnNote,
  isPrimaryNoteFocused,
  onToggleFocusNote,
  setLinkingFromNote,
  linkingFromNoteId,
  linkMenu,
  maxViewportWidth,
  maxViewportHeight,
  setLinkMenu,
  deleteLink,
  updateLinkType,
  onOpenCommandPalette,
  showHeatmap,
  timelineEntries,
  jumpToTimelineDay,
  timelineMode,
  timelineIndex,
  isTimelinePlaying,
  setIsTimelinePlaying,
  setTimelineIndex,
  presentationMode,
  presentationIndex,
  presentationNotesLength,
  setPresentationIndex,
  setPresentationMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onCloseTouchPalette,
}: WallFloatingUiProps) => {
  const zoomPercent = Math.round(camera.zoom * 100);
  const editingNote = editing ? notesById[editing.id] : undefined;
  const currentTimelineEntry = timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)];
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editingTextStyle = getNoteTextStyle(editingNote?.textSize, editingNote?.textSizePx);

  return (
    <>
      {editing && editingNote && !isTimeLocked && (
        <div
          className="absolute z-[46]"
          style={(() => {
            const screen = toScreenPoint(editingNote.x, editingNote.y, camera);
            return {
              left: `${screen.x}px`,
              top: `${screen.y}px`,
              width: `${editingNote.w * camera.zoom}px`,
            };
          })()}
        >
          <NoteTextFormattingToolbar
            textareaRef={textareaRef}
            active
            value={editing.text}
            textAlign={editingNote.textAlign ?? "left"}
            textVAlign={editingNote.textVAlign ?? NOTE_DEFAULTS.textVAlign}
            textColor={editingNote.textColor}
            imageUrl={editingNote.imageUrl}
            textSizePx={editingNote.textSizePx}
            textFont={editingNote.textFont}
            onTextUpdate={(nextValue, selectionStart, selectionEnd) => {
              setEditing({ id: editing.id, text: nextValue });
              requestAnimationFrame(() => {
                const textarea = textareaRef.current;
                if (!textarea) {
                  return;
                }
                textarea.focus();
                textarea.setSelectionRange(selectionStart, selectionEnd);
              });
            }}
            onAlignUpdate={(textAlign) => updateNote(editing.id, { textAlign })}
            onVerticalAlignUpdate={(textVAlign) => {
              updateNote(editing.id, { textVAlign });
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
            onTextColorUpdate={(textColor) => {
              updateNote(editing.id, { textColor });
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
            onImageUrlUpdate={(imageUrl) => {
              updateNote(editing.id, { imageUrl });
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
            onTextSizeUpdate={(textSizePx) => {
              updateNote(editing.id, { textSizePx });
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
            onTextFontUpdate={(textFont) => {
              updateNote(editing.id, { textFont });
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
          />
          <textarea
            ref={textareaRef}
            autoFocus
            value={editing.text}
            onChange={(event) => setEditing({ id: editing.id, text: event.target.value })}
            onBlur={handleEditorBlur}
            className="w-full resize-none rounded-xl border border-zinc-700/40 p-3 shadow-xl outline-none"
            style={(() => {
              return {
                height: `${editingNote.h * camera.zoom}px`,
                backgroundColor: editingNote.color,
                textAlign: editingNote.textAlign ?? "left",
                fontFamily: getNoteTextFontFamily(editingNote.textFont),
                color: editingNote.textColor ?? NOTE_DEFAULTS.textColor,
                fontSize: `${editingTextStyle.fontSize}px`,
                lineHeight: `${editingTextStyle.lineHeight}`,
              };
            })()}
          />
          <div data-note-edit-tags="true" className="mt-2 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Tags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {editingNote.tags.length === 0 && <span className="text-[11px] text-zinc-500">No tags yet.</span>}
              {editingNote.tags.map((tag) => (
                <span key={`edit-tag-${tag}`} className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700">
                  <button
                    type="button"
                    data-note-edit-tags="true"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setEditTagRenameFrom(tag);
                      setEditTagInput(tag);
                    }}
                    className="text-zinc-700 hover:text-zinc-900"
                  >
                    #{tag}
                  </button>
                  <button
                    type="button"
                    data-note-edit-tags="true"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => removeTagFromNote(editing.id, tag)}
                    className="text-zinc-500 hover:text-red-700"
                    title="Delete tag"
                    aria-label={`Delete tag ${tag}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                data-note-edit-tags="true"
                value={editTagInput}
                onChange={(event) => setEditTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.preventDefault();
                  if (!editTagInput.trim()) {
                    return;
                  }
                  if (editTagRenameFrom) {
                    renameTagOnNote(editing.id, editTagRenameFrom, editTagInput);
                    setEditTagRenameFrom(null);
                  } else {
                    addTagToNote(editing.id, editTagInput);
                  }
                  setEditTagInput("");
                }}
                placeholder={editTagRenameFrom ? "Rename tag" : "Add tag"}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                data-note-edit-tags="true"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (!editTagInput.trim()) {
                    return;
                  }
                  if (editTagRenameFrom) {
                    renameTagOnNote(editing.id, editTagRenameFrom, editTagInput);
                    setEditTagRenameFrom(null);
                  } else {
                    addTagToNote(editing.id, editTagInput);
                  }
                  setEditTagInput("");
                }}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
              >
                {editTagRenameFrom ? "Rename" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tagPreviewScreen && tagPreviewNote && !editing && (
        <div
          className="pointer-events-none absolute z-[44] -translate-x-1/2 -translate-y-full"
          style={{ left: `${tagPreviewScreen.x}px`, top: `${tagPreviewScreen.y}px` }}
        >
          <div className="max-w-[min(70vw,34rem)] overflow-x-auto whitespace-nowrap rounded-xl border border-zinc-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1">
              {tagPreviewNote.tags.map((tag) => (
                <span
                  key={`hover-tag-${tag}`}
                  className="rounded-full border px-2 py-0.5 text-[11px]"
                  style={{ backgroundColor: tagPreviewPalette?.bg, borderColor: tagPreviewPalette?.border, color: tagPreviewPalette?.text }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {quickActionScreen && primarySelectedNote && !editing && (
        <div
          className="pointer-events-auto absolute z-[45] -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-300 bg-white/96 px-2 py-1.5 shadow-xl backdrop-blur-sm motion-toolbar-enter"
          style={{ left: `${quickActionScreen.x}px`, top: `${quickActionScreen.y}px` }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div role="toolbar" aria-label="Note quick actions" className="flex items-center gap-1">
            <select
              value={primarySelectedNote.textFont ?? "nunito"}
              onChange={(event) => applyTextFontToSelection(event.target.value as NonNullable<Note["textFont"]>)}
              className={`w-[9rem] ${toolbarBtnCompact}`}
              title="Note font"
              aria-label="Note font"
            >
              {NOTE_TEXT_FONTS.map((option) => (
                <option key={`quick-font-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={primarySelectedNote.textSizePx ?? 16}
              onChange={(event) => applyTextSizeToSelection(Number(event.target.value))}
              className={`w-[5.4rem] ${toolbarBtnCompact}`}
              title="Note size"
              aria-label="Note size"
            >
              {NOTE_TEXT_SIZE_OPTIONS.map((size) => (
                <option key={`quick-size-${size}`} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <select
              value={primarySelectedNote.textAlign ?? "left"}
              onChange={(event) => applyTextHorizontalAlignToSelection(event.target.value as "left" | "center" | "right")}
              className={`w-[6.2rem] ${toolbarBtnCompact}`}
              title="Horizontal align"
              aria-label="Horizontal align"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <select
              value={primarySelectedNote.textVAlign ?? NOTE_DEFAULTS.textVAlign}
              onChange={(event) => applyTextVerticalAlignToSelection(event.target.value as "top" | "middle" | "bottom")}
              className={`w-[5.9rem] ${toolbarBtnCompact}`}
              title="Vertical align"
              aria-label="Vertical align"
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
            <label className={toolbarBtnCompact}>
              <span className="sr-only">Note text color</span>
              <input
                type="color"
                value={primarySelectedNote.textColor ?? NOTE_DEFAULTS.textColor}
                onChange={(event) => applyTextColorToSelection(event.target.value.toUpperCase())}
                className="h-5 w-7 cursor-pointer rounded border border-zinc-300 bg-white p-0"
                title="Note text color"
                aria-label="Note text color"
              />
            </label>
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <NoteSwatches value={primarySelectedNote.color} onSelect={applyColorToSelection} showCustomColorAdd />
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <button type="button" onClick={() => duplicateNote(primarySelectedNote.id)} className={toolbarBtnCompact} title="Duplicate (Ctrl/Cmd + D)">
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => togglePinOnNote(primarySelectedNote.id)}
              className={primarySelectedNote.pinned ? toolbarBtnActive : toolbarBtnCompact}
              title={primarySelectedNote.pinned ? "Unpin note" : "Pin note (prevent move/resize)"}
              aria-label={primarySelectedNote.pinned ? "Unpin note" : "Pin note"}
            >
              Pin
            </button>
            <button
              type="button"
              onClick={() => toggleHighlightOnNote(primarySelectedNote.id)}
              className={primarySelectedNote.highlighted ? toolbarBtnActive : toolbarBtnCompact}
              title={primarySelectedNote.highlighted ? "Remove highlight" : "Highlight note"}
              aria-label={primarySelectedNote.highlighted ? "Remove highlight" : "Highlight note"}
            >
              Highlight
            </button>
            <button
              type="button"
              onClick={() => onToggleFocusNote(primarySelectedNote.id)}
              className={isPrimaryNoteFocused ? toolbarBtnActive : toolbarBtnCompact}
              title={isPrimaryNoteFocused ? "Exit focus mode" : "Focus this note"}
              aria-label={isPrimaryNoteFocused ? "Exit focus mode" : "Focus note"}
            >
              Focus
            </button>
            <button
              type="button"
              onClick={() => setLinkingFromNote(primarySelectedNote.id)}
              className={linkingFromNoteId ? toolbarBtnActive : toolbarBtnCompact}
              title="Start link (Ctrl/Cmd + L)"
              aria-label="Start link from selected note"
            >
              Link
            </button>
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <button type="button" onClick={onOpenCommandPalette} className={toolbarBtnCompact} title="Open command palette (Ctrl/Cmd + K)" aria-label="Open command palette">
              Cmd/Ctrl+K
            </button>
          </div>
        </div>
      )}

      {touchPaletteScreen && touchPaletteNote && !editing && (
        <div
          className="pointer-events-auto absolute z-[46] -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-300 bg-white/96 px-2 py-2 shadow-xl backdrop-blur-sm motion-toolbar-enter"
          style={{ left: `${touchPaletteScreen.x}px`, top: `${touchPaletteScreen.y}px` }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-zinc-700">Color palette</p>
            <button
              type="button"
              onClick={onCloseTouchPalette}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded border border-zinc-300 bg-white px-2 text-xs text-zinc-600"
              aria-label="Close color palette"
            >
              Close
            </button>
          </div>
          <NoteSwatches
            value={touchPaletteNote.color}
            onSelect={(color) => {
              applyColorToSelection(color);
              onCloseTouchPalette();
            }}
            showCustomColorAdd
          />
        </div>
      )}

      <WallLinkContextMenu
        open={linkMenu.open}
        linkId={linkMenu.linkId}
        linksById={linksById}
        x={linkMenu.x}
        y={linkMenu.y}
        maxViewportWidth={maxViewportWidth}
        maxViewportHeight={maxViewportHeight}
        isTimeLocked={isTimeLocked}
        onDeleteLink={deleteLink}
        onUpdateLinkType={updateLinkType}
        onClose={() => setLinkMenu((previous) => ({ ...previous, open: false }))}
      />

      {showHeatmap && (
        <div className="pointer-events-auto absolute bottom-3 right-3 z-30">
          <CalendarHeatmap timestamps={timelineEntries.map((entry) => entry.ts)} onSelectDay={jumpToTimelineDay} />
        </div>
      )}

      <WallZoomControls
        zoomPercent={zoomPercent}
        showHeatmap={showHeatmap}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />

      {timelineMode && timelineEntries.length > 0 && currentTimelineEntry && (
        <WallTimelineDock
          timelineEntriesLength={timelineEntries.length}
          timelineIndex={timelineIndex}
          isTimelinePlaying={isTimelinePlaying}
          currentTimestamp={currentTimelineEntry.ts}
          onTogglePlay={() => setIsTimelinePlaying((value) => !value)}
          onStart={() => setTimelineIndex(0)}
          onLatest={() => setTimelineIndex(timelineEntries.length - 1)}
          onSeek={(index) => {
            setIsTimelinePlaying(false);
            setTimelineIndex(index);
          }}
        />
      )}

      {presentationMode && (
        <WallPresentationDock
          presentationIndex={presentationIndex}
          presentationNotesLength={presentationNotesLength}
          onPrev={() => setPresentationIndex((previous) => Math.max(previous - 1, 0))}
          onNext={() => setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationNotesLength - 1)))}
          onExit={() => setPresentationMode(false)}
        />
      )}
    </>
  );
};

