"use client";

import type { NoteGroupsSectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const NoteGroupsSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  noteGroupLabelInput,
  onNoteGroupLabelInputChange,
  selectedNoteGroup,
  activeSelectedNoteIds,
  noteGroups,
  isTimeLocked,
  onCreateGroupFromSelection,
  onSelectNoteGroup,
  onToggleNoteGroupCollapse,
  onCollapseAllNoteGroups,
  onExpandAllNoteGroups,
  onDeleteNoteGroup,
  onAddSelectionToNoteGroup,
  onRemoveSelectionFromNoteGroup,
  onSelectNotesForGroup,
}: NoteGroupsSectionProps) => {
  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={() => onToggleDetailsSection("noteGroups")}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-zinc-900">Note Groups</h3>
        <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.noteGroups ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.noteGroups && (
        <>
          <p className="mt-1 text-xs text-zinc-600">Create persistent groups from any selected notes.</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onCollapseAllNoteGroups}
              disabled={isTimeLocked || noteGroups.length === 0}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 disabled:opacity-45"
            >
              Collapse All
            </button>
            <button
              type="button"
              onClick={onExpandAllNoteGroups}
              disabled={isTimeLocked || noteGroups.length === 0}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 disabled:opacity-45"
            >
              Expand All
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              value={noteGroupLabelInput}
              onChange={(event) => onNoteGroupLabelInputChange(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              placeholder="Group name"
            />
            <button
              type="button"
              onClick={onCreateGroupFromSelection}
              disabled={activeSelectedNoteIds.length === 0 || isTimeLocked}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs disabled:opacity-45"
            >
              Group Selected
            </button>
          </div>

          <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
            {noteGroups.length === 0 && <p className="text-xs text-zinc-500">No note groups yet.</p>}
            {noteGroups.map((group) => {
              const selectedCount = activeSelectedNoteIds.filter((id) => group.noteIds.includes(id)).length;
              return (
                <div
                  key={group.id}
                  className={`rounded-lg border px-2 py-2 ${selectedNoteGroup?.id === group.id ? "border-zinc-700 bg-zinc-50" : "border-zinc-200 bg-white"}`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isTimeLocked) {
                          return;
                        }
                        onSelectNoteGroup(group.id);
                        onToggleNoteGroupCollapse(group.id);
                      }}
                      disabled={isTimeLocked}
                      className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-[10px]"
                    >
                      {group.collapsed ? "Expand" : "Collapse"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectNotesForGroup(group.id)}
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
                        onDeleteNoteGroup(group.id);
                      }}
                      disabled={isTimeLocked}
                      className="text-[10px] text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {group.noteIds.length} notes {group.collapsed ? "(collapsed)" : "(expanded)"}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAddSelectionToNoteGroup(group.id)}
                      disabled={isTimeLocked || activeSelectedNoteIds.length === 0}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-700 disabled:opacity-45"
                    >
                      Add selection
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSelectionFromNoteGroup(group.id)}
                      disabled={isTimeLocked || selectedCount === 0}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-700 disabled:opacity-45"
                    >
                      Remove selection
                    </button>
                    {selectedCount > 0 && <span className="text-[10px] text-zinc-500">{selectedCount} selected in group</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
