import { resolveImageAssetUrl } from "@/features/wall/asset-records";
import type { Note, WallAssetMap } from "@/features/wall/types";

type BuildOpenNoteEditorOptions = {
  note: Note;
  noteView: Note;
  resolvedAssetRecords: WallAssetMap;
  isTimeLocked: boolean;
  selectSingleNote: (noteId: string) => void;
  toggleVocabularyFlip: (noteId: string) => void;
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  openImageInsert: (noteId: string) => void;
};

export const buildOpenNoteEditor = ({
  note,
  noteView,
  resolvedAssetRecords,
  isTimeLocked,
  selectSingleNote,
  toggleVocabularyFlip,
  openEditor,
  openImageInsert,
}: BuildOpenNoteEditorOptions) => () => {
  if (isTimeLocked) {
    return;
  }
  selectSingleNote(note.id);
  if (note.vocabulary) {
    toggleVocabularyFlip(note.id);
    return;
  }
  if (noteView.noteKind === "file" || noteView.noteKind === "image") {
    openEditor(note.id, noteView.text);
    return;
  }
  if (resolveImageAssetUrl(noteView, resolvedAssetRecords)) {
    openImageInsert(note.id);
    return;
  }
  openEditor(note.id, note.text);
};
