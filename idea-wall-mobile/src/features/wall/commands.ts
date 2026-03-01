import { NOTE_COLORS, NOTE_DEFAULTS } from "./constants";
import { useWallStore } from "./store";
import type { Note } from "./types";

const makeId = () => Math.random().toString(36).slice(2, 11);

const firstColor = NOTE_COLORS[0] ?? "#FEEA89";
const randomColor = () => NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] ?? firstColor;

export const createNote = (x: number, y: number, color?: string) => {
  const now = Date.now();
  const state = useWallStore.getState();
  const chosenColor = color ?? state.ui.lastColor ?? randomColor();
  const note: Note = {
    id: makeId(),
    text: "",
    x,
    y,
    w: NOTE_DEFAULTS.width,
    h: NOTE_DEFAULTS.height,
    color: chosenColor,
    createdAt: now,
    updatedAt: now
  };

  state.upsertNote(note);
  state.setLastColor(chosenColor);
  state.selectNote(note.id);
  return note.id;
};

export const duplicateNote = (noteId: string) => {
  const state = useWallStore.getState();
  const note = state.notes[noteId];
  if (!note) {
    return;
  }
  const now = Date.now();
  const copy: Note = {
    ...note,
    id: makeId(),
    x: note.x + 24,
    y: note.y + 24,
    createdAt: now,
    updatedAt: now
  };
  state.upsertNote(copy);
  state.selectNote(copy.id);
};

export const updateNote = (noteId: string, patch: Partial<Note>) => {
  useWallStore.getState().patchNote(noteId, patch);
};

export const moveNote = (noteId: string, x: number, y: number) => {
  useWallStore.getState().patchNote(noteId, { x, y });
};

export const deleteNote = (noteId: string) => {
  useWallStore.getState().removeNote(noteId);
};
