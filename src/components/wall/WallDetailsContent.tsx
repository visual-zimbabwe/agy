"use client";

import type { Note, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";
import { HistorySection } from "@/components/wall/details/HistorySection";
import { NoteInspectorSection } from "@/components/wall/details/NoteInspectorSection";
import { RecallSection } from "@/components/wall/details/RecallSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { SmartMergeSection } from "@/components/wall/details/SmartMergeSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { VocabularySection } from "@/components/wall/details/VocabularySection";
import { detailInsetCard, detailSectionStack, detailSectionTitle } from "@/components/wall/details/detailSectionStyles";
import { type AutoTagGroup, type DetailsSectionKey, type DetailsSectionState, type RecallDateFilter, type SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { TemplatesSection } from "@/components/wall/details/TemplatesSection";
import { ZoneGroupsSection } from "@/components/wall/details/ZoneGroupsSection";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";
import type { VocabularyReviewOutcome } from "@/features/wall/types";

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type WallDetailsContentProps = {
  controlsMode: "basic" | "advanced";
  templateType: TemplateType;
  templateOptions: readonly TemplateOption[];
  isTimeLocked: boolean;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  selectedNote?: Note;
  selectedNotePageReference?: { docId: string; blockId: string };
  selectedNotePageConversion?: { docId: string };
  hasJokerNote: boolean;
  hasThroneNote: boolean;
  selectedNoteId?: string;
  selectedNoteIdsCount: number;
  displayedTags: string[];
  onRemoveTag: (tag: string) => void;
  linkingFromNoteId?: string;
  isSelectedNoteFocused: boolean;
  backlinks: Array<{ noteId: string; title: string }>;
  onNavigateLinkedNote: (noteId: string) => void;
  onTextFontChange: (font: import("@/features/wall/types").NoteTextFont) => void;
  onTextSizeChange: (sizePx: number) => void;
  onTextColorChange: (color: string) => void;
  onTextHorizontalAlignChange: (align: "left" | "center" | "right") => void;
  onTextVerticalAlignChange: (align: "top" | "middle" | "bottom") => void;
  onBackgroundColorChange: (color: string) => void;
  onDuplicateSelectedNote: (noteId: string) => void;
  onReferenceSelectedNoteInPage: (noteId: string) => void;
  onOpenSelectedNotePageReference: (noteId: string) => void;
  onUndoSelectedNotePageReference: (noteId: string) => void;
  onConvertSelectedNoteToPage: (noteId: string) => void;
  onOpenSelectedNoteConvertedPage: (noteId: string) => void;
  onUndoSelectedNotePageConversion: (noteId: string) => void;
  onTogglePinSelectedNote: (noteId: string) => void;
  onToggleHighlightSelectedNote: (noteId: string) => void;
  onToggleFocusSelectedNote: (noteId: string) => void;
  onToggleOrRefreshJokerSelectedNote: (noteId: string) => void;
  onToggleOrRefreshThroneSelectedNote: (noteId: string) => void;
  onRefreshPoetrySelectedNote: (noteId: string, options?: { force?: boolean; field?: import("@/features/wall/types").PoetrySearchField; query?: string; matchType?: import("@/features/wall/types").PoetrySearchMatchType }) => void;
  onStartLinkFromSelectedNote: (noteId: string) => void;
  onUpdateSelectedNote: (noteId: string, patch: Partial<Note>) => void;
  onSubmitBookmarkUrl: (noteId: string, url: string, options?: { force?: boolean }) => void;
  onOpenBookmarkUrl: (url: string) => void;
  onSelectImageNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitImageNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameImageNote: (noteId: string, name: string) => void;
  onOpenImageNote: (noteId: string) => void;
  onDownloadImageNote: (noteId: string) => void;
  onSelectFileNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitFileNoteUrl: (noteId: string, url: string) => void;
  onOpenFileNote: (noteId: string) => void;
  onDownloadFileNote: (noteId: string) => void;
  onSelectAudioNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitAudioNoteUrl: (noteId: string, url: string) => void;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  onSelectVideoNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitVideoNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameVideoNote: (noteId: string, name: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
  privateNoteSupported: boolean;
  isPrivateEnabled: boolean;
  isPrivateUnlocked: boolean;
  onProtectPrivateNote: (noteId: string) => void;
  onUnlockPrivateNote: (noteId: string) => void;
  onLockPrivateNote: (noteId: string) => void;
  onRemovePrivateProtection: (noteId: string) => void;
  detailsSectionsOpen: DetailsSectionState;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  timelineEntriesCount: number;
  visibleNotesCount: number;
  historyUndoDepth: number;
  historyRedoDepth: number;
  notes: Note[];
  onJumpStale: () => void;
  onJumpPriority: () => void;
  onClearHistory: () => void;
  recallQuery: string;
  onRecallQueryChange: (value: string) => void;
  recallZoneId: string;
  onRecallZoneIdChange: (value: string) => void;
  recallTag: string;
  onRecallTagChange: (value: string) => void;
  recallDateFilter: RecallDateFilter;
  onRecallDateFilterChange: (value: RecallDateFilter) => void;
  visibleZones: Zone[];
  availableRecallTags: string[];
  onSaveRecallSearch: () => void;
  onClearRecallFilters: () => void;
  savedRecallSearches: SavedRecallSearch[];
  onApplySavedRecallSearch: (item: SavedRecallSearch) => void;
  onDeleteSavedRecallSearch: (id: string) => void;
  isSelectedNoteVocabulary: boolean;
  vocabularyDueCount: number;
  vocabularyFocusCount: number;
  reviewedTodayCount: number;
  reviewRevealMeaning: boolean;
  onToggleRevealMeaning: () => void;
  onToggleFlipCard: () => void;
  onCreateWordNote: () => void;
  onFocusNextDueWord: () => void;
  onUpdateVocabularyField: (
    field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence",
    value: string,
  ) => void;
  onReviewSelectedWord: (outcome: VocabularyReviewOutcome) => void;
  groupLabelInput: string;
  onGroupLabelInputChange: (value: string) => void;
  selectedZone?: Zone;
  selectedGroup?: ZoneGroup;
  selectedZoneId?: string;
  zoneGroups: ZoneGroup[];
  onCreateGroupFromSelectedZone: () => void;
  onAssignZoneToGroup: (zoneId: string, groupId?: string) => void;
  onSelectGroup: (groupId?: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onCollapseAllGroups: () => void;
  onExpandAllGroups: () => void;
  onDeleteGroup: (groupId: string) => void;
  onClearNoteSelection: () => void;
  showAutoTagGroups: boolean;
  onToggleAutoTagGroups: () => void;
  autoTagGroups: AutoTagGroup[];
  onFocusBounds: (bounds: { x: number; y: number; w: number; h: number }) => void;
  smartMergeSuggestions: Array<SmartMergeSuggestion & { keepNoteText: string; mergeNoteText: string }>;
  onPreviewSmartMerge: (suggestion: SmartMergeSuggestion) => void;
  onMergeSmartSuggestion: (suggestion: SmartMergeSuggestion) => void;
};

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

export const WallDetailsContent = ({
  controlsMode,
  templateType,
  templateOptions,
  isTimeLocked,
  onTemplateTypeChange,
  onApplyTemplate,
  tagInput,
  onTagInputChange,
  onAddTag,
  selectedNote,
  selectedNotePageReference,
  selectedNotePageConversion,
  hasJokerNote,
  hasThroneNote,
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
  onReferenceSelectedNoteInPage,
  onOpenSelectedNotePageReference,
  onUndoSelectedNotePageReference,
  onConvertSelectedNoteToPage,
  onOpenSelectedNoteConvertedPage,
  onUndoSelectedNotePageConversion,
  onTogglePinSelectedNote,
  onToggleHighlightSelectedNote,
  onToggleFocusSelectedNote,
  onToggleOrRefreshJokerSelectedNote,
  onToggleOrRefreshThroneSelectedNote,
  onRefreshPoetrySelectedNote,
  onStartLinkFromSelectedNote,
  onUpdateSelectedNote,
  onSubmitBookmarkUrl,
  onOpenBookmarkUrl,
  onSelectImageNoteFile,
  onSubmitImageNoteUrl,
  onRenameImageNote,
  onOpenImageNote,
  onDownloadImageNote,
  onSelectFileNoteFile,
  onSubmitFileNoteUrl,
  onOpenFileNote,
  onDownloadFileNote,
  onSelectAudioNoteFile,
  onSubmitAudioNoteUrl,
  onOpenAudioNote,
  onDownloadAudioNote,
  onSelectVideoNoteFile,
  onSubmitVideoNoteUrl,
  onRenameVideoNote,
  onOpenVideoNote,
  onDownloadVideoNote,
  privateNoteSupported,
  isPrivateEnabled,
  isPrivateUnlocked,
  onProtectPrivateNote,
  onUnlockPrivateNote,
  onLockPrivateNote,
  onRemovePrivateProtection,
  detailsSectionsOpen,
  onToggleDetailsSection,
  timelineEntriesCount,
  visibleNotesCount,
  historyUndoDepth,
  historyRedoDepth,
  notes,
  onJumpStale,
  onJumpPriority,
  onClearHistory,
  recallQuery,
  onRecallQueryChange,
  recallZoneId,
  onRecallZoneIdChange,
  recallTag,
  onRecallTagChange,
  recallDateFilter,
  onRecallDateFilterChange,
  visibleZones,
  availableRecallTags,
  onSaveRecallSearch,
  onClearRecallFilters,
  savedRecallSearches,
  onApplySavedRecallSearch,
  onDeleteSavedRecallSearch,
  isSelectedNoteVocabulary,
  vocabularyDueCount,
  vocabularyFocusCount,
  reviewedTodayCount,
  reviewRevealMeaning,
  onToggleRevealMeaning,
  onToggleFlipCard,
  onCreateWordNote,
  onFocusNextDueWord,
  onUpdateVocabularyField,
  onReviewSelectedWord,
  groupLabelInput,
  onGroupLabelInputChange,
  selectedZone,
  selectedGroup,
  selectedZoneId,
  zoneGroups,
  onCreateGroupFromSelectedZone,
  onAssignZoneToGroup,
  onSelectGroup,
  onToggleGroupCollapse,
  onCollapseAllGroups,
  onExpandAllGroups,
  onDeleteGroup,
  onClearNoteSelection,
  showAutoTagGroups,
  onToggleAutoTagGroups,
  autoTagGroups,
  onFocusBounds,
  smartMergeSuggestions,
  onPreviewSmartMerge,
  onMergeSmartSuggestion,
}: WallDetailsContentProps) => {
  const advancedMode = controlsMode === "advanced";
  const activeRecallFilters = [recallQuery.trim(), recallZoneId, recallTag, recallDateFilter !== "all" ? recallDateFilter : ""]
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
          <SummaryMetric label="Visible" value={`${visibleNotesCount}`} hint="Notes in current view" />
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
          <NoteInspectorSection key={selectedNote.id}
            selectedNote={selectedNote}
            hasJokerNote={hasJokerNote}
            hasThroneNote={hasThroneNote}
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
            pageReference={selectedNotePageReference}
            pageConversion={selectedNotePageConversion}
            onReferenceInPage={onReferenceSelectedNoteInPage}
            onOpenPageReference={onOpenSelectedNotePageReference}
            onUndoPageReference={onUndoSelectedNotePageReference}
            onConvertToPage={onConvertSelectedNoteToPage}
            onOpenConvertedPage={onOpenSelectedNoteConvertedPage}
            onUndoPageConversion={onUndoSelectedNotePageConversion}
            onTogglePin={onTogglePinSelectedNote}
            onToggleHighlight={onToggleHighlightSelectedNote}
            onToggleFocus={onToggleFocusSelectedNote}
            onToggleOrRefreshJoker={onToggleOrRefreshJokerSelectedNote}
            onToggleOrRefreshThrone={onToggleOrRefreshThroneSelectedNote}
            onRefreshPoetry={onRefreshPoetrySelectedNote}
            onStartLink={onStartLinkFromSelectedNote}
            onUpdateNote={onUpdateSelectedNote}
            onSubmitBookmarkUrl={onSubmitBookmarkUrl}
            onOpenBookmarkUrl={onOpenBookmarkUrl}
            onSelectImageNoteFile={onSelectImageNoteFile}
            onSubmitImageNoteUrl={onSubmitImageNoteUrl}
            onRenameImageNote={onRenameImageNote}
            onOpenImageNote={onOpenImageNote}
            onDownloadImageNote={onDownloadImageNote}
            onSelectFileNoteFile={onSelectFileNoteFile}
            onSubmitFileNoteUrl={onSubmitFileNoteUrl}
            onOpenFileNote={onOpenFileNote}
            onDownloadFileNote={onDownloadFileNote}
            onSelectAudioNoteFile={onSelectAudioNoteFile}
            onSubmitAudioNoteUrl={onSubmitAudioNoteUrl}
            onOpenAudioNote={onOpenAudioNote}
            onDownloadAudioNote={onDownloadAudioNote}
            onSelectVideoNoteFile={onSelectVideoNoteFile}
            onSubmitVideoNoteUrl={onSubmitVideoNoteUrl}
            onRenameVideoNote={onRenameVideoNote}
            onOpenVideoNote={onOpenVideoNote}
            onDownloadVideoNote={onDownloadVideoNote}
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
          templateOptions={templateOptions}
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
        <RecallSection
          detailsSectionsOpen={detailsSectionsOpen}
          onToggleDetailsSection={onToggleDetailsSection}
          recallQuery={recallQuery}
          onRecallQueryChange={onRecallQueryChange}
          recallZoneId={recallZoneId}
          onRecallZoneIdChange={onRecallZoneIdChange}
          recallTag={recallTag}
          onRecallTagChange={onRecallTagChange}
          recallDateFilter={recallDateFilter}
          onRecallDateFilterChange={onRecallDateFilterChange}
          visibleZones={visibleZones}
          availableRecallTags={availableRecallTags}
          onSaveRecallSearch={onSaveRecallSearch}
          onClearRecallFilters={onClearRecallFilters}
          savedRecallSearches={savedRecallSearches}
          onApplySavedRecallSearch={onApplySavedRecallSearch}
          onDeleteSavedRecallSearch={onDeleteSavedRecallSearch}
        />
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Review"
          title="Word review"
          description="Track due vocabulary, review context, and move through the spaced-repetition flow without clutter."
        />
        <VocabularySection
          detailsSectionsOpen={detailsSectionsOpen}
          onToggleDetailsSection={onToggleDetailsSection}
          isTimeLocked={isTimeLocked}
          selectedNote={selectedNote}
          isSelectedNoteVocabulary={isSelectedNoteVocabulary}
          vocabularyDueCount={vocabularyDueCount}
          vocabularyFocusCount={vocabularyFocusCount}
          reviewedTodayCount={reviewedTodayCount}
          reviewRevealMeaning={reviewRevealMeaning}
          onToggleRevealMeaning={onToggleRevealMeaning}
          onToggleFlipCard={onToggleFlipCard}
          onCreateWordNote={onCreateWordNote}
          onFocusNextDueWord={onFocusNextDueWord}
          onUpdateVocabularyField={onUpdateVocabularyField}
          onReviewSelectedWord={onReviewSelectedWord}
        />
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Structure"
          title="Zones and tag signals"
          description="Manage primary wall structure with groups and use auto tag signals as lightweight navigation aids."
        />
        <ZoneGroupsSection
          detailsSectionsOpen={detailsSectionsOpen}
          onToggleDetailsSection={onToggleDetailsSection}
          groupLabelInput={groupLabelInput}
          onGroupLabelInputChange={onGroupLabelInputChange}
          selectedZone={selectedZone}
          selectedGroup={selectedGroup}
          selectedZoneId={selectedZoneId}
          zoneGroups={zoneGroups}
          isTimeLocked={isTimeLocked}
          onCreateGroupFromSelectedZone={onCreateGroupFromSelectedZone}
          onAssignZoneToGroup={onAssignZoneToGroup}
          onSelectGroup={onSelectGroup}
          onToggleGroupCollapse={onToggleGroupCollapse}
          onCollapseAllGroups={onCollapseAllGroups}
          onExpandAllGroups={onExpandAllGroups}
          onDeleteGroup={onDeleteGroup}
          onClearNoteSelection={onClearNoteSelection}
        />
        {advancedMode && (
          <TagGroupsSection
            detailsSectionsOpen={detailsSectionsOpen}
            onToggleDetailsSection={onToggleDetailsSection}
            showAutoTagGroups={showAutoTagGroups}
            onToggleAutoTagGroups={onToggleAutoTagGroups}
            autoTagGroups={autoTagGroups}
            onFocusBounds={onFocusBounds}
          />
        )}
      </div>

      <div className={detailSectionStack}>
        <GroupHeader
          eyebrow="Maintenance"
          title="Merge and history"
          description="Resolve duplicates confidently and keep operational controls tucked together at the bottom of the panel."
        />
        <SmartMergeSection
          detailsSectionsOpen={detailsSectionsOpen}
          onToggleDetailsSection={onToggleDetailsSection}
          isTimeLocked={isTimeLocked}
          suggestions={smartMergeSuggestions}
          onPreview={onPreviewSmartMerge}
          onMerge={onMergeSmartSuggestion}
        />
        {advancedMode && (
          <HistorySection
            detailsSectionsOpen={detailsSectionsOpen}
            onToggleDetailsSection={onToggleDetailsSection}
            timelineEntriesCount={timelineEntriesCount}
            visibleNotesCount={visibleNotesCount}
            historyUndoDepth={historyUndoDepth}
            historyRedoDepth={historyRedoDepth}
            notes={notes}
            onJumpStale={onJumpStale}
            onJumpPriority={onJumpPriority}
            onClearHistory={onClearHistory}
          />
        )}
      </div>
    </div>
  );
};
