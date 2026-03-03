"use client";

import { WallDetailsPanel } from "@/components/wall/WallDetailsPanel";
import { WallDetailsContent } from "@/components/wall/WallDetailsContent";
import type { DetailsSectionKey, DetailsSectionState, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { TEMPLATE_TYPES } from "@/features/wall/constants";
import type { Bounds, Note, TemplateType, VocabularyReviewOutcome, Zone, ZoneGroup } from "@/features/wall/types";
import type { SmartMergeSuggestion } from "@/lib/smart-merge";

type WallDetailsSidebarProps = {
  presentationMode: boolean;
  showDetailsPanel: boolean;
  rightPanelOpen: boolean;
  onClose: () => void;
  templateType: TemplateType;
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
  autoTagGroups: Array<{ tag: string; noteIds: string[]; bounds: Bounds }>;
  onFocusBounds: (bounds: Bounds) => void;
  smartMergeSuggestions: Array<SmartMergeSuggestion & { keepNoteText: string; mergeNoteText: string }>;
  onPreviewSmartMerge: (suggestion: SmartMergeSuggestion) => void;
  onMergeSmartSuggestion: (suggestion: SmartMergeSuggestion) => void;
  controlsMode: "basic" | "advanced";
};

export const WallDetailsSidebar = ({
  presentationMode,
  showDetailsPanel,
  rightPanelOpen,
  onClose,
  templateType,
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
  controlsMode,
}: WallDetailsSidebarProps) => {
  if (presentationMode || !showDetailsPanel) {
    return null;
  }

  return (
    <WallDetailsPanel
      rightPanelOpen={rightPanelOpen}
      onClose={onClose}
    >
      <WallDetailsContent
        controlsMode={controlsMode}
        templateType={templateType}
        templateOptions={TEMPLATE_TYPES}
        isTimeLocked={isTimeLocked}
        onTemplateTypeChange={onTemplateTypeChange}
        onApplyTemplate={onApplyTemplate}
        tagInput={tagInput}
        onTagInputChange={onTagInputChange}
        onAddTag={onAddTag}
        selectedNoteId={selectedNoteId}
        selectedNoteIdsCount={selectedNoteIdsCount}
        displayedTags={displayedTags}
        onRemoveTag={onRemoveTag}
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
        groupLabelInput={groupLabelInput}
        onGroupLabelInputChange={onGroupLabelInputChange}
        selectedZone={selectedZone}
        selectedGroup={selectedGroup}
        selectedZoneId={selectedZoneId}
        zoneGroups={zoneGroups}
        onCreateGroupFromSelectedZone={onCreateGroupFromSelectedZone}
        onAssignZoneToGroup={onAssignZoneToGroup}
        onSelectGroup={onSelectGroup}
        onToggleGroupCollapse={onToggleGroupCollapse}
        onCollapseAllGroups={onCollapseAllGroups}
        onExpandAllGroups={onExpandAllGroups}
        onDeleteGroup={onDeleteGroup}
        onClearNoteSelection={onClearNoteSelection}
        showAutoTagGroups={showAutoTagGroups}
        onToggleAutoTagGroups={onToggleAutoTagGroups}
        autoTagGroups={autoTagGroups}
        onFocusBounds={onFocusBounds}
        smartMergeSuggestions={smartMergeSuggestions}
        onPreviewSmartMerge={onPreviewSmartMerge}
        onMergeSmartSuggestion={onMergeSmartSuggestion}
      />
    </WallDetailsPanel>
  );
};
