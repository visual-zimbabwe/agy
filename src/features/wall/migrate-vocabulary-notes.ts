import type { Note, VocabularyNote } from "@/features/wall/types";

const buildVocabularyFooter = (vocabulary: VocabularyNote): string => {
  const lines: string[] = [];
  if (vocabulary.meaning.trim()) {
    lines.push(`**Meaning:** ${vocabulary.meaning.trim()}`);
  }
  if (vocabulary.sourceContext.trim()) {
    lines.push(`**Context:** ${vocabulary.sourceContext.trim()}`);
  }
  if (vocabulary.ownSentence.trim()) {
    lines.push(`**Sentence:** ${vocabulary.ownSentence.trim()}`);
  }
  if (vocabulary.guessMeaning.trim()) {
    lines.push(`**Guess:** ${vocabulary.guessMeaning.trim()}`);
  }
  return lines.join("\n\n");
};

export const convertVocabularyNoteToStandard = (note: Note, now = Date.now()): Note => {
  const vocabulary = note.vocabulary;
  if (!vocabulary) {
    return note;
  }

  const word = vocabulary.word.trim();
  const footer = buildVocabularyFooter(vocabulary);
  let text = note.text.trim();

  if (!text && word) {
    text = footer ? `## ${word}\n\n${footer}` : word;
  } else if (footer) {
    text = text ? `${text}\n\n---\n\n${footer}` : footer;
  } else if (!text && word) {
    text = word;
  }

  const { vocabulary: _vocabulary, ...rest } = note;
  void _vocabulary;
  return {
    ...rest,
    noteKind: note.noteKind === "standard" ? "standard" : note.noteKind,
    text,
    updatedAt: now,
  };
};

export const migrateVocabularyNotesInState = (
  notes: Record<string, Note>,
  now = Date.now(),
): { notes: Record<string, Note>; migratedCount: number } => {
  let migratedCount = 0;
  const nextNotes: Record<string, Note> = {};

  for (const [id, note] of Object.entries(notes)) {
    if (note.vocabulary) {
      nextNotes[id] = convertVocabularyNoteToStandard(note, now);
      migratedCount += 1;
    } else {
      nextNotes[id] = note;
    }
  }

  return { notes: nextNotes, migratedCount };
};
