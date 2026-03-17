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
import type { SmartMergeSectionProps } from "@/components/wall/details/DetailsSectionTypes";

const previewText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "(empty note)";
  }
  return trimmed.length > 88 ? `${trimmed.slice(0, 85)}...` : trimmed;
};

export const SmartMergeSection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  isTimeLocked,
  suggestions,
  onPreview,
  onMerge,
}: SmartMergeSectionProps) => {
  return (
    <div className={detailSectionCard}>
      <button
        type="button"
        onClick={() => onToggleDetailsSection("smartMerge")}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className={detailSectionHeading}>Smart Merge</h3>
          <p className={detailSectionDescription}>Review likely duplicates or overlaps with enough context to merge confidently.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.smartMerge ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.smartMerge && (
        <>
          {suggestions.length === 0 ? (
            <div className={`${detailMutedPanel} mt-3`}>No merge suggestions for the currently visible notes.</div>
          ) : (
            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {suggestions.slice(0, 10).map((suggestion) => (
                <div key={`${suggestion.keepNoteId}:${suggestion.mergeNoteId}`} className={detailInsetCard}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{suggestion.reason}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{Math.round(suggestion.score * 100)}% match</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[11px] leading-5">
                    <p className="text-[var(--color-text)]"><span className="font-semibold text-[var(--color-text-muted)]">Keep:</span> {previewText(suggestion.keepNoteText)}</p>
                    <p className="text-[var(--color-text-muted)]"><span className="font-semibold">Merge:</span> {previewText(suggestion.mergeNoteText)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPreview(suggestion)}
                      className={detailButton}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onMerge(suggestion)}
                      disabled={isTimeLocked}
                      className={detailButton}
                    >
                      Merge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
