"use client";

import { NoteInspectorSection } from "@/components/wall/details/NoteInspectorSection";
import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallDetails } from "@/components/wall/session/wall-details-context";

export const WallDetailsContent = () => {
  const { isTimeLocked } = useWallChrome();
  const details = useWallDetails();

  const {
    selectedNote,
    linkingFromNoteId,
    isSelectedNoteFocused,
    backlinks,
    onNavigateLinkedNote,
    onTextFontChange,
    onTextSizeChange,
    onTextColorChange,
    onTextHorizontalAlignChange,
    onTextVerticalAlignChange,
    onBackgroundColorChange,
    onDuplicateSelectedNote,
    onTogglePinSelectedNote,
    onToggleHighlightSelectedNote,
    onToggleFocusSelectedNote,
    onStartLinkFromSelectedNote,
    onUpdateSelectedNote,
    privateNoteSupported,
    isPrivateEnabled,
    isPrivateUnlocked,
    onProtectPrivateNote,
    onUnlockPrivateNote,
    onLockPrivateNote,
    onRemovePrivateProtection,
  } = details;

  if (!selectedNote) {
    return null;
  }

  return (
    <NoteInspectorSection
      key={selectedNote.id}
      selectedNote={selectedNote}
      isTimeLocked={isTimeLocked}
      linkingFromNoteId={linkingFromNoteId}
      isFocused={isSelectedNoteFocused}
      backlinks={backlinks}
      onNavigateLinkedNote={onNavigateLinkedNote}
      onTextFontChange={onTextFontChange}
      onTextSizeChange={onTextSizeChange}
      onTextColorChange={onTextColorChange}
      onTextHorizontalAlignChange={onTextHorizontalAlignChange}
      onTextVerticalAlignChange={onTextVerticalAlignChange}
      onBackgroundColorChange={onBackgroundColorChange}
      onDuplicate={onDuplicateSelectedNote}
      onTogglePin={onTogglePinSelectedNote}
      onToggleHighlight={onToggleHighlightSelectedNote}
      onToggleFocus={onToggleFocusSelectedNote}
      onStartLink={onStartLinkFromSelectedNote}
      onUpdateNote={onUpdateSelectedNote}
      privateNoteSupported={privateNoteSupported}
      isPrivateEnabled={isPrivateEnabled}
      isPrivateUnlocked={isPrivateUnlocked}
      onProtectPrivateNote={onProtectPrivateNote}
      onUnlockPrivateNote={onUnlockPrivateNote}
      onLockPrivateNote={onLockPrivateNote}
      onRemovePrivateProtection={onRemovePrivateProtection}
    />
  );
};
