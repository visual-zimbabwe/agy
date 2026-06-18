import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type Konva from "konva";

import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { LinkType, Note } from "@/features/wall/types";

type GuideLineState = {
  vertical?: { x: number; y1: number; y2: number; distance?: number };
  horizontal?: { y: number; x1: number; x2: number; distance?: number };
};

type ResizeDraft = { x: number; y: number; w: number; h: number };

export type WallNoteGroupInteractionContext = {
  note: Note;
  noteView: Note;
  isTimeLocked: boolean;
  isPinned: boolean;
  activeSelectedNoteIds: string[];
  linkingFromNoteId?: string;
  linkType: LinkType;
  editingId?: string;
  notesById: Record<string, Note>;
  resizingNoteDrafts: Record<string, ResizeDraft>;
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
  createLink: (fromNoteId: string, toNoteId: string, linkType: LinkType) => void;
  resolveSnappedPosition: (note: Note, candidateX: number, candidateY: number) => { x: number; y: number };
  runHistoryGroup: (action: () => void) => void;
  moveNote: (noteId: string, x: number, y: number) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  duplicateNoteAt: (noteId: string, x: number, y: number) => void;
  openNoteEditor: () => void;
};

export const buildWallNoteGroupProps = ({
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
}: WallNoteGroupInteractionContext) => {
  const handleSelect = (multiSelect: boolean) => {
    if (multiSelect) {
      toggleSelectNote(note.id);
    } else {
      selectSingleNote(note.id);
    }
    if (editingId !== note.id) {
      setEditing(null);
    }
  };

  return {
    ref: (node: Konva.Group | null) => {
      noteNodeRefs.current[note.id] = node;
    },
    x: noteView.x,
    y: noteView.y,
    width: noteView.w,
    height: noteView.h,
    draggable: !isTimeLocked && !isPinned,
    onMouseEnter: () => setHoveredNoteId(note.id),
    onMouseLeave: () => setHoveredNoteId((previous) => (previous === note.id ? undefined : previous)),
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      if (isTimeLocked) {
        selectSingleNote(note.id);
        return;
      }
      if (linkingFromNoteId && linkingFromNoteId !== note.id) {
        createLink(linkingFromNoteId, note.id, linkType);
        setLinkingFromNote(undefined);
        return;
      }
      handleSelect(Boolean(event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey));
    },
    onTap: (event: Konva.KonvaEventObject<Event>) => {
      if (isTimeLocked) {
        selectSingleNote(note.id);
        return;
      }
      const nativeEvent = event.evt as Event & { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean };
      if (linkingFromNoteId && linkingFromNoteId !== note.id) {
        createLink(linkingFromNoteId, note.id, linkType);
        setLinkingFromNote(undefined);
        return;
      }
      handleSelect(Boolean(nativeEvent.shiftKey || nativeEvent.ctrlKey || nativeEvent.metaKey));
    },
    onDblClick: openNoteEditor,
    onDragStart: (event: Konva.KonvaEventObject<DragEvent>) => {
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
          activeIds.flatMap((id) => {
            const entry = notesById[id];
            if (!entry || entry.pinned) {
              return [];
            }
            return [[entry.id, { x: entry.x, y: entry.y }] as const];
          }),
        );
        dragAnchorRef.current = { id: note.id, x: event.target.x(), y: event.target.y() };
      }
    },
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
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
        if (id === note.id || notesById[id]?.pinned) {
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
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
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
            if (id === note.id || notesById[id]?.pinned) {
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
    },
    onTransform: (event: Konva.KonvaEventObject<Event>) => {
      if (isTimeLocked || isPinned) {
        return;
      }
      const node = event.target;
      const width = Math.max(NOTE_DEFAULTS.minWidth, node.width() * node.scaleX());
      const height = Math.max(NOTE_DEFAULTS.minHeight, node.height() * node.scaleY());
      node.scaleX(1);
      node.scaleY(1);
      setResizingNoteDrafts((previous) => ({
        ...previous,
        [note.id]: { x: node.x(), y: node.y(), w: width, h: height },
      }));
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      if (isTimeLocked || isPinned) {
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
    },
  };
};
