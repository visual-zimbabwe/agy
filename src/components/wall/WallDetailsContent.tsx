"use client";

import type { Note, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";
import { HistorySection } from "@/components/wall/details/HistorySection";
import { RecallSection } from "@/components/wall/details/RecallSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { SmartMergeSection } from "@/components/wall/details/SmartMergeSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { VocabularySection } from "@/components/wall/details/VocabularySection";
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
  selectedNoteId?: string;
  selectedNoteIdsCount: number;
  displayedTags: string[];
  onRemoveTag: (tag: string) => void;
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
  selectedNoteId,
  selectedNoteIdsCount,
  displayedTags,
  onRemoveTag,
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

  return (
    <>
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
      <VocabularySection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        isTimeLocked={isTimeLocked}
        selectedNote={selectedNoteId ? notes.find((note) => note.id === selectedNoteId) : undefined}
        isSelectedNoteVocabulary={isSelectedNoteVocabulary}
        vocabularyDueCount={vocabularyDueCount}
        vocabularyFocusCount={vocabularyFocusCount}
        reviewedTodayCount={reviewedTodayCount}
        reviewRevealMeaning={reviewRevealMeaning}
        onToggleRevealMeaning={onToggleRevealMeaning}
        onCreateWordNote={onCreateWordNote}
        onFocusNextDueWord={onFocusNextDueWord}
        onUpdateVocabularyField={onUpdateVocabularyField}
        onReviewSelectedWord={onReviewSelectedWord}
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
      <SmartMergeSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        isTimeLocked={isTimeLocked}
        suggestions={smartMergeSuggestions}
        onPreview={onPreviewSmartMerge}
        onMerge={onMergeSmartSuggestion}
      />
    </>
  );
};
