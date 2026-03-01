import { create } from "zustand";

import { CAMERA_DEFAULTS } from "./constants";
import type { Camera, Note, PersistedWallState, WallState } from "./types";

type HistorySnapshot = Pick<WallState, "notes" | "camera"> & { lastColor?: string };

type WallActions = {
  hydrate: (snapshot: PersistedWallState) => void;
  setCamera: (camera: Camera) => void;
  selectNote: (noteId?: string) => void;
  setLastColor: (color: string) => void;
  upsertNote: (note: Note) => void;
  patchNote: (noteId: string, patch: Partial<Note>) => void;
  removeNote: (noteId: string) => void;
  undo: () => void;
  redo: () => void;
};

export type WallStore = WallState &
  WallActions & {
    hydrated: boolean;
    historyPast: HistorySnapshot[];
    historyFuture: HistorySnapshot[];
  };

const historyLimit = 120;

const makeSnapshot = (state: WallStore): HistorySnapshot => ({
  notes: state.notes,
  camera: state.camera,
  lastColor: state.ui.lastColor
});

const withHistory = (state: WallStore, patch: Partial<WallState>) => {
  const nextNotes = patch.notes ?? state.notes;
  const nextCamera = patch.camera ?? state.camera;
  const nextUi = patch.ui ?? state.ui;
  const changed = nextNotes !== state.notes || nextCamera !== state.camera || nextUi !== state.ui;
  if (!changed) {
    return patch;
  }
  const historyPast = [...state.historyPast, makeSnapshot(state)];
  if (historyPast.length > historyLimit) {
    historyPast.splice(0, historyPast.length - historyLimit);
  }
  return {
    ...patch,
    historyPast,
    historyFuture: []
  };
};

const initialState: WallState = {
  notes: {},
  camera: CAMERA_DEFAULTS,
  ui: {}
};

export const useWallStore = create<WallStore>((set) => ({
  ...initialState,
  hydrated: false,
  historyPast: [],
  historyFuture: [],

  hydrate: (snapshot) =>
    set((state) => ({
      notes: snapshot.notes,
      camera: snapshot.camera,
      ui: {
        ...state.ui,
        lastColor: snapshot.lastColor
      },
      hydrated: true,
      historyPast: [],
      historyFuture: []
    })),

  setCamera: (camera) => set(() => ({ camera })),
  selectNote: (selectedNoteId) => set((state) => ({ ui: { ...state.ui, selectedNoteId } })),
  setLastColor: (lastColor) => set((state) => ({ ui: { ...state.ui, lastColor } })),

  upsertNote: (note) =>
    set((state) =>
      withHistory(state, {
        notes: {
          ...state.notes,
          [note.id]: note
        }
      })
    ),

  patchNote: (noteId, patch) =>
    set((state) => {
      const current = state.notes[noteId];
      if (!current) {
        return state;
      }
      return withHistory(state, {
        notes: {
          ...state.notes,
          [noteId]: {
            ...current,
            ...patch,
            updatedAt: Date.now()
          }
        }
      });
    }),

  removeNote: (noteId) =>
    set((state) => {
      if (!state.notes[noteId]) {
        return state;
      }
      const notes = { ...state.notes };
      delete notes[noteId];
      return withHistory(state, {
        notes,
        ui: {
          ...state.ui,
          selectedNoteId: state.ui.selectedNoteId === noteId ? undefined : state.ui.selectedNoteId
        }
      });
    }),

  undo: () =>
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];
      if (!previous) {
        return state;
      }
      const historyPast = state.historyPast.slice(0, -1);
      const historyFuture = [makeSnapshot(state), ...state.historyFuture].slice(0, historyLimit);
      return {
        notes: previous.notes,
        camera: previous.camera,
        ui: {
          ...state.ui,
          selectedNoteId: undefined,
          lastColor: previous.lastColor
        },
        historyPast,
        historyFuture
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.historyFuture[0];
      if (!next) {
        return state;
      }
      const historyFuture = state.historyFuture.slice(1);
      const historyPast = [...state.historyPast, makeSnapshot(state)].slice(-historyLimit);
      return {
        notes: next.notes,
        camera: next.camera,
        ui: {
          ...state.ui,
          selectedNoteId: undefined,
          lastColor: next.lastColor
        },
        historyPast,
        historyFuture
      };
    })
}));

export const selectPersistedSnapshot = (state: WallStore): PersistedWallState => ({
  notes: state.notes,
  camera: state.camera,
  lastColor: state.ui.lastColor
});
