"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Selection, editing, linking, and spatial interaction state for the wall session. */
export type WallInteractionContextValue = {
  /** Multi-select note ids (canvas box-select and shift-click). Phase 1+ migration target. */
  selectedNoteIds: string[];
  /** Inline text editor state. Phase 1+ migration target. */
  editingNoteId: string | null;
  /** Focus-mode note id (single-note spotlight). Phase 1+ migration target. */
  focusedNoteId: string | undefined;
  /** Note id currently hovered on canvas. Phase 1+ migration target. */
  hoveredNoteId: string | undefined;
  /** Note id currently being dragged. Phase 1+ migration target. */
  draggingNoteId: string | undefined;
  /** Whether box-select mode is active. Phase 1+ migration target. */
  boxSelectMode: boolean;
};

const defaultWallInteractionContext: WallInteractionContextValue = {
  selectedNoteIds: [],
  editingNoteId: null,
  focusedNoteId: undefined,
  hoveredNoteId: undefined,
  draggingNoteId: undefined,
  boxSelectMode: false,
};

const WallInteractionContext = createContext<WallInteractionContextValue>(defaultWallInteractionContext);

export type WallInteractionProviderProps = {
  value?: Partial<WallInteractionContextValue>;
  children: ReactNode;
};

export const WallInteractionProvider = ({ value, children }: WallInteractionProviderProps) => (
  <WallInteractionContext.Provider value={{ ...defaultWallInteractionContext, ...value }}>
    {children}
  </WallInteractionContext.Provider>
);

export const useWallInteraction = () => useContext(WallInteractionContext);
