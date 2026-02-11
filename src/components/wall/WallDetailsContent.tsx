"use client";

import type { Note, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";
import { HistorySection } from "@/components/wall/details/HistorySection";
import { RecallSection } from "@/components/wall/details/RecallSection";
import { SelectionTagsSection } from "@/components/wall/details/SelectionTagsSection";
import { TagGroupsSection } from "@/components/wall/details/TagGroupsSection";
import { type AutoTagGroup, type DetailsSectionKey, type DetailsSectionState, type RecallDateFilter, type SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";
import { TemplatesSection } from "@/components/wall/details/TemplatesSection";
import { ZoneGroupsSection } from "@/components/wall/details/ZoneGroupsSection";

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type WallDetailsContentProps = {
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
  onDeleteGroup: (groupId: string) => void;
  onClearNoteSelection: () => void;
  showAutoTagGroups: boolean;
  onToggleAutoTagGroups: () => void;
  autoTagGroups: AutoTagGroup[];
  onFocusBounds: (bounds: { x: number; y: number; w: number; h: number }) => void;
};

export const WallDetailsContent = ({
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
  onDeleteGroup,
  onClearNoteSelection,
  showAutoTagGroups,
  onToggleAutoTagGroups,
  autoTagGroups,
  onFocusBounds,
}: WallDetailsContentProps) => {
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
        onDeleteGroup={onDeleteGroup}
        onClearNoteSelection={onClearNoteSelection}
      />
      <TagGroupsSection
        detailsSectionsOpen={detailsSectionsOpen}
        onToggleDetailsSection={onToggleDetailsSection}
        showAutoTagGroups={showAutoTagGroups}
        onToggleAutoTagGroups={onToggleAutoTagGroups}
        autoTagGroups={autoTagGroups}
        onFocusBounds={onFocusBounds}
      />
    </>
  );
};
