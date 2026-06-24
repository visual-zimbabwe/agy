"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Note, NoteTextFont } from "@/features/wall/types";

export type WallDetailsContextValue = {
  selectedNote?: Note;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  isSelectedNoteFocused: boolean;
  backlinks: Array<{ noteId: string; title: string }>;
  onNavigateLinkedNote: (noteId: string) => void;
  onTextFontChange: (font: NoteTextFont) => void;
  onTextSizeChange: (sizePx: number) => void;
  onTextColorChange: (color: string) => void;
  onTextHorizontalAlignChange: (align: "left" | "center" | "right") => void;
  onTextVerticalAlignChange: (align: "top" | "middle" | "bottom") => void;
  onBackgroundColorChange: (color: string) => void;
  onDuplicateSelectedNote: (noteId: string) => void;
  onTogglePinSelectedNote: (noteId: string) => void;
  onToggleHighlightSelectedNote: (noteId: string) => void;
  onToggleFocusSelectedNote: (noteId: string) => void;
  onStartLinkFromSelectedNote: (noteId: string) => void;
  onUpdateSelectedNote: (noteId: string, patch: Partial<Note>) => void;
  privateNoteSupported: boolean;
  isPrivateEnabled: boolean;
  isPrivateUnlocked: boolean;
  onProtectPrivateNote: (noteId: string) => void;
  onUnlockPrivateNote: (noteId: string) => void;
  onLockPrivateNote: (noteId: string) => void;
  onRemovePrivateProtection: (noteId: string) => void;
};

const noop = () => undefined;

const defaultWallDetailsContext: WallDetailsContextValue = {
  isSelectedNoteFocused: false,
  backlinks: [],
  onNavigateLinkedNote: noop,
  onTextFontChange: noop,
  onTextSizeChange: noop,
  onTextColorChange: noop,
  onTextHorizontalAlignChange: noop,
  onTextVerticalAlignChange: noop,
  onBackgroundColorChange: noop,
  onDuplicateSelectedNote: noop,
  onTogglePinSelectedNote: noop,
  onToggleHighlightSelectedNote: noop,
  onToggleFocusSelectedNote: noop,
  onStartLinkFromSelectedNote: noop,
  onUpdateSelectedNote: noop,
  privateNoteSupported: false,
  isPrivateEnabled: false,
  isPrivateUnlocked: false,
  onProtectPrivateNote: noop,
  onUnlockPrivateNote: noop,
  onLockPrivateNote: noop,
  onRemovePrivateProtection: noop,
};

const WallDetailsContext = createContext<WallDetailsContextValue>(defaultWallDetailsContext);

export type WallDetailsProviderProps = {
  value?: Partial<WallDetailsContextValue>;
  children: ReactNode;
};

export const WallDetailsProvider = ({ value, children }: WallDetailsProviderProps) => (
  <WallDetailsContext.Provider value={{ ...defaultWallDetailsContext, ...value }}>
    {children}
  </WallDetailsContext.Provider>
);

export const useWallDetails = () => useContext(WallDetailsContext);
