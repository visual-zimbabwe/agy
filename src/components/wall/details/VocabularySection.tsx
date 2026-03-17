"use client";

import {
  detailButton,
  detailDangerButton,
  detailField,
  detailMutedPanel,
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
      <button type="button" onClick={() => onToggleDetailsSection("vocabulary")} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className={detailSectionHeading}>Word Review</h3>
          <p className={detailSectionDescription}>Capture unfamiliar words, review them intentionally, and keep spaced repetition in motion.</p>
        </div>
        <span className={detailSectionToggle}>{detailsSectionsOpen.vocabulary ? "Hide" : "Show"}</span>
      </button>
      {detailsSectionsOpen.vocabulary && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Due" value={vocabularyDueCount} />
            <Stat label="Focus" value={vocabularyFocusCount} />
            <Stat label="Today" value={reviewedTodayCount} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
          {!isSelectedNoteVocabulary && <div className="mt-3 rounded-[1rem] border border-dashed border-[var(--color-border-muted)] bg-[color:color-mix(in_srgb,var(--color-surface-muted)_88%,black_12%)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-muted)]">Select a word note to edit and review it here.</div>}
          {isSelectedNoteVocabulary && vocabulary && (
            <>
              <label className="mt-3 block text-[11px] font-medium text-[var(--color-text)]">Word</label>
              <input
                value={vocabulary.word}
                onChange={(event) => onUpdateVocabularyField("word", event.target.value)}
                placeholder="e.g. cogent"
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-3 block text-[11px] font-medium text-[var(--color-text)]">Book context</label>
              <textarea
                value={vocabulary.sourceContext}
                onChange={(event) => onUpdateVocabularyField("sourceContext", event.target.value)}
                placeholder="Paste the sentence where you found it..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-3 block text-[11px] font-medium text-[var(--color-text)]">Your guess</label>
              <textarea
                value={vocabulary.guessMeaning}
                onChange={(event) => onUpdateVocabularyField("guessMeaning", event.target.value)}
                placeholder="What do you think it means?"
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <label className="mt-3 block text-[11px] font-medium text-[var(--color-text)]">Meaning</label>
              <textarea
                value={vocabulary.meaning}
                onChange={(event) => onUpdateVocabularyField("meaning", event.target.value)}
                placeholder="Dictionary meaning..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              {reviewRevealMeaning && vocabulary.meaning.trim() && (
                <div className="mt-2 rounded-[1rem] border border-emerald-500/28 bg-emerald-500/10 px-3 py-2 text-[11px] leading-5 text-emerald-200">
                  {vocabulary.meaning}
                </div>
              )}
              <label className="mt-3 block text-[11px] font-medium text-[var(--color-text)]">Your sentence</label>
              <textarea
                value={vocabulary.ownSentence}
                onChange={(event) => onUpdateVocabularyField("ownSentence", event.target.value)}
                placeholder="Write your own sentence using this word..."
                rows={2}
                className={`mt-1 ${detailField}`}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <GradeButton label="Again" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("again")} />
                <GradeButton label="Hard" disabled={isTimeLocked} onClick={() => onReviewSelectedWord("hard")} />
                <GradeButton label="Good" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("good")} />
                <GradeButton label="Easy" disabled={isTimeLocked || contextLocked} onClick={() => onReviewSelectedWord("easy")} />
              </div>
              {contextLocked && <div className={`${detailMutedPanel} mt-2 border-amber-500/20 bg-amber-500/8 text-amber-200`}>Add your own sentence before marking the word Good or Easy.</div>}
            </>
          )}
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className={detailStatCard}>
    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1 text-base font-semibold text-[var(--color-text)]">{value}</p>
  </div>
);

const GradeButton = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={label === "Again" ? detailDangerButton : detailButton}>
    {label}
  </button>
);
