"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { updateNote } from "@/features/wall/commands";
import type { Note } from "@/features/wall/types";
import { applyVocabularyReview, dayStartTs, isVocabularyDue, isVocabularyNote } from "@/features/wall/vocabulary";

type UseWallVocabularySessionOptions = {
  isTimeLocked: boolean;
  notes: Note[];
  wallClockTs: number;
  selectedVocabularyNote?: Note;
  focusNote: (noteId: string) => void;
  setReviewRevealMeaning: (value: boolean) => void;
};

export const useWallSessionClock = () => {
  const [wallClockTs, setWallClockTs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setWallClockTs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return wallClockTs;
};

export const useWallVocabularySession = ({
  isTimeLocked,
  notes,
  wallClockTs,
  selectedVocabularyNote,
  focusNote,
  setReviewRevealMeaning,
}: UseWallVocabularySessionOptions) => {
  const vocabularyNotes = useMemo(() => notes.filter((note) => isVocabularyNote(note)), [notes]);
  const vocabularyDueNotes = useMemo(
    () =>
      [...vocabularyNotes]
        .filter((note) => isVocabularyDue(note, wallClockTs))
        .sort((left, right) => left.vocabulary.nextReviewAt - right.vocabulary.nextReviewAt),
    [vocabularyNotes, wallClockTs],
  );
  const vocabularyFocusNotes = useMemo(() => vocabularyNotes.filter((note) => note.vocabulary.isFocus), [vocabularyNotes]);
  const reviewedTodayCount = useMemo(() => {
    const start = dayStartTs(wallClockTs);
    return vocabularyNotes.filter((note) => (note.vocabulary.lastReviewedAt ?? 0) >= start).length;
  }, [vocabularyNotes, wallClockTs]);

  useEffect(() => {
    setReviewRevealMeaning(false);
  }, [selectedVocabularyNote?.id, setReviewRevealMeaning]);

  const toggleVocabularyFlip = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }
      const note = notes.find((candidate) => candidate.id === noteId);
      if (!note?.vocabulary) {
        return;
      }
      updateNote(noteId, {
        vocabulary: {
          ...note.vocabulary,
          flipped: !note.vocabulary.flipped,
        },
      });
    },
    [isTimeLocked, notes],
  );

  const focusNextDueWord = useCallback(() => {
    const nextDue = vocabularyDueNotes[0];
    if (!nextDue) {
      return;
    }
    setReviewRevealMeaning(false);
    focusNote(nextDue.id);
  }, [focusNote, setReviewRevealMeaning, vocabularyDueNotes]);

  const updateVocabularyField = useCallback(
    (field: "word" | "sourceContext" | "guessMeaning" | "meaning" | "ownSentence", value: string) => {
      if (isTimeLocked || !selectedVocabularyNote?.vocabulary) {
        return;
      }
      const nextVocabulary = {
        ...selectedVocabularyNote.vocabulary,
        [field]: value,
      };
      updateNote(selectedVocabularyNote.id, {
        text: field === "word" ? value : selectedVocabularyNote.text,
        vocabulary: nextVocabulary,
      });
    },
    [isTimeLocked, selectedVocabularyNote],
  );

  const reviewSelectedWord = useCallback(
    (outcome: "again" | "hard" | "good" | "easy") => {
      if (isTimeLocked || !selectedVocabularyNote?.vocabulary) {
        return;
      }
      const ownSentence = selectedVocabularyNote.vocabulary.ownSentence.trim();
      if ((outcome === "good" || outcome === "easy") && !ownSentence) {
        return;
      }
      const nextVocabulary = applyVocabularyReview(selectedVocabularyNote.vocabulary, outcome);
      updateNote(selectedVocabularyNote.id, {
        vocabulary: nextVocabulary,
      });
      setReviewRevealMeaning(false);
    },
    [isTimeLocked, selectedVocabularyNote, setReviewRevealMeaning],
  );

  return {
    vocabularyNotes,
    vocabularyDueNotes,
    vocabularyFocusNotes,
    reviewedTodayCount,
    toggleVocabularyFlip,
    focusNextDueWord,
    updateVocabularyField,
    reviewSelectedWord,
  };
};
