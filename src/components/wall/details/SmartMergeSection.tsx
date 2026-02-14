"use client";

import type { SmartMergeSectionProps } from "@/components/wall/details/DetailsSectionTypes";

const previewText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "(empty note)";
  }
  return trimmed.length > 70 ? `${trimmed.slice(0, 67)}...` : trimmed;
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
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={() => onToggleDetailsSection("smartMerge")}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-zinc-900">Smart Merge</h3>
        <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.smartMerge ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.smartMerge && (
        <>
          <p className="mt-1 text-xs text-zinc-600">Detect likely duplicate or overlapping notes and merge them intentionally.</p>
          {suggestions.length === 0 && <p className="mt-2 text-xs text-zinc-500">No merge suggestions for current visible notes.</p>}
          <div className="mt-2 max-h-64 space-y-1 overflow-auto pr-1">
            {suggestions.slice(0, 10).map((suggestion) => (
              <div key={`${suggestion.keepNoteId}:${suggestion.mergeNoteId}`} className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{suggestion.reason}</span>
                  <span className="text-[10px] text-zinc-500">{Math.round(suggestion.score * 100)}% match</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-800">Keep: {previewText(suggestion.keepNoteText)}</p>
                <p className="mt-1 text-[11px] text-zinc-600">Merge: {previewText(suggestion.mergeNoteText)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview(suggestion)}
                    className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px]"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onMerge(suggestion)}
                    disabled={isTimeLocked}
                    className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px] disabled:opacity-45"
                  >
                    Merge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
