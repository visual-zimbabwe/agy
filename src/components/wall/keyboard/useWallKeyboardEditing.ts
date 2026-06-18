import type { WallKeyboardKeyHandler } from "@/components/wall/keyboard/wall-keyboard-types";
import { isTypingInField } from "@/components/wall/keyboard/wall-keyboard-types";
import { useWallStore } from "@/features/wall/store";

export const handleWallKeyboardEditingKey: WallKeyboardKeyHandler = (event, context) => {
  const {
    ui,
    isTimeLocked,
    readingMode,
    timelineViewActive,
    renderNotesById,
    setShortcutsOpen,
    setSearchOpen,
    setExportOpen,
    setQuickCaptureOpen,
    setEditing,
    clearGuideLines,
    resetSelection,
    setSelectedNoteIds,
    selectNote,
    createViewportNote,
    createCanonNote,
    createJournalNote,
    createQuoteNote,
    createEisenhowerNote,
    createWordNote,
    openEditor,
    toggleVocabularyFlip,
  } = context;

  const typing = isTypingInField(event);

  if ((event.key === "?" || (event.shiftKey && event.key === "/")) && !typing) {
    event.preventDefault();
    if (readingMode) {
      return true;
    }
    setShortcutsOpen(!ui.isShortcutsOpen);
    return true;
  }

  if (event.key === "Escape") {
    if (timelineViewActive) {
      return false;
    }
    setSearchOpen(false);
    setExportOpen(false);
    setShortcutsOpen(false);
    setQuickCaptureOpen(false);
    setEditing(null);
    clearGuideLines();
    resetSelection();
    setSelectedNoteIds([]);
    selectNote(undefined);
    return true;
  }

  if (typing) {
    return false;
  }

  const key = event.key.toLowerCase();
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  if (!ctrlOrMeta && key === "f" && ui.selectedNoteId && context.notesMap[ui.selectedNoteId]?.vocabulary) {
    event.preventDefault();
    toggleVocabularyFlip(ui.selectedNoteId);
    return true;
  }

  if (readingMode || timelineViewActive) {
    return false;
  }

  if (!ctrlOrMeta && key === "q") {
    event.preventDefault();
    setQuickCaptureOpen((previous) => !previous);
    return true;
  }

  if (ctrlOrMeta && key === "j") {
    event.preventDefault();
    setQuickCaptureOpen((previous) => !previous);
    return true;
  }

  if ((key === "n" && !event.altKey) || (ctrlOrMeta && key === "n")) {
    if (isTimeLocked) {
      return true;
    }
    event.preventDefault();
    const createdId = createViewportNote();
    if (!createdId) {
      return true;
    }
    const createdNote = useWallStore.getState().notes[createdId];
    setSelectedNoteIds([createdId]);
    selectNote(createdId);
    if (createdNote) {
      openEditor(createdId, createdNote?.text ?? "");
    }
    return true;
  }

  if (!ctrlOrMeta && event.shiftKey && key === "w") {
    event.preventDefault();
    createWordNote();
    return true;
  }

  if (!ctrlOrMeta && event.shiftKey && key === "q") {
    event.preventDefault();
    createQuoteNote();
    return true;
  }

  if (!ctrlOrMeta && event.shiftKey && key === "e") {
    event.preventDefault();
    createEisenhowerNote();
    return true;
  }

  if (!ctrlOrMeta && event.shiftKey && key === "j") {
    event.preventDefault();
    if (typeof createJournalNote === "function") {
      createJournalNote();
    }
    return true;
  }

  if (!ctrlOrMeta && event.shiftKey && key === "g") {
    event.preventDefault();
    createCanonNote();
    return true;
  }

  if (ctrlOrMeta && key === "k") {
    event.preventDefault();
    setSearchOpen(true);
    return true;
  }

  if (!ctrlOrMeta && key === "enter" && ui.selectedNoteId && !isTimeLocked) {
    const selected = renderNotesById[ui.selectedNoteId];
    if (selected) {
      event.preventDefault();
      if (selected.vocabulary) {
        toggleVocabularyFlip(selected.id);
      } else {
        openEditor(selected.id, selected.text);
      }
      return true;
    }
  }

  return false;
};
