import type { Note, VocabularyNote, VocabularyReviewOutcome } from "@/features/wall/types";

const minuteMs = 60 * 1000;
const dayMs = 24 * 60 * 60 * 1000;

export const createVocabularyNote = (now = Date.now()): VocabularyNote => ({
  word: "",
  sourceContext: "",
  guessMeaning: "",
  meaning: "",
  ownSentence: "",
  nextReviewAt: now,
  intervalDays: 0,
  reviewsCount: 0,
  lapses: 0,
  isFocus: false,
});

const computeNextIntervalDays = (currentIntervalDays: number, outcome: VocabularyReviewOutcome) => {
  if (outcome === "again") {
    return 0;
  }
  if (outcome === "hard") {
    return 1;
  }
  if (outcome === "good") {
    return currentIntervalDays <= 0 ? 3 : Math.max(3, Math.round(currentIntervalDays * 1.8));
  }
  return currentIntervalDays <= 0 ? 7 : Math.max(7, Math.round(currentIntervalDays * 2.6));
};

const computeNextReviewAt = (now: number, intervalDays: number, outcome: VocabularyReviewOutcome) => {
  if (outcome === "again") {
    return now + 10 * minuteMs;
  }
  if (outcome === "hard") {
    return now + dayMs;
  }
  return now + intervalDays * dayMs;
};

export const applyVocabularyReview = (
  vocabulary: VocabularyNote,
  outcome: VocabularyReviewOutcome,
  now = Date.now(),
): VocabularyNote => {
  const nextIntervalDays = computeNextIntervalDays(vocabulary.intervalDays, outcome);
  const nextLapses = outcome === "again" ? vocabulary.lapses + 1 : vocabulary.lapses;
  return {
    ...vocabulary,
    intervalDays: nextIntervalDays,
    nextReviewAt: computeNextReviewAt(now, nextIntervalDays, outcome),
    lastReviewedAt: now,
    reviewsCount: vocabulary.reviewsCount + 1,
    lapses: nextLapses,
    isFocus: nextLapses >= 3,
    lastOutcome: outcome,
  };
};

export const isVocabularyNote = (note: Note): note is Note & { vocabulary: VocabularyNote } => Boolean(note.vocabulary);

export const isVocabularyDue = (note: Note, now = Date.now()) => {
  const vocabulary = note.vocabulary;
  if (!vocabulary) {
    return false;
  }
  return vocabulary.nextReviewAt <= now;
};

export const dayStartTs = (timestamp: number) => {
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};
