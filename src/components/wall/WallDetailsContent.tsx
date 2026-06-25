"use client";

import { NoteInspectorSection } from "@/components/wall/details/NoteInspectorSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { detailSectionStack } from "@/components/wall/details/detailSectionStyles";
import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallDetails } from "@/components/wall/session/wall-details-context";

const GroupHeader = ({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) => (
  <div className="px-1">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{eyebrow}</p>
    <h4 className="mt-1 text-sm font-semibold text-[var(--color-text)]">{title}</h4>
    <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-muted)]">{description}</p>
  </div>
);

export const WallDetailsContent = () => {
  const { isTimeLocked } = useWallChrome();
  const details = useWallDetails();

  const {
    tagInput,
    onTagInputChange,
    onAddTag,
    selectedNote,
    selectedNoteId,
    selectedNoteIdsCount,
    displayedTags,
    onRemoveTag,
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
    <div className="space-y-6">
      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Selection"
          title="Inspector"
          description="Inspect the active note without leaving the wall. Typography, backlinks, styling, and note-level actions stay together here."
        />
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
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Quick Actions"
          title="Templates and selection"
          description="Label the current selection without hunting through stacked forms."
        />
        <SelectionTagsSection
          tagInput={tagInput}
          onTagInputChange={onTagInputChange}
          onAddTag={onAddTag}
          selectedNoteId={selectedNoteId}
          selectedNoteIdsCount={selectedNoteIdsCount}
          displayedTags={displayedTags}
          isTimeLocked={isTimeLocked}
          onRemoveTag={onRemoveTag}
        />
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Structure"
          title="Zones and tag signals"
          description="Use auto tag signals as lightweight navigation aids across the wall."
        />
        <TagGroupsSection />
      </div>
    </div>
  );
};
