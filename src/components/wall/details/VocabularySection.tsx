"use client";

import {
  detailButton,
  detailDangerButton,
  detailField,
  detailSectionCard,
  detailSectionDescription,
  detailSectionHeading,
  detailSectionToggle,
  detailStatCard,
} from "@/components/wall/details/detailSectionStyles";
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
    <div className={detailSectionCard}>
      <button type="button" onClick={() => onToggleDetailsSection("vocabulary")} className="flex w-full items-center justify-between text-left">
        <h3 className={detailSectionHeading}>Word Review</h3>
        <span className={detailSectionToggle}>{detailsSectionsOpen.vocabulary ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.vocabulary && (
        <>
          <p className={detailSectionDescription}>Capture unknown words and review them with spaced repetition.</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Due" value={vocabularyDueCount} />
            <Stat label="Focus" value={vocabularyFocusCount} />
            <Stat label="Today" value={reviewedTodayCount} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onCreateWordNote} disabled={isTimeLocked} className={detailButton}>
              New Word
            </button>
            <button type="button" onClick={onFocusNextDueWord} disabled={vocabularyDueCount === 0} className={detailButton}>
              Review Next Due
            </button>
            <button type="button" onClick={onToggleRevealMeaning} disabled={!isSelectedNoteVocabulary} className={detailButton}>
              {reviewRevealMeaning ? "Hide Meaning" : "Reveal Meaning"}
            </button>
            <button type="button" onClick={onToggleFlipCard} disabled={!isSelectedNoteVocabulary || isTimeLocked} className={detailButton}>
              Flip Card
            </button>
          </div>
          {!isSelectedNoteVocabulary && <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">Select a word note to edit and review it.</p>}
          {isSelectedNoteVocabulary && vocabulary && (
            <>
              <label className="mt-2 block text-[11px] font-medium text-[var(--color-text)]">Word</label>
              <input
                value={vocabulary.word}
                onChange={(event) => onUpdateVocabularyField("word", event.target.value)}
                placeholder="e.g. cogent"
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-2 block text-[11px] font-medium text-[var(--color-text)]">Book context</label>
              <textarea
                value={vocabulary.sourceContext}
                onChange={(event) => onUpdateVocabularyField("sourceContext", event.target.value)}
                placeholder="Paste the sentence where you found it..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-2 block text-[11px] font-medium text-[var(--color-text)]">Your guess</label>
              <textarea
                value={vocabulary.guessMeaning}
                onChange={(event) => onUpdateVocabularyField("guessMeaning", event.target.value)}
                placeholder="What do you think it means?"
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-2 block text-[11px] font-medium text-[var(--color-text)]">Meaning</label>
              <textarea
                value={vocabulary.meaning}
                onChange={(event) => onUpdateVocabularyField("meaning", event.target.value)}
                placeholder="Dictionary meaning..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              {reviewRevealMeaning && vocabulary.meaning.trim() && (
                <p className="mt-1 rounded border border-emerald-500/35 bg-emerald-500/12 px-2 py-1 text-[11px] text-emerald-200">
                  {vocabulary.meaning}
                </p>
              )}
              <label className="mt-2 block text-[11px] font-medium text-[var(--color-text)]">Your sentence</label>
              <textarea
                value={vocabulary.ownSentence}
                onChange={(event) => onUpdateVocabularyField("ownSentence", event.target.value)}
                placeholder="Write your own sentence using this word..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <GradeButton label="Again" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("again")} />
                <GradeButton label="Hard" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("hard")} />
                <GradeButton label="Good" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("good")} />
                <GradeButton label="Easy" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("easy")} />
              </div>
              {contextLocked && <p className="mt-1 text-[11px] text-amber-300">Add your own sentence before Good/Easy.</p>}
            </>
          )}
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className={detailStatCard}>
    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
    <p className="text-sm font-semibold text-[var(--color-text)]">{value}</p>
  </div>
);

const GradeButton = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={label === "Again" ? detailDangerButton : detailButton}>
    {label}
  </button>
);
