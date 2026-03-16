"use client";

import { useState } from "react";
import type { Dispatch, FocusEvent, SetStateAction } from "react";

import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { NoteTextEditor } from "@/components/wall/NoteTextEditor";
import { JOURNAL_NOTE_DEFAULTS, NOTE_DEFAULTS, NOTE_TEXT_FONTS, NOTE_TEXT_SIZE_OPTIONS } from "@/features/wall/constants";
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
  presentationLength: number;
  presentationModeType: "notes" | "narrative";
  narrativePaths: Array<{ id: string; title: string; stepsCount: number }>;
  activeNarrativePathId: string;
  activeStepTalkingPoints: string;
  onCreateNarrativePath: () => void;
  onPathChange: (pathId: string) => void;
  onAddNarrativeStep: () => void;
  onDeleteNarrativeStep: () => void;
  onUpdateStepTalkingPoints: (value: string) => void;
  onCaptureNarrativeStepCamera: () => void;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

const noteEditorSectionClass =
  "mt-2 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface-glass)] p-2 text-[var(--color-text)] shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)]";
const noteEditorSectionLabelClass = "text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]";
const noteEditorInputClass =
  "min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1";
const noteEditorTagChipClass =
  "inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] text-[var(--color-text)]";
const noteEditorSecondaryButtonClass =
  "rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]";

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
  presentationLength,
  presentationModeType,
  narrativePaths,
  activeNarrativePathId,
  activeStepTalkingPoints,
  onCreateNarrativePath,
  onPathChange,
  onAddNarrativeStep,
  onDeleteNarrativeStep,
  onUpdateStepTalkingPoints,
  onCaptureNarrativeStepCamera,
  setPresentationIndex,
  setPresentationMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: WallFloatingUiProps) => {
  const zoomPercent = Math.round(camera.zoom * 100);
  const editingNote = editing ? notesById[editing.id] : undefined;
  const editingCanon = editingNote?.canon;
  const currentTimelineEntry = timelineEntries[Math.min(timelineIndex, timelineEntries.length - 1)];
  const [quickActionsOverflowOpen, setQuickActionsOverflowOpen] = useState(false);

  return (
    <>
      {editing && editingNote && !isTimeLocked && (
        <>
          {editingNote.noteKind !== "canon" && (
            <NoteTextEditor
              editing={editing}
              editingNote={editingNote}
              camera={camera}
              toScreenPoint={toScreenPoint}
              handleEditorBlur={handleEditorBlur}
              setEditing={setEditing}
              updateNote={updateNote}
            />
          )}
          {editingNote.noteKind === "canon" && editingCanon && (
            <div data-note-edit-tags="true" className="rounded-xl border border-zinc-700/40 p-3 shadow-xl" style={{ backgroundColor: editingNote.color }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">Canon Note</p>
              <div className="mt-2 grid gap-2">
                <input
                  data-note-edit-tags="true"
                  value={editingCanon.title}
                  onChange={(event) =>
                    updateNote(editing.id, {
                      canon: { ...editingCanon, title: event.target.value },
                    })
                  }
                  placeholder="Title (e.g., Ten Commandments)"
                  className="min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                />
                <select
                  data-note-edit-tags="true"
                  value={editingCanon.mode}
                  onChange={(event) =>
                    updateNote(editing.id, {
                      canon: {
                        ...editingCanon,
                        mode: event.target.value === "list" ? "list" : "single",
                      },
                    })
                  }
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                >
                  <option value="single">Single</option>
                  <option value="list">List</option>
                </select>
                {editingCanon.mode === "single" ? (
                  <>
                    <textarea
                      data-note-edit-tags="true"
                      value={editingCanon.statement}
                      onChange={(event) =>
                        updateNote(editing.id, {
                          canon: { ...editingCanon, statement: event.target.value },
                        })
                      }
                      placeholder="Statement"
                      className="min-h-16 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />
                    <textarea
                      data-note-edit-tags="true"
                      value={editingCanon.interpretation}
                      onChange={(event) =>
                        updateNote(editing.id, {
                          canon: { ...editingCanon, interpretation: event.target.value },
                        })
                      }
                      placeholder="Interpretation"
                      className="min-h-14 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />
                    <input
                      data-note-edit-tags="true"
                      value={editingCanon.example}
                      onChange={(event) =>
                        updateNote(editing.id, {
                          canon: { ...editingCanon, example: event.target.value },
                        })
                      }
                      placeholder="Example"
                      className="min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />
                    <input
                      data-note-edit-tags="true"
                      value={editingCanon.source}
                      onChange={(event) =>
                        updateNote(editing.id, {
                          canon: { ...editingCanon, source: event.target.value },
                        })
                      }
                      placeholder="Source"
                      className="min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />
                  </>
                ) : (
                  <>
                    <textarea
                      data-note-edit-tags="true"
                      value={editingCanon.interpretation}
                      onChange={(event) =>
                        updateNote(editing.id, {
                          canon: { ...editingCanon, interpretation: event.target.value },
                        })
                      }
                      placeholder="List interpretation / overview"
                      className="min-h-12 rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />
                    <div className="space-y-2">
                      {editingCanon.items.map((item, index) => (
                        <div key={item.id} className="rounded-lg border border-zinc-300 bg-white/90 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-zinc-700">#{index + 1}</span>
                            <button
                              type="button"
                              data-note-edit-tags="true"
                              onClick={() => {
                                const next = editingCanon.items.filter((entry) => entry.id !== item.id);
                                updateNote(editing.id, {
                                  canon: {
                                    ...editingCanon,
                                    items: next.length > 0 ? next : [{ id: `canon-item-${Date.now()}`, title: "", text: "", interpretation: "" }],
                                  },
                                });
                              }}
                              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] text-zinc-600"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            data-note-edit-tags="true"
                            value={item.title}
                            onChange={(event) => {
                              const next = editingCanon.items.map((entry) =>
                                entry.id === item.id ? { ...entry, title: event.target.value } : entry,
                              );
                              updateNote(editing.id, { canon: { ...editingCanon, items: next } });
                            }}
                            placeholder="Item title"
                            className="mb-1 w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                          />
                          <textarea
                            data-note-edit-tags="true"
                            value={item.text}
                            onChange={(event) => {
                              const next = editingCanon.items.map((entry) =>
                                entry.id === item.id ? { ...entry, text: event.target.value } : entry,
                              );
                              updateNote(editing.id, { canon: { ...editingCanon, items: next } });
                            }}
                            placeholder="Item text"
                            className="min-h-12 w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                          />
                          <textarea
                            data-note-edit-tags="true"
                            value={item.interpretation}
                            onChange={(event) => {
                              const next = editingCanon.items.map((entry) =>
                                entry.id === item.id ? { ...entry, interpretation: event.target.value } : entry,
                              );
                              updateNote(editing.id, { canon: { ...editingCanon, items: next } });
                            }}
                            placeholder="Interpretation"
                            className="mt-1 min-h-10 w-full rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      data-note-edit-tags="true"
                      onClick={() => {
                        updateNote(editing.id, {
                          canon: {
                            ...editingCanon,
                            items: [...editingCanon.items, { id: `canon-item-${Date.now()}`, title: "", text: "", interpretation: "" }],
                          },
                        });
                      }}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
                    >
                      Add item
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {editingNote.noteKind === "quote" && (
            <div data-note-edit-tags="true" className={noteEditorSectionClass}>
              <p className={noteEditorSectionLabelClass}>Quote Attribution</p>
              <div className="mt-2 grid gap-2">
                <input
                  data-note-edit-tags="true"
                  value={editingNote.quoteAuthor ?? ""}
                  onChange={(event) => updateNote(editing.id, { quoteAuthor: event.target.value })}
                  placeholder="Author (optional)"
                  className={noteEditorInputClass}
                />
                <input
                  data-note-edit-tags="true"
                  value={editingNote.quoteSource ?? ""}
                  onChange={(event) => updateNote(editing.id, { quoteSource: event.target.value })}
                  placeholder="Source (optional)"
                  className={noteEditorInputClass}
                />
              </div>
            </div>
          )}
          <div data-note-edit-tags="true" className={noteEditorSectionClass}>
            <p className={noteEditorSectionLabelClass}>Tags</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {editingNote.tags.length === 0 && <span className="text-[11px] text-[var(--color-text-muted)]">No tags yet.</span>}
              {editingNote.tags.map((tag) => (
                <span key={`edit-tag-${tag}`} className={noteEditorTagChipClass}>
                  <button
                    type="button"
                    data-note-edit-tags="true"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setEditTagRenameFrom(tag);
                      setEditTagInput(tag);
                    }}
                    className="text-[var(--color-text)] hover:opacity-80"
                  >
                    #{tag}
                  </button>
                  <button
                    type="button"
                    data-note-edit-tags="true"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => removeTagFromNote(editing.id, tag)}
                    className="text-[var(--color-text-muted)] hover:text-red-500"
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
                className={`flex-1 ${noteEditorInputClass}`}
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
                className={noteEditorSecondaryButtonClass}
              >
                {editTagRenameFrom ? "Rename" : "Add"}
              </button>
            </div>
          </div>
        </>
      )}

      {tagPreviewScreen && tagPreviewNote && !editing && (
        <div
          className="pointer-events-none absolute z-[44] -translate-x-1/2 -translate-y-full"
          style={{ left: `${tagPreviewScreen.x}px`, top: `${tagPreviewScreen.y}px` }}
        >
          <div className="max-w-[min(70vw,34rem)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1.5 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)]">
            <div className="flex max-w-full flex-wrap items-center gap-1">
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
          <div role="toolbar" aria-label="Note quick actions" className="relative flex items-center gap-1">
            <label className={toolbarBtnCompact} title="Note color" aria-label="Note color">
              <span className="text-[11px]">Color</span>
              <input
                type="color"
                value={primarySelectedNote.color}
                onChange={(event) => applyColorToSelection(event.target.value.toUpperCase())}
                className="h-5 w-6 cursor-pointer rounded border border-zinc-300 bg-white p-0"
              />
            </label>
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
              onClick={() => setQuickActionsOverflowOpen((open) => !open)}
              className={quickActionsOverflowOpen ? toolbarBtnActive : toolbarBtnCompact}
              title="More note actions"
              aria-label="More note actions"
            >
              More
            </button>
            {quickActionsOverflowOpen && (
              <div className="absolute right-0 top-[calc(100%+0.45rem)] z-50 min-w-56 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-[var(--shadow-md)] backdrop-blur-[var(--blur-panel)]">
                <div className="space-y-1.5">
                  <select
                    value={primarySelectedNote.textFont ?? "nunito"}
                    onChange={(event) => applyTextFontToSelection(event.target.value as NonNullable<Note["textFont"]>)}
                    className={`w-full ${toolbarBtnCompact}`}
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
                    className={`w-full ${toolbarBtnCompact}`}
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
                    className={`w-full ${toolbarBtnCompact}`}
                    title="Horizontal align"
                    aria-label="Horizontal align"
                  >
                    <option value="left">Left align</option>
                    <option value="center">Center align</option>
                    <option value="right">Right align</option>
                  </select>
                  <select
                    value={primarySelectedNote.textVAlign ?? NOTE_DEFAULTS.textVAlign}
                    onChange={(event) => applyTextVerticalAlignToSelection(event.target.value as "top" | "middle" | "bottom")}
                    className={`w-full ${toolbarBtnCompact}`}
                    title="Vertical align"
                    aria-label="Vertical align"
                  >
                    <option value="top">Top align</option>
                    <option value="middle">Middle align</option>
                    <option value="bottom">Bottom align</option>
                  </select>
                  <label className={`w-full justify-between ${toolbarBtnCompact}`}>
                    <span>Text color</span>
                    <input
                      type="color"
                      value={primarySelectedNote.textColor ?? NOTE_DEFAULTS.textColor}
                      onChange={(event) => applyTextColorToSelection(event.target.value.toUpperCase())}
                      className="h-5 w-7 cursor-pointer rounded border border-zinc-300 bg-white p-0"
                      title="Note text color"
                      aria-label="Note text color"
                    />
                  </label>
                  <div className="my-1 h-px bg-[var(--color-border)]" />
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingFromNote(primarySelectedNote.id);
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${linkingFromNoteId ? toolbarBtnActive : toolbarBtnCompact}`}
                    title="Start link (Ctrl/Cmd + L)"
                    aria-label="Start link from selected note"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleHighlightOnNote(primarySelectedNote.id);
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${primarySelectedNote.highlighted ? toolbarBtnActive : toolbarBtnCompact}`}
                    title={primarySelectedNote.highlighted ? "Remove highlight" : "Highlight note"}
                    aria-label={primarySelectedNote.highlighted ? "Remove highlight" : "Highlight note"}
                  >
                    {primarySelectedNote.highlighted ? "Unhighlight" : "Highlight"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleFocusNote(primarySelectedNote.id);
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${isPrimaryNoteFocused ? toolbarBtnActive : toolbarBtnCompact}`}
                    title={isPrimaryNoteFocused ? "Exit focus mode" : "Focus this note"}
                    aria-label={isPrimaryNoteFocused ? "Exit focus mode" : "Focus note"}
                  >
                    {isPrimaryNoteFocused ? "Exit Focus" : "Focus"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const toQuote = primarySelectedNote.noteKind !== "quote";
                      updateNote(primarySelectedNote.id, {
                        noteKind: toQuote ? "quote" : "standard",
                        quoteAuthor: toQuote ? "" : undefined,
                        quoteSource: toQuote ? "" : undefined,
                        canon: undefined,
                        vocabulary: primarySelectedNote.vocabulary,
                      });
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${toolbarBtnCompact}`}
                    title={primarySelectedNote.noteKind === "quote" ? "Convert to standard note" : "Convert to quote note"}
                    aria-label={primarySelectedNote.noteKind === "quote" ? "Convert to standard note" : "Convert to quote note"}
                  >
                    {primarySelectedNote.noteKind === "quote" ? "Convert to Standard" : "Convert to Quote"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const toCanon = primarySelectedNote.noteKind !== "canon";
                      updateNote(primarySelectedNote.id, {
                        noteKind: toCanon ? "canon" : "standard",
                        quoteAuthor: undefined,
                        quoteSource: undefined,
                        vocabulary: toCanon ? undefined : primarySelectedNote.vocabulary,
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
                      });
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${toolbarBtnCompact}`}
                    title={primarySelectedNote.noteKind === "canon" ? "Convert to standard note" : "Convert to canon note"}
                    aria-label={primarySelectedNote.noteKind === "canon" ? "Convert to standard note" : "Convert to canon note"}
                  >
                    {primarySelectedNote.noteKind === "canon" ? "Canon -> Standard" : "Convert to Canon"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const toJournal = primarySelectedNote.noteKind !== "journal";
                      updateNote(primarySelectedNote.id, {
                        noteKind: toJournal ? "journal" : "standard",
                        quoteAuthor: undefined,
                        quoteSource: undefined,
                        canon: undefined,
                        vocabulary: toJournal ? undefined : primarySelectedNote.vocabulary,
                        color: toJournal ? JOURNAL_NOTE_DEFAULTS.color : primarySelectedNote.color,
                        textFont: toJournal ? JOURNAL_NOTE_DEFAULTS.textFont : primarySelectedNote.textFont,
                        textColor: toJournal ? JOURNAL_NOTE_DEFAULTS.textColor : primarySelectedNote.textColor,
                        textSizePx: toJournal ? JOURNAL_NOTE_DEFAULTS.textSizePx : primarySelectedNote.textSizePx,
                        tags: toJournal ? [...new Set([...primarySelectedNote.tags, "journal"])] : primarySelectedNote.tags,
                      });
                      setQuickActionsOverflowOpen(false);
                    }}
                    className={`w-full justify-start ${toolbarBtnCompact}`}
                    title={primarySelectedNote.noteKind === "journal" ? "Convert to standard note" : "Convert to journal note"}
                    aria-label={primarySelectedNote.noteKind === "journal" ? "Convert to standard note" : "Convert to journal note"}
                  >
                    {primarySelectedNote.noteKind === "journal" ? "Journal -> Standard" : "Convert to Journal"}
                  </button>
                </div>
              </div>
            )}
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
          mode={presentationModeType}
          presentationIndex={presentationIndex}
          presentationLength={presentationLength}
          narrativePaths={narrativePaths}
          activeNarrativePathId={activeNarrativePathId}
          activeStepTalkingPoints={activeStepTalkingPoints}
          onPrev={() => setPresentationIndex((previous) => Math.max(previous - 1, 0))}
          onNext={() => setPresentationIndex((previous) => Math.min(previous + 1, Math.max(0, presentationLength - 1)))}
          onCreateNarrativePath={onCreateNarrativePath}
          onPathChange={onPathChange}
          onAddStep={onAddNarrativeStep}
          onDeleteStep={onDeleteNarrativeStep}
          onUpdateTalkingPoints={onUpdateStepTalkingPoints}
          onCaptureStepCamera={onCaptureNarrativeStepCamera}
          onExit={() => setPresentationMode(false)}
        />
      )}
    </>
  );
};






