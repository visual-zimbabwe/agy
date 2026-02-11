"use client";

import type { TagGroupsSectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const TagGroupsSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  showAutoTagGroups,
  onToggleAutoTagGroups,
  autoTagGroups,
  onFocusBounds,
}: TagGroupsSectionProps) => {
  return (
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
  );
};
