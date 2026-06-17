"use client";

import { HistorySection } from "@/components/wall/details/HistorySection";
import { NoteInspectorSection } from "@/components/wall/details/NoteInspectorSection";
import { RecallSection } from "@/components/wall/details/RecallSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { SmartMergeSection } from "@/components/wall/details/SmartMergeSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { VocabularySection } from "@/components/wall/details/VocabularySection";
import { detailInsetCard, detailSectionStack, detailSectionTitle } from "@/components/wall/details/detailSectionStyles";
import { TemplatesSection } from "@/components/wall/details/TemplatesSection";
import { ZoneGroupsSection } from "@/components/wall/details/ZoneGroupsSection";
import { useWallChrome } from "@/components/wall/session/wall-chrome-context";
import { useWallDetails } from "@/components/wall/session/wall-details-context";
import { useWallLayout } from "@/components/wall/session/wall-layout-context";
import { TEMPLATE_TYPES } from "@/features/wall/constants";

const GroupHeader = ({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) => (
  <div className="px-1">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{eyebrow}</p>
    <h4 className="mt-1 text-sm font-semibold text-[var(--color-text)]">{title}</h4>
    <p className="mt-1 text-[11px] leading-5 text-[var(--color-text-muted)]">{description}</p>
  </div>
);

const SummaryMetric = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className={detailInsetCard}>
    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    <p className="mt-1 text-[10px] leading-4 text-[var(--color-text-muted)]">{hint}</p>
  </div>
);

export const WallDetailsContent = () => {
  const { controlsMode } = useWallLayout();
  const { isTimeLocked, history } = useWallChrome();
  const details = useWallDetails();

  const {
    templateType,
    onTemplateTypeChange,
    onApplyTemplate,
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
    recallQuery,
    savedRecallSearches,
    vocabularyDueCount,
  } = details;

  const advancedMode = controlsMode === "advanced";
  const activeRecallFilters = [
    recallQuery.trim(),
    details.recallZoneId,
    details.recallTag,
    details.recallDateFilter !== "all" ? details.recallDateFilter : "",
  ]
    .filter(Boolean)
    .length;
  const selectedCount = selectedNoteIdsCount || (selectedNoteId ? 1 : 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[calc(var(--radius-lg)+0.24rem)] border border-[var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-elevated)_94%,white_6%)_0%,color-mix(in_srgb,var(--color-surface)_96%,black_4%)_100%)] p-4 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={detailSectionTitle}>Overview</p>
            <h4 className="mt-1 text-base font-semibold text-[var(--color-text)]">Premium wall control center</h4>
            <p className="mt-2 text-[11px] leading-5 text-[var(--color-text-muted)]">
              Fast access to templates, recall filters, review workflows, structure controls, and maintenance tasks.
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {advancedMode ? "Advanced" : "Basic"}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SummaryMetric label="Selection" value={selectedCount === 0 ? "None" : `${selectedCount}`} hint={selectedCount === 1 ? "Focused note" : "Current selection"} />
          <SummaryMetric label="Visible" value={`${history.visibleNotesCount}`} hint="Notes in current view" />
          <SummaryMetric label="Recall" value={activeRecallFilters === 0 ? "Open" : `${activeRecallFilters} on`} hint={`${savedRecallSearches.length} saved searches`} />
          <SummaryMetric label="Review" value={`${vocabularyDueCount}`} hint="Words due now" />
        </div>
        {selectedNote && (
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1">{selectedNote.noteKind} note</span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1">{displayedTags.length} tags</span>
            {isSelectedNoteFocused && <span className="rounded-full border border-[var(--color-focus)] bg-[color:rgb(2_132_199_/_0.1)] px-2.5 py-1 text-[var(--color-accent-strong)]">Focus mode</span>}
          </div>
        )}
      </section>

      {selectedNote ? (
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
      ) : null}

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Quick Actions"
          title="Templates and selection"
          description="Apply structure quickly, then label the current selection without hunting through stacked forms."
        />
        <TemplatesSection
          templateType={templateType}
          templateOptions={TEMPLATE_TYPES}
          isTimeLocked={isTimeLocked}
          onTemplateTypeChange={onTemplateTypeChange}
          onApplyTemplate={onApplyTemplate}
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
          eyebrow="Recall"
          title="Search and saved filters"
          description="Search across the wall, narrow by structure or tags, and keep repeatable recall workflows one click away."
        />
        <RecallSection />
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Review"
          title="Word review"
          description="Track due vocabulary, review context, and move through the spaced-repetition flow without clutter."
        />
        <VocabularySection />
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Structure"
          title="Zones and tag signals"
          description="Manage primary wall structure with groups and use auto tag signals as lightweight navigation aids."
        />
        <ZoneGroupsSection />
        {advancedMode && <TagGroupsSection />}
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Maintenance"
          title="Merge and history"
          description="Resolve duplicates confidently and keep operational controls tucked together at the bottom of the panel."
        />
        <SmartMergeSection />
        {advancedMode && <HistorySection />}
      </div>
    </div>
  );
};
