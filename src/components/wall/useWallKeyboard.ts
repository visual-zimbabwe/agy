"use client";

import { useEffect, useRef } from "react";

import { handleWallKeyboardEditingKey } from "@/components/wall/keyboard/useWallKeyboardEditing";
import { handleWallKeyboardNavigationKey, handleWallKeyboardNavigationKeyUp } from "@/components/wall/keyboard/useWallKeyboardNavigation";
import { handleWallKeyboardSelectionKey } from "@/components/wall/keyboard/useWallKeyboardSelection";
import type { WallKeyboardOptions } from "@/components/wall/keyboard/wall-keyboard-types";

export type { WallKeyboardOptions, WallKeyboardUiState } from "@/components/wall/keyboard/wall-keyboard-types";
export { isTypingInField } from "@/components/wall/keyboard/wall-keyboard-types";

export const useWallKeyboard = ({
  camera,
  viewport,
  notes,
  notesMap,
  renderNotesById,
  ui,
  selectedNoteIds,
  editing,
  isTimeLocked,
  readingMode,
  presentationMode,
  presentationLength,
  timelineEntriesLength,
  timelineViewActive,
  timelineModeRef,
  setIsSpaceDown,
  setShortcutsOpen,
  setSearchOpen,
  setExportOpen,
  setQuickCaptureOpen,
  setEditing,
  clearGuideLines,
  resetSelection,
  setSelectedNoteIds,
  selectNote,
  setTimelineMode,
  setTimelineIndex,
  setIsTimelinePlaying,
  toggleTimelineView,
  setShowHeatmap,
  setPresentationMode,
  setPresentationIndex,
  setReadingMode,
  createViewportNote,
  createCanonNote,
  createJournalNote,
  createQuoteNote,
  createEisenhowerNote,
  createWordNote,
  openEditor,
  redo,
  undo,
  setLinkingFromNote,
  duplicateNote,
  toggleVocabularyFlip,
  deleteNote,
  deleteZone,
  deleteLink,
  deleteGroup,
  deleteNoteGroup,
}: WallKeyboardOptions) => {
  const colorQuickSwitchArmedRef = useRef(false);
  const colorQuickSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const context = {
      camera,
      viewport,
      notes,
      notesMap,
      renderNotesById,
      ui,
      selectedNoteIds,
      editing,
      isTimeLocked,
      readingMode,
      presentationMode,
      presentationLength,
      timelineEntriesLength,
      timelineViewActive,
      timelineModeRef,
      setIsSpaceDown,
      setShortcutsOpen,
      setSearchOpen,
      setExportOpen,
      setQuickCaptureOpen,
      setEditing,
      clearGuideLines,
      resetSelection,
      setSelectedNoteIds,
      selectNote,
      setTimelineMode,
      setTimelineIndex,
      setIsTimelinePlaying,
      toggleTimelineView,
      setShowHeatmap,
      setPresentationMode,
      setPresentationIndex,
      setReadingMode,
      createViewportNote,
      createCanonNote,
      createJournalNote,
      createQuoteNote,
      createEisenhowerNote,
      createWordNote,
      openEditor,
      redo,
      undo,
      setLinkingFromNote,
      duplicateNote,
      toggleVocabularyFlip,
      deleteNote,
      deleteZone,
      deleteLink,
      deleteGroup,
      deleteNoteGroup,
      colorQuickSwitchArmedRef,
      colorQuickSwitchTimerRef,
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (handleWallKeyboardNavigationKey(event, context)) {
        return;
      }
      if (handleWallKeyboardEditingKey(event, context)) {
        return;
      }
      handleWallKeyboardSelectionKey(event, context);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      handleWallKeyboardNavigationKeyUp(event, setIsSpaceDown);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      if (colorQuickSwitchTimerRef.current) {
        clearTimeout(colorQuickSwitchTimerRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    camera,
    clearGuideLines,
    createViewportNote,
    createCanonNote,
    createJournalNote,
    createQuoteNote,
    createEisenhowerNote,
    createWordNote,
    deleteGroup,
    deleteLink,
    deleteNote,
    deleteZone,
    deleteNoteGroup,
    duplicateNote,
    editing,
    isTimeLocked,
    notes,
    notesMap,
    openEditor,
    presentationLength,
    presentationMode,
    readingMode,
    redo,
    renderNotesById,
    resetSelection,
    selectNote,
    selectedNoteIds,
    setEditing,
    setExportOpen,
    setIsSpaceDown,
    setIsTimelinePlaying,
    setLinkingFromNote,
    toggleVocabularyFlip,
    setPresentationIndex,
    setPresentationMode,
    setReadingMode,
    setQuickCaptureOpen,
    setSearchOpen,
    setSelectedNoteIds,
    setShortcutsOpen,
    setShowHeatmap,
    setTimelineIndex,
    setTimelineMode,
    toggleTimelineView,
    timelineEntriesLength,
    timelineViewActive,
    timelineModeRef,
    ui,
    undo,
    viewport,
  ]);
};
