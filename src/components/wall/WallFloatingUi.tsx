"use client";

import type { Dispatch, FocusEvent, SetStateAction } from "react";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteSwatches } from "@/components/NoteCard";
import { WallLinkContextMenu } from "@/components/wall/WallLinkContextMenu";
import { WallPresentationDock } from "@/components/wall/WallPresentationDock";
import { WallTimelineDock } from "@/components/wall/WallTimelineDock";
import { WallZoomControls } from "@/components/wall/WallZoomControls";
import { NOTE_DEFAULTS, NOTE_TEXT_SIZES } from "@/features/wall/constants";
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
  selectedNotesCount: number;
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
  alignSelected: (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeSelected: (direction: "horizontal" | "vertical") => void;
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
  selectedNotesCount,
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
  alignSelected,
  distributeSelected,
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
}: WallFloatingUiProps) => {
  const zoomPercent = Math.round(camera.zoom * 100);
  const editingNote = editing ? notesById[editing.id] : undefined;
  const currentTimelineEntry = timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)];

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
          <textarea
            autoFocus
            value={editing.text}
            onChange={(event) => setEditing({ id: editing.id, text: event.target.value })}
            onBlur={handleEditorBlur}
            className="w-full resize-none rounded-xl border border-zinc-700/40 bg-white/95 p-3 text-[16px] leading-6 shadow-xl outline-none"
            style={(() => {
              return { height: `${editingNote.h * camera.zoom}px` };
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
            <button type="button" onClick={() => duplicateNote(primarySelectedNote.id)} className={toolbarBtnCompact} title="Duplicate (Ctrl/Cmd + D)">
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
              title="Start link (Ctrl/Cmd + L)"
            >
              Link
            </button>
            {selectedNotesCount >= 2 && (
              <>
                <div className="mx-1 h-5 w-px bg-zinc-300" />
                <button type="button" onClick={() => alignSelected("left")} className={toolbarBtnCompact} title="Align left">L</button>
                <button type="button" onClick={() => alignSelected("center")} className={toolbarBtnCompact} title="Align center">C</button>
                <button type="button" onClick={() => alignSelected("right")} className={toolbarBtnCompact} title="Align right">R</button>
                <button type="button" onClick={() => alignSelected("top")} className={toolbarBtnCompact} title="Align top">T</button>
                <button type="button" onClick={() => alignSelected("middle")} className={toolbarBtnCompact} title="Align middle">M</button>
                <button type="button" onClick={() => alignSelected("bottom")} className={toolbarBtnCompact} title="Align bottom">B</button>
                <button
                  type="button"
                  onClick={() => distributeSelected("horizontal")}
                  disabled={selectedNotesCount < 3}
                  className={toolbarBtnCompact}
                  title="Distribute horizontally"
                >
                  Dist H
                </button>
                <button
                  type="button"
                  onClick={() => distributeSelected("vertical")}
                  disabled={selectedNotesCount < 3}
                  className={toolbarBtnCompact}
                  title="Distribute vertically"
                >
                  Dist V
                </button>
              </>
            )}
            <div className="mx-1 h-5 w-px bg-zinc-300" />
            <button type="button" onClick={onOpenCommandPalette} className={toolbarBtnCompact} title="Open command palette (Ctrl/Cmd + K)">
              ⌘K
            </button>
          </div>
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
