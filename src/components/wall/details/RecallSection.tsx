"use client";

import {
  detailButton,
  detailField,
  detailInsetCard,
  detailMutedPanel,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionToggle,
} from "@/components/wall/details/detailSectionStyles";
import type { RecallSectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const RecallSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
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
}: RecallSectionProps) => {
  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("recall")}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={detailSectionHeading}>Recall</h3>
          <p className={detailSectionDescription}>Search by text, structure, and time. Save repeatable filter sets for fast retrieval.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.recall ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.recall && (
        <>
          <input
            value={recallQuery}
            onChange={(event) => onRecallQueryChange(event.target.value)}
            placeholder="Find text, phrase, or #tag"
            className={`mt-3 ${detailField}`}
          />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={recallZoneId}
              onChange={(event) => onRecallZoneIdChange(event.target.value)}
              className={detailField}
            >
              <option value="">All zones</option>
              {visibleZones.map((zone) => (
                <option key={`filter-zone-${zone.id}`} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>
            <select
              value={recallTag}
              onChange={(event) => onRecallTagChange(event.target.value)}
              className={detailField}
            >
              <option value="">All tags</option>
              {availableRecallTags.map((tag) => (
                <option key={`filter-tag-${tag}`} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
            <select
              value={recallDateFilter}
              onChange={(event) => onRecallDateFilterChange(event.target.value as typeof recallDateFilter)}
              className={`sm:col-span-2 ${detailField}`}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onSaveRecallSearch} className={detailButton}>
              Save Search
            </button>
            <button type="button" onClick={onClearRecallFilters} className={detailButton}>
              Clear Filters
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Saved Searches</p>
              <span className="text-[10px] text-[var(--color-text-muted)]">{savedRecallSearches.length}</span>
            </div>
            {savedRecallSearches.length > 0 ? (
              <div className="max-h-32 space-y-2 overflow-auto pr-1">
                {savedRecallSearches.map((item) => (
                  <div key={item.id} className={`${detailInsetCard} flex items-center gap-2`}>
                    <button
                      type="button"
                      onClick={() => onApplySavedRecallSearch(item)}
                      className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-[var(--color-text)]"
                    >
                      {item.name}
                    </button>
                    <button type="button" onClick={() => onDeleteSavedRecallSearch(item.id)} className="text-[10px] text-[var(--color-danger)]">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={detailMutedPanel}>No saved searches yet. Save your current filter stack to make recurring recall workflows instant.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
