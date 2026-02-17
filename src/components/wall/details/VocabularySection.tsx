"use client";

import type { VocabularySectionProps } from "@/components/wall/details/DetailsSectionTypes";

export const VocabularySection = ({
  detailsSectionsOpen,
  onToggleDetailsSection,
  isTimeLocked,
  selectedNote,
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
}: VocabularySectionProps) => {
  const vocabulary = selectedNote?.vocabulary;
  const contextLocked = isSelectedNoteVocabulary && !vocabulary?.ownSentence.trim();

  return (
    <div className="mt-3 min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <button type="button" onClick={() => onToggleDetailsSection("vocabulary")} className="flex w-full items-center justify-between text-left">
        <h3 className="text-sm font-semibold text-zinc-900">Word Review</h3>
        <span className="text-[10px] text-zinc-500">{detailsSectionsOpen.vocabulary ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.vocabulary && (
        <>
          <p className="mt-1 text-xs text-zinc-600">Capture unknown words and review them with spaced repetition.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Due" value={vocabularyDueCount} />
            <Stat label="Focus" value={vocabularyFocusCount} />
            <Stat label="Today" value={reviewedTodayCount} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onCreateWordNote} disabled={isTimeLocked} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-45">
              New Word
            </button>
            <button type="button" onClick={onFocusNextDueWord} disabled={vocabularyDueCount === 0} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-45">
              Review Next Due
            </button>
            <button type="button" onClick={onToggleRevealMeaning} disabled={!isSelectedNoteVocabulary} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-45">
              {reviewRevealMeaning ? "Hide Meaning" : "Reveal Meaning"}
            </button>
            <button type="button" onClick={onToggleFlipCard} disabled={!isSelectedNoteVocabulary || isTimeLocked} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-45">
              Flip Card
            </button>
          </div>
          {!isSelectedNoteVocabulary && <p className="mt-2 text-[11px] text-zinc-500">Select a word note to edit and review it.</p>}
          {isSelectedNoteVocabulary && vocabulary && (
            <>
              <label className="mt-2 block text-[11px] font-medium text-zinc-700">Word</label>
              <input
                value={vocabulary.word}
                onChange={(event) => onUpdateVocabularyField("word", event.target.value)}
                placeholder="e.g. cogent"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              />
              <label className="mt-2 block text-[11px] font-medium text-zinc-700">Book context</label>
              <textarea
                value={vocabulary.sourceContext}
                onChange={(event) => onUpdateVocabularyField("sourceContext", event.target.value)}
                placeholder="Paste the sentence where you found it..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              />
              <label className="mt-2 block text-[11px] font-medium text-zinc-700">Your guess</label>
              <textarea
                value={vocabulary.guessMeaning}
                onChange={(event) => onUpdateVocabularyField("guessMeaning", event.target.value)}
                placeholder="What do you think it means?"
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              />
              <label className="mt-2 block text-[11px] font-medium text-zinc-700">Meaning</label>
              <textarea
                value={vocabulary.meaning}
                onChange={(event) => onUpdateVocabularyField("meaning", event.target.value)}
                placeholder="Dictionary meaning..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              />
              {reviewRevealMeaning && vocabulary.meaning.trim() && (
                <p className="mt-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">
                  {vocabulary.meaning}
                </p>
              )}
              <label className="mt-2 block text-[11px] font-medium text-zinc-700">Your sentence</label>
              <textarea
                value={vocabulary.ownSentence}
                onChange={(event) => onUpdateVocabularyField("ownSentence", event.target.value)}
                placeholder="Write your own sentence using this word..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <GradeButton label="Again" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("again")} />
                <GradeButton label="Hard" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("hard")} />
                <GradeButton label="Good" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("good")} />
                <GradeButton label="Easy" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("easy")} />
              </div>
              {contextLocked && <p className="mt-1 text-[11px] text-amber-700">Add your own sentence before Good/Easy.</p>}
            </>
          )}
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded border border-zinc-200 bg-white px-2 py-1 text-center">
    <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
    <p className="text-sm font-semibold text-zinc-900">{value}</p>
  </div>
);

const GradeButton = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] disabled:opacity-45">
    {label}
  </button>
);
