import type { WallKeyboardKeyHandler } from "@/components/wall/keyboard/wall-keyboard-types";
import { isTypingInField } from "@/components/wall/keyboard/wall-keyboard-types";
import { bulkDeleteNotes, bulkRecolorNotes } from "@/features/wall/commands";
import { sanitizeStandardNoteColor } from "@/features/wall/special-notes";
import { useWallStore } from "@/features/wall/store";
import { readKeyboardColorSlots } from "@/lib/keyboard-color-slots";

export const handleWallKeyboardSelectionKey: WallKeyboardKeyHandler = (event, context) => {
  const {
    ui,
    notes,
    notesMap,
    selectedNoteIds,
    editing,
    isTimeLocked,
    readingMode,
    presentationMode,
    timelineViewActive,
    colorQuickSwitchArmedRef,
    setSelectedNoteIds,
    selectNote,
    redo,
    undo,
    setLinkingFromNote,
    duplicateNote,
    deleteNote,
    deleteZone,
    deleteLink,
    deleteGroup,
    deleteNoteGroup,
  } = context;

  if (isTypingInField(event) || readingMode || presentationMode || timelineViewActive) {
    return false;
  }

  const key = event.key.toLowerCase();
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const digit = Number.parseInt(event.key, 10);

  const applyColor = (color: string) => {
    if (isTimeLocked) {
      return;
    }
    const safeColor = sanitizeStandardNoteColor(color, ui.lastColor);
    const targetIds = selectedNoteIds.length > 0 ? selectedNoteIds : ui.selectedNoteId ? [ui.selectedNoteId] : [];
    if (targetIds.length === 0) {
      useWallStore.getState().setLastColor(safeColor);
      return;
    }
    bulkRecolorNotes(targetIds, safeColor);
  };

  const applyColorByIndex = (index: number) => {
    const color = readKeyboardColorSlots()[index];
    if (!color) {
      return;
    }
    applyColor(color);
  };

  const cycleColor = () => {
    const cyclePalette = readKeyboardColorSlots().filter((value): value is string => typeof value === "string");
    if (cyclePalette.length === 0) {
      return;
    }
    const activeNoteId = selectedNoteIds[0] ?? ui.selectedNoteId;
    const activeColor = activeNoteId ? notesMap[activeNoteId]?.color ?? ui.lastColor : ui.lastColor;
    const currentIndex = cyclePalette.findIndex((color) => color.toLowerCase() === activeColor.toLowerCase());
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % cyclePalette.length;
    const nextColor = cyclePalette[nextIndex];
    if (!nextColor) {
      return;
    }
    applyColor(nextColor);
  };

  if (!ctrlOrMeta && !event.altKey && event.shiftKey && key === "c") {
    event.preventDefault();
    cycleColor();
    return true;
  }

  if (!ctrlOrMeta && !event.altKey && !event.shiftKey && key === "c") {
    event.preventDefault();
    colorQuickSwitchArmedRef.current = true;
    if (context.colorQuickSwitchTimerRef.current) {
      clearTimeout(context.colorQuickSwitchTimerRef.current);
    }
    context.colorQuickSwitchTimerRef.current = setTimeout(() => {
      colorQuickSwitchArmedRef.current = false;
    }, 5000);
    return true;
  }

  if (!ctrlOrMeta && !event.altKey && Number.isInteger(digit) && digit >= 1 && digit <= 9) {
    if (!colorQuickSwitchArmedRef.current) {
      return false;
    }
    event.preventDefault();
    applyColorByIndex(digit - 1);
    return true;
  }

  if (ctrlOrMeta && key === "a") {
    event.preventDefault();
    if (isTimeLocked) {
      return true;
    }
    const ids = notes.map((note) => note.id);
    setSelectedNoteIds(ids);
    selectNote(ids.length === 1 ? ids[0] : undefined);
    return true;
  }

  if (ctrlOrMeta && key === "z") {
    event.preventDefault();
    if (isTimeLocked) {
      return true;
    }
    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
    return true;
  }

  if (ctrlOrMeta && key === "y") {
    event.preventDefault();
    if (isTimeLocked) {
      return true;
    }
    redo();
    return true;
  }

  if (ctrlOrMeta && key === "l") {
    if (isTimeLocked) {
      return true;
    }
    event.preventDefault();
    if (ui.selectedNoteId) {
      setLinkingFromNote(ui.selectedNoteId);
    }
    return true;
  }

  if ((ctrlOrMeta && key === "d") || (event.shiftKey && key === "d")) {
    if (isTimeLocked) {
      return true;
    }
    if (ui.selectedNoteId) {
      event.preventDefault();
      duplicateNote(ui.selectedNoteId);
    }
    return true;
  }

  if ((key === "delete" || key === "backspace") && !editing) {
    if (isTimeLocked) {
      return true;
    }
    if (selectedNoteIds.length > 1) {
      const ok = window.confirm(`Delete ${selectedNoteIds.length} selected notes?`);
      if (ok) {
        bulkDeleteNotes(selectedNoteIds);
        setSelectedNoteIds([]);
        selectNote(undefined);
      }
      return true;
    }
    if (ui.selectedNoteId) {
      const ok = window.confirm("Delete selected note?");
      if (ok) {
        deleteNote(ui.selectedNoteId);
      }
      return true;
    }
    if (ui.selectedZoneId) {
      const ok = window.confirm("Delete selected zone?");
      if (ok) {
        deleteZone(ui.selectedZoneId);
      }
      return true;
    }
    if (ui.selectedLinkId) {
      const ok = window.confirm("Delete selected link?");
      if (ok) {
        deleteLink(ui.selectedLinkId);
      }
      return true;
    }
    if (ui.selectedGroupId) {
      const ok = window.confirm("Delete selected zone group?");
      if (ok) {
        deleteGroup(ui.selectedGroupId);
      }
      return true;
    }
    if (ui.selectedNoteGroupId) {
      const ok = window.confirm("Delete selected note group?");
      if (ok) {
        deleteNoteGroup(ui.selectedNoteGroupId);
      }
      return true;
    }
  }

  return false;
};
