"use client";

import {
  detailButton,
  detailInsetCard,
  detailMutedPanel,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionToggle,
} from "@/components/wall/details/detailSectionStyles";
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
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("tagGroups")}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={detailSectionHeading}>Tag Signals</h3>
          <p className={detailSectionDescription}>Secondary patterns inferred from shared tags. Useful for discovery without changing structure.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.tagGroups ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.tagGroups && (
        <>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] leading-5 text-[var(--color-text-muted)]">Highlight auto tag clusters on the canvas when you want signal without extra chrome.</span>
            <button type="button" onClick={onToggleAutoTagGroups} className={detailButton}>
              {showAutoTagGroups ? "Hide" : "Show"}
            </button>
          </div>
          <div className="mt-3 max-h-52 space-y-2 overflow-auto pr-1">
            {autoTagGroups.length === 0 ? (
              <div className={detailMutedPanel}>No auto groups yet. Add the same tag to at least two notes and a signal will appear here.</div>
            ) : (
              autoTagGroups.slice(0, 8).map((group) => (
                <button
                  key={`panel-tag-${group.tag}`}
                  type="button"
                  onClick={() => onFocusBounds(group.bounds)}
                  className={`${detailInsetCard} flex w-full items-center justify-between gap-3 text-left transition-colors hover:border-[var(--color-focus)] hover:bg-[color:rgb(2_132_199_/_0.06)]`}
                >
                  <span className="truncate text-xs font-semibold text-[var(--color-text)]">#{group.tag}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{group.noteIds.length} notes</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
