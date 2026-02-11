"use client";

import type { Dispatch, FocusEvent, SetStateAction } from "react";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { WallPresentationDock } from "@/components/wall/WallPresentationDock";
import { WallTimelineDock } from "@/components/wall/WallTimelineDock";
import { LINK_TYPES, NOTE_DEFAULTS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
import type { LinkType, Note } from "@/features/wall/types";

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
  quickActionScreen?: { x: number; y: number };
  primarySelectedNote?: Note;
  toolbarBtnActive: string;
  toolbarBtnCompact: string;
  applyTextSizeToSelection: (size: "sm" | "md" | "lg") => void;
  applyColorToSelection: (color: string) => void;
  duplicateNote: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  clearNoteSelection: () => void;
  setLinkingFromNote: (noteId?: string) => void;
  linkingFromNoteId?: string;
  linkMenu: LinkContextMenuState;
  maxViewportWidth: number;
  maxViewportHeight: number;
  setLinkMenu: Dispatch<SetStateAction<LinkContextMenuState>>;
  deleteLink: (linkId: string) => void;
  updateLinkType: (linkId: string, type: LinkType) => void;
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
  quickActionScreen,
  primarySelectedNote,
  toolbarBtnActive,
  toolbarBtnCompact,
  applyTextSizeToSelection,
  applyColorToSelection,
  duplicateNote,
  deleteNote,
  clearNoteSelection,
  setLinkingFromNote,
  linkingFromNoteId,
  linkMenu,
  maxViewportWidth,
  maxViewportHeight,
  setLinkMenu,
  deleteLink,
  updateLinkType,
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
}: WallFloatingUiProps) => {
  const zoomPercent = Math.round(camera.zoom * 100);

  return (
    <>
      {editing && notesById[editing.id] && !isTimeLocked && (
        <div
          className="absolute z-[46]"
          style={(() => {
            const note = notesById[editing.id];
            const screen = toScreenPoint(note.x, note.y, camera);
            return {
              left: `${screen.x}px`,
              top: `${screen.y}px`,
              width: `${note.w * camera.zoom}px`,
            };
          })()}
        >
          <textarea
            autoFocus
            value={editing.text}
            onChange={(event) => setEditing({ id: editing.id, text: event.target.value })}
            onBlur={handleEditorBlur}
            className="w-full resize-none rounded-xl border border-zinc-700/40 bg-white/95 p-3 text-[16px] leading-6 shadow-xl outline-none"
            style={(() => {
              const note = notesById[editing.id];
              return { height: `${note.h * camera.zoom}px` };
            })()}
          />
          <div data-note-edit-tags="true" className="mt-2 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Tags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {notesById[editing.id].tags.length === 0 && <span className="text-[11px] text-zinc-500">No tags yet.</span>}
              {notesById[editing.id].tags.map((tag) => (
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
                  >
                    ×
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
          className="pointer-events-auto absolute z-[45] -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-300 bg-white/96 px-2 py-1.5 shadow-xl backdrop-blur-sm"
          style={{ left: `${quickActionScreen.x}px`, top: `${quickActionScreen.y}px` }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            {NOTE_TEXT_SIZES.map((size) => (
              <button
                key={`quick-size-${size.value}`}
                type="button"
                className={(primarySelectedNote.textSize ?? NOTE_DEFAULTS.textSize) === size.value ? toolbarBtnActive : toolbarBtnCompact}
                onClick={() => applyTextSizeToSelection(size.value)}
                title={`Text size ${size.label}`}
              >
                {size.label}
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <NoteSwatches value={primarySelectedNote.color} onSelect={applyColorToSelection} />
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <button type="button" onClick={() => duplicateNote(primarySelectedNote.id)} className={toolbarBtnCompact} title="Duplicate (Ctrl/Cmd+D)">
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm("Delete selected note?");
                if (ok) {
                  deleteNote(primarySelectedNote.id);
                  clearNoteSelection();
                }
              }}
              className={toolbarBtnCompact}
              title="Delete"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setLinkingFromNote(primarySelectedNote.id)}
              className={linkingFromNoteId ? toolbarBtnActive : toolbarBtnCompact}
              title="Start link (Ctrl/Cmd+L)"
            >
              Link
            </button>
          </div>
        </div>
      )}

      {linkMenu.open && linkMenu.linkId && linksById[linkMenu.linkId] && (
        <div
          className="fixed z-[70] w-56 rounded-xl border border-zinc-300 bg-white p-2 shadow-2xl"
          style={{
            left: `${Math.max(8, Math.min(linkMenu.x, maxViewportWidth - 232))}px`,
            top: `${Math.max(8, Math.min(linkMenu.y, maxViewportHeight - 210))}px`,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Link Actions</p>
          <button
            type="button"
            className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            disabled={isTimeLocked}
            onClick={() => {
              if (linkMenu.linkId) {
                deleteLink(linkMenu.linkId);
              }
              setLinkMenu((previous) => ({ ...previous, open: false }));
            }}
          >
            Delete link
          </button>
          <div className="mt-2 border-t border-zinc-200 pt-2">
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Change Type</p>
            <div className="space-y-1">
              {LINK_TYPES.map((option) => (
                <button
                  key={`ctx-${option.value}`}
                  type="button"
                  disabled={isTimeLocked}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={() => {
                    if (linkMenu.linkId) {
                      updateLinkType(linkMenu.linkId, option.value as LinkType);
                    }
                    setLinkMenu((previous) => ({ ...previous, open: false }));
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHeatmap && (
        <div className="pointer-events-auto absolute bottom-3 right-3 z-30">
          <CalendarHeatmap timestamps={timelineEntries.map((entry) => entry.ts)} onSelectDay={jumpToTimelineDay} />
        </div>
      )}

      <div
        className="pointer-events-auto absolute right-3 z-[31] transition-[bottom] duration-[var(--motion-normal)]"
        style={{ bottom: showHeatmap ? "14rem" : "0.75rem" }}
      >
        <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]">
          <button
            type="button"
            onClick={onZoomIn}
            className="h-9 w-11 border-b border-[var(--color-border)] text-lg font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="h-8 w-11 border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            aria-label="Reset zoom to 100 percent"
            title="Reset zoom (100%)"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="h-9 w-11 text-lg font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            aria-label="Zoom out"
            title="Zoom out"
          >
            -
          </button>
        </div>
      </div>

      {timelineMode && timelineEntries.length > 0 && (
        <WallTimelineDock
          timelineEntriesLength={timelineEntries.length}
          timelineIndex={timelineIndex}
          isTimelinePlaying={isTimelinePlaying}
          currentTimestamp={timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)].ts}
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
