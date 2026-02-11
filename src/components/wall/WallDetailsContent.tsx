"use client";

import type { Note, TemplateType, Zone, ZoneGroup } from "@/features/wall/types";

export type RecallDateFilter = "all" | "today" | "7d" | "30d";

export type SavedRecallSearch = {
  id: string;
  name: string;
  query: string;
  zoneId?: string;
  tag?: string;
  dateFilter: RecallDateFilter;
};

export type DetailsSectionKey = "history" | "recall" | "zoneGroups" | "tagGroups";
export type DetailsSectionState = Record<DetailsSectionKey, boolean>;

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type AutoTagGroup = {
  tag: string;
  noteIds: string[];
  bounds: { x: number; y: number; w: number; h: number };
};

type WallDetailsContentProps = {
  templateType: TemplateType;
  templateOptions: TemplateOption[];
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
      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Templates</p>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={templateType}
            onChange={(event) => onTemplateTypeChange(event.target.value as TemplateType)}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs"
          >
            {templateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={onApplyTemplate} disabled={isTimeLocked} className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-45">
            Apply
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Selection Tags</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddTag();
              }
            }}
            placeholder={selectedNoteIdsCount > 0 || selectedNoteId ? "add-tag" : "select note first"}
            disabled={selectedNoteIdsCount === 0 && !selectedNoteId ? true : isTimeLocked}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
          />
          <button
            type="button"
            onClick={onAddTag}
            disabled={selectedNoteIdsCount === 0 && !selectedNoteId ? true : isTimeLocked}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"
          >
            Add
          </button>
        </div>
        <div className="mt-2 max-h-28 overflow-auto pr-1">
          <div className="flex flex-wrap gap-1">
            {displayedTags.length === 0 && <span className="text-[11px] text-zinc-500">No tags on current selection.</span>}
            {displayedTags.map((tag) => (
              <button
                key={`detail-tag-${tag}`}
                type="button"
                onClick={() => onRemoveTag(tag)}
                disabled={isTimeLocked}
                className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
                title="Remove tag"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <button
          type="button"
          onClick={() => onToggleDetailsSection("history")}
          className="flex w-full items-center justify-between text-left"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">History</p>
          <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.history ? "Hide" : "Show"}</span>
        </button>
        {detailsSectionsOpen.history && (
          <>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-700">
              <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Timeline entries: {timelineEntriesCount}</div>
              <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Visible notes: {visibleNotesCount}</div>
              <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Undo depth: {historyUndoDepth}</div>
              <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">Redo depth: {historyRedoDepth}</div>
              <div className="col-span-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                Latest edit: {notes.length === 0 ? "n/a" : new Date(Math.max(...notes.map((note) => note.updatedAt))).toLocaleString()}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={onJumpStale} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                Jump Stale
              </button>
              <button type="button" onClick={onJumpPriority} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                Jump Priority
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                disabled={historyUndoDepth === 0 && historyRedoDepth === 0}
                className="rounded border border-rose-300 bg-white px-2 py-1 text-[11px] text-rose-700 disabled:opacity-50"
              >
                Clear History
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <button
          type="button"
          onClick={() => onToggleDetailsSection("recall")}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Recall</h3>
          <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.recall ? "Hide" : "Show"}</span>
        </button>
        {detailsSectionsOpen.recall && (
          <>
            <p className="mt-1 text-xs text-zinc-600">Filter notes by query, zone, tag, and recency. Save frequent searches.</p>
            <input
              value={recallQuery}
              onChange={(event) => onRecallQueryChange(event.target.value)}
              placeholder="Find text or #tag..."
              className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <select value={recallZoneId} onChange={(event) => onRecallZoneIdChange(event.target.value)} className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
                <option value="">All zones</option>
                {visibleZones.map((zone) => (
                  <option key={`filter-zone-${zone.id}`} value={zone.id}>
                    {zone.label}
                  </option>
                ))}
              </select>
              <select value={recallTag} onChange={(event) => onRecallTagChange(event.target.value)} className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
                <option value="">All tags</option>
                {availableRecallTags.map((tag) => (
                  <option key={`filter-tag-${tag}`} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
              <select
                value={recallDateFilter}
                onChange={(event) => onRecallDateFilterChange(event.target.value as RecallDateFilter)}
                className="col-span-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7d</option>
                <option value="30d">Last 30d</option>
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={onSaveRecallSearch} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                Save Search
              </button>
              <button type="button" onClick={onClearRecallFilters} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px]">
                Clear Filters
              </button>
            </div>
            {savedRecallSearches.length > 0 && (
              <div className="mt-2 max-h-24 space-y-1 overflow-auto pr-1">
                {savedRecallSearches.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1">
                    <button
                      type="button"
                      onClick={() => onApplySavedRecallSearch(item)}
                      className="min-w-0 flex-1 truncate text-left text-[11px] text-zinc-800"
                    >
                      {item.name}
                    </button>
                    <button type="button" onClick={() => onDeleteSavedRecallSearch(item.id)} className="text-[10px] text-red-700">
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <button
          type="button"
          onClick={() => onToggleDetailsSection("zoneGroups")}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Zone Groups</h3>
          <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.zoneGroups ? "Hide" : "Show"}</span>
        </button>
        {detailsSectionsOpen.zoneGroups && (
          <>
            <p className="mt-1 text-xs text-zinc-600">Collapse groups to hide grouped zones and their notes.</p>

            <div className="mt-2 flex items-center gap-2">
              <input
                value={groupLabelInput}
                onChange={(event) => onGroupLabelInputChange(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                placeholder="Group name"
              />
              <button
                type="button"
                onClick={onCreateGroupFromSelectedZone}
                disabled={!selectedZoneId || isTimeLocked}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs disabled:opacity-45"
              >
                Group Zone
              </button>
            </div>

            {selectedZone && (
              <div className="mt-2">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Selected Zone Group</label>
                <select
                  value={selectedZone.groupId ?? ""}
                  onChange={(event) => {
                    if (isTimeLocked) {
                      return;
                    }
                    onAssignZoneToGroup(selectedZone.id, event.target.value || undefined);
                  }}
                  disabled={isTimeLocked}
                  className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
                >
                  <option value="">No group</option>
                  {zoneGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
              {zoneGroups.length === 0 && <p className="text-xs text-zinc-500">No groups yet.</p>}
              {zoneGroups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-lg border px-2 py-2 ${selectedGroup?.id === group.id ? "border-zinc-700 bg-zinc-50" : "border-zinc-200 bg-white"}`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isTimeLocked) {
                          return;
                        }
                        onSelectGroup(group.id);
                        onToggleGroupCollapse(group.id);
                      }}
                      disabled={isTimeLocked}
                      className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[10px]"
                    >
                      {group.collapsed ? "Expand" : "Collapse"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClearNoteSelection();
                        onSelectGroup(group.id);
                      }}
                      className="min-w-0 flex-1 truncate text-left text-xs font-medium text-zinc-800"
                    >
                      {group.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isTimeLocked) {
                          return;
                        }
                        onDeleteGroup(group.id);
                      }}
                      disabled={isTimeLocked}
                      className="text-[10px] text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {group.zoneIds.length} zones {group.collapsed ? "(collapsed)" : "(expanded)"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
        <button
          type="button"
          onClick={() => onToggleDetailsSection("tagGroups")}
          className="flex w-full items-center justify-between text-left"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Tag Groups (Auto)</h4>
          <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.tagGroups ? "Hide" : "Show"}</span>
        </button>
        {detailsSectionsOpen.tagGroups && (
          <>
            <div className="mb-1 mt-2 flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">Auto-detected from shared tags.</span>
              <button type="button" onClick={onToggleAutoTagGroups} className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px]">
                {showAutoTagGroups ? "Hide" : "Show"}
              </button>
            </div>
            {autoTagGroups.length === 0 && <p className="text-xs text-zinc-500">No auto groups yet (need 2+ notes per tag).</p>}
            {autoTagGroups.slice(0, 8).map((group) => (
              <button
                key={`panel-tag-${group.tag}`}
                type="button"
                onClick={() => onFocusBounds(group.bounds)}
                className="mt-1 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-left text-xs hover:bg-zinc-50"
              >
                <span className="truncate text-zinc-800">#{group.tag}</span>
                <span className="text-zinc-500">{group.noteIds.length} notes</span>
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
};
