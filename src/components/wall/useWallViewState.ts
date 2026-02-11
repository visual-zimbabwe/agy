"use client";

import { useMemo } from "react";

import { noteTagChipPalette, toScreenPoint } from "@/components/wall/wall-canvas-helpers";
import type { Note, Zone, ZoneGroup } from "@/features/wall/types";

type UseWallViewStateOptions = {
  ui: {
    selectedNoteId?: string;
    selectedZoneId?: string;
    selectedGroupId?: string;
    linkingFromNoteId?: string;
  };
  notesById: Record<string, Note>;
  zonesById: Record<string, Zone>;
  groupsById: Record<string, ZoneGroup>;
  activeSelectedNoteIds: string[];
  selectedNotes: Note[];
  hoveredNoteId?: string;
  camera: { x: number; y: number; zoom: number };
  isTimeLocked: boolean;
  publishedReadOnly: boolean;
};

export const useWallViewState = ({
  ui,
  notesById,
  zonesById,
  groupsById,
  activeSelectedNoteIds,
  selectedNotes,
  hoveredNoteId,
  camera,
  isTimeLocked,
  publishedReadOnly,
}: UseWallViewStateOptions) => {
  const selectedNote = ui.selectedNoteId ? notesById[ui.selectedNoteId] : undefined;
  const primarySelectedNoteId = activeSelectedNoteIds[0] ?? ui.selectedNoteId;
  const primarySelectedNote = primarySelectedNoteId ? notesById[primarySelectedNoteId] : undefined;
  const selectedZone = ui.selectedZoneId ? zonesById[ui.selectedZoneId] : undefined;
  const selectedGroup = ui.selectedGroupId ? groupsById[ui.selectedGroupId] : undefined;
  const hasNoteSelection = activeSelectedNoteIds.length > 0 || Boolean(ui.selectedNoteId);
  const showContextColor = hasNoteSelection;
  const showContextTextSize = hasNoteSelection;
  const showContextAlign = selectedNotes.length >= 2;
  const hasContextActions = showContextColor || showContextTextSize || showContextAlign;
  const displayedTags = useMemo(
    () =>
      selectedNotes.length > 1
        ? selectedNotes
            .map((note) => note.tags)
            .reduce<string[]>((common, tags) => (common.length === 0 ? [...tags] : common.filter((tag) => tags.includes(tag))), [])
        : selectedNote?.tags ?? [],
    [selectedNote?.tags, selectedNotes],
  );
  const statusMessage = publishedReadOnly
    ? "Read-only published snapshot"
    : activeSelectedNoteIds.length > 1
      ? `${activeSelectedNoteIds.length} notes selected`
      : ui.linkingFromNoteId
        ? `Link mode: pick a target note for ${notesById[ui.linkingFromNoteId]?.text.split("\n")[0] || "selected note"}`
        : "";
  const quickActionScreen =
    primarySelectedNote && !isTimeLocked
      ? toScreenPoint(primarySelectedNote.x + primarySelectedNote.w / 2, primarySelectedNote.y - 16, camera)
      : undefined;
  const tagPreviewNote = hoveredNoteId ? notesById[hoveredNoteId] : primarySelectedNote;
  const tagPreviewPalette = tagPreviewNote ? noteTagChipPalette(tagPreviewNote.color) : undefined;
  const tagPreviewScreen =
    tagPreviewNote && tagPreviewNote.tags.length > 0
      ? toScreenPoint(tagPreviewNote.x + tagPreviewNote.w / 2, tagPreviewNote.y - 10, camera)
      : undefined;

  return {
    selectedNote,
    primarySelectedNote,
    selectedZone,
    selectedGroup,
    showContextColor,
    showContextTextSize,
    showContextAlign,
    hasContextActions,
    displayedTags,
    statusMessage,
    quickActionScreen,
    tagPreviewNote,
    tagPreviewPalette,
    tagPreviewScreen,
  };
};
