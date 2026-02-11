"use client";

import { useCallback } from "react";

import { NOTE_DEFAULTS, ZONE_DEFAULTS } from "@/features/wall/constants";
import type { Note, TemplateType } from "@/features/wall/types";

type Camera = { x: number; y: number; zoom: number };
type Viewport = { w: number; h: number };
type CaptureItem = { text: string; tags: string[] };
type AlignAxis = "left" | "center" | "right" | "top" | "middle" | "bottom";
type DistributeDirection = "horizontal" | "vertical";

type UseWallActionsOptions = {
  isTimeLocked: boolean;
  camera: Camera;
  viewport: Viewport;
  selectedNoteId?: string;
  selectedZoneId?: string;
  lastColor: string;
  templateType: TemplateType;
  tagInput: string;
  groupLabelInput: string;
  activeSelectedNoteIds: string[];
  selectedNotes: Note[];
  setTagInput: (value: string) => void;
  setLastColor: (color: string) => void;
  syncPrimarySelection: (ids: string[]) => void;
  toWorldPoint: (screenX: number, screenY: number, camera: Camera) => { x: number; y: number };
  createNote: (x: number, y: number, color?: string) => string;
  createZone: (x: number, y: number, label?: string, color?: string, groupId?: string) => string;
  applyTemplate: (type: TemplateType, x: number, y: number) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
  createZoneGroup: (label: string, zoneIds?: string[]) => string;
  runHistoryGroup: (fn: () => void) => void;
};

export const useWallActions = ({
  isTimeLocked,
  camera,
  viewport,
  selectedNoteId,
  selectedZoneId,
  lastColor,
  templateType,
  tagInput,
  groupLabelInput,
  activeSelectedNoteIds,
  selectedNotes,
  setTagInput,
  setLastColor,
  syncPrimarySelection,
  toWorldPoint,
  createNote,
  createZone,
  applyTemplate,
  updateNote,
  addTagToNote,
  removeTagFromNote,
  createZoneGroup,
  runHistoryGroup,
}: UseWallActionsOptions) => {
  const applyColorToSelection = useCallback(
    (color: string) => {
      if (isTimeLocked) {
        return;
      }
      if (activeSelectedNoteIds.length === 0) {
        if (selectedNoteId) {
          updateNote(selectedNoteId, { color });
        }
        setLastColor(color);
        return;
      }

      for (const id of activeSelectedNoteIds) {
        updateNote(id, { color });
      }
      setLastColor(color);
    },
    [activeSelectedNoteIds, isTimeLocked, selectedNoteId, setLastColor, updateNote],
  );

  const applyTextSizeToSelection = useCallback(
    (textSize: "sm" | "md" | "lg") => {
      if (isTimeLocked) {
        return;
      }
      const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : selectedNoteId ? [selectedNoteId] : [];
      for (const id of targetIds) {
        updateNote(id, { textSize });
      }
    },
    [activeSelectedNoteIds, isTimeLocked, selectedNoteId, updateNote],
  );

  const alignSelected = useCallback(
    (axis: AlignAxis) => {
      if (isTimeLocked || selectedNotes.length < 2) {
        return;
      }
      const minX = Math.min(...selectedNotes.map((n) => n.x));
      const maxX = Math.max(...selectedNotes.map((n) => n.x + n.w));
      const minY = Math.min(...selectedNotes.map((n) => n.y));
      const maxY = Math.max(...selectedNotes.map((n) => n.y + n.h));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      runHistoryGroup(() => {
        for (const note of selectedNotes) {
          if (axis === "left") updateNote(note.id, { x: minX });
          if (axis === "right") updateNote(note.id, { x: maxX - note.w });
          if (axis === "center") updateNote(note.id, { x: centerX - note.w / 2 });
          if (axis === "top") updateNote(note.id, { y: minY });
          if (axis === "bottom") updateNote(note.id, { y: maxY - note.h });
          if (axis === "middle") updateNote(note.id, { y: centerY - note.h / 2 });
        }
      });
    },
    [isTimeLocked, runHistoryGroup, selectedNotes, updateNote],
  );

  const distributeSelected = useCallback(
    (direction: DistributeDirection) => {
      if (isTimeLocked || selectedNotes.length < 3) {
        return;
      }

      const sorted =
        direction === "horizontal"
          ? [...selectedNotes].sort((a, b) => a.x - b.x)
          : [...selectedNotes].sort((a, b) => a.y - b.y);

      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (!first || !last) {
        return;
      }
      const span = direction === "horizontal" ? last.x - first.x : last.y - first.y;
      const gap = span / (sorted.length - 1);

      runHistoryGroup(() => {
        sorted.forEach((note, index) => {
          if (direction === "horizontal") {
            updateNote(note.id, { x: first.x + gap * index });
          } else {
            updateNote(note.id, { y: first.y + gap * index });
          }
        });
      });
    },
    [isTimeLocked, runHistoryGroup, selectedNotes, updateNote],
  );

  const makeNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const id = createNote(world.x - NOTE_DEFAULTS.width / 2, world.y - NOTE_DEFAULTS.height / 2, lastColor);
    syncPrimarySelection([id]);
  }, [camera, createNote, isTimeLocked, lastColor, syncPrimarySelection, toWorldPoint, viewport.h, viewport.w]);

  const makeZoneAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    createZone(world.x - ZONE_DEFAULTS.width / 2, world.y - ZONE_DEFAULTS.height / 2, "Zone");
  }, [camera, createZone, isTimeLocked, toWorldPoint, viewport.h, viewport.w]);

  const applySelectedTemplate = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    applyTemplate(templateType, world.x, world.y);
  }, [applyTemplate, camera, isTimeLocked, templateType, toWorldPoint, viewport.h, viewport.w]);

  const addTagToSelectedNote = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : selectedNoteId ? [selectedNoteId] : [];
    if (targetIds.length === 0) {
      return;
    }
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag) {
      return;
    }
    for (const noteId of targetIds) {
      addTagToNote(noteId, tag);
    }
    setTagInput("");
  }, [activeSelectedNoteIds, addTagToNote, isTimeLocked, selectedNoteId, setTagInput, tagInput]);

  const removeTagFromSelectedNote = useCallback(
    (tag: string) => {
      if (isTimeLocked) {
        return;
      }
      const targetIds = activeSelectedNoteIds.length > 0 ? activeSelectedNoteIds : selectedNoteId ? [selectedNoteId] : [];
      if (targetIds.length === 0) {
        return;
      }
      for (const noteId of targetIds) {
        removeTagFromNote(noteId, tag);
      }
    },
    [activeSelectedNoteIds, isTimeLocked, removeTagFromNote, selectedNoteId],
  );

  const createGroupFromSelectedZone = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    if (!selectedZoneId) {
      return;
    }
    const label = groupLabelInput.trim() || "Group";
    createZoneGroup(label, [selectedZoneId]);
  }, [createZoneGroup, groupLabelInput, isTimeLocked, selectedZoneId]);

  const captureNotes = useCallback(
    (items: CaptureItem[]) => {
      if (isTimeLocked || items.length === 0) {
        return;
      }

      const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
      const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(items.length))));
      const gapX = NOTE_DEFAULTS.width + 24;
      const gapY = NOTE_DEFAULTS.height + 20;

      const createdIds: string[] = [];
      items.forEach((item, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const x = world.x + (col - (columns - 1) / 2) * gapX;
        const y = world.y + row * gapY;
        const id = createNote(x, y, lastColor);
        updateNote(id, { text: item.text, tags: item.tags });
        createdIds.push(id);
      });

      syncPrimarySelection(createdIds);
    },
    [camera, createNote, isTimeLocked, lastColor, syncPrimarySelection, toWorldPoint, updateNote, viewport.h, viewport.w],
  );

  return {
    applyColorToSelection,
    applyTextSizeToSelection,
    alignSelected,
    distributeSelected,
    makeNoteAtViewportCenter,
    makeZoneAtViewportCenter,
    applySelectedTemplate,
    addTagToSelectedNote,
    removeTagFromSelectedNote,
    createGroupFromSelectedZone,
    captureNotes,
  };
};
