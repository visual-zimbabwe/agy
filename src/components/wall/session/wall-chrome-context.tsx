"use client";

import { createContext, useContext, type Dispatch, type FocusEvent, type ReactNode, type SetStateAction } from "react";

import type { DetailsSectionKey } from "@/components/wall/details/DetailsSectionTypes";
import type { LinkType, Note } from "@/features/wall/types";

export type WallEditingState = {
  editing: { id: string; text: string; focusField?: string } | null;
  setEditing: (value: { id: string; text: string } | null) => void;
  handleEditorBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
  editTagInput: string;
  setEditTagInput: (value: string) => void;
  editTagRenameFrom: string | null;
  setEditTagRenameFrom: (value: string | null) => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;
  renameTagOnNote: (noteId: string, fromTag: string, toTag: string) => void;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  openImageInsert: (noteId: string) => void;
  wikiLinkOptions: Array<{ noteId: string; title: string }>;
};

export type WallMediaNoteActions = {
  onSubmitBookmarkUrl: (noteId: string, url: string, options?: { force?: boolean }) => void;
  onOpenBookmarkUrl: (url: string) => void;
  onSelectImageNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitImageNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameImageNote: (noteId: string, name: string) => void;
  onUpdateImageCaption: (noteId: string, caption: string) => void;
  onOpenImageNote: (noteId: string) => void;
  onDownloadImageNote: (noteId: string) => void;
  onSelectFileNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitFileNoteUrl: (noteId: string, url: string) => void;
  onOpenFileNote: (noteId: string) => void;
  onDownloadFileNote: (noteId: string) => void;
  onSelectAudioNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitAudioNoteUrl: (noteId: string, url: string) => void;
  onRenameAudioNote: (noteId: string, name: string) => void;
  onOpenAudioNote: (noteId: string) => void;
  onDownloadAudioNote: (noteId: string) => void;
  onSelectVideoNoteFile: (noteId: string, file: File) => Promise<void>;
  onSubmitVideoNoteUrl: (noteId: string, url: string) => Promise<void> | void;
  onRenameVideoNote: (noteId: string, name: string) => void;
  onOpenVideoNote: (noteId: string) => void;
  onDownloadVideoNote: (noteId: string) => void;
};

export type WallZoomActions = {
  canZoomToSelection: boolean;
  detailsPanelOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
};

export type WallTimelineDockState = {
  showHeatmap: boolean;
  timelineEntries: Array<{ ts: number }>;
  jumpToTimelineDay: (day: string) => void;
  timelineMode: boolean;
  timelineIndex: number;
  isTimelinePlaying: boolean;
  setIsTimelinePlaying: Dispatch<SetStateAction<boolean>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
};

export type WallPresentationDockState = {
  presentationMode: boolean;
  presentationIndex: number;
  presentationLength: number;
  presentationModeType: "notes" | "narrative";
  narrativePaths: Array<{ id: string; title: string; stepsCount: number }>;
  activeNarrativePathId: string;
  activeStepTalkingPoints: string;
  onCreateNarrativePath: () => void;
  onPathChange: (pathId: string) => void;
  onAddNarrativeStep: () => void;
  onDeleteNarrativeStep: () => void;
  onUpdateStepTalkingPoints: (value: string) => void;
  onCaptureNarrativeStepCamera: () => void;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
};

export type LinkContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  linkId?: string;
};

export type WallLinkMenuState = {
  linkMenu: LinkContextMenuState;
  setLinkMenu: Dispatch<SetStateAction<LinkContextMenuState>>;
  deleteLink: (linkId: string) => void;
  updateLinkType: (linkId: string, type: LinkType) => void;
  maxViewportWidth: number;
  maxViewportHeight: number;
};

export type WallTagPreviewState = {
  tagPreviewScreen?: { x: number; y: number };
  tagPreviewNote?: Note;
  tagPreviewPalette?: { bg: string; border: string; text: string };
};

export type WallHistorySectionData = {
  timelineEntriesCount: number;
  visibleNotesCount: number;
  historyUndoDepth: number;
  historyRedoDepth: number;
  notes: Note[];
  onJumpStale: () => void;
  onJumpPriority: () => void;
  onClearHistory: () => void;
};

export type WallChromeContextValue = {
  isTimeLocked: boolean;
  camera: { x: number; y: number; zoom: number };
  notesById: Record<string, Note>;
  linksById: Record<string, { id: string }>;
  toScreenPoint: (
    worldX: number,
    worldY: number,
    camera: { x: number; y: number; zoom: number },
  ) => { x: number; y: number };
  editing: WallEditingState;
  mediaNoteActions: WallMediaNoteActions;
  zoom: WallZoomActions;
  timeline: WallTimelineDockState;
  presentation: WallPresentationDockState;
  linkMenu: WallLinkMenuState;
  tagPreview: WallTagPreviewState;
  history: WallHistorySectionData;
  onToggleDetailsSection: (key: DetailsSectionKey) => void;
  onCloseRightPanel: () => void;
};

const noop = () => undefined;

const defaultWallChromeContext: WallChromeContextValue = {
  isTimeLocked: false,
  camera: { x: 0, y: 0, zoom: 1 },
  notesById: {},
  linksById: {},
  toScreenPoint: () => ({ x: 0, y: 0 }),
  editing: {
    editing: null,
    setEditing: noop,
    handleEditorBlur: noop,
    editTagInput: "",
    setEditTagInput: noop,
    editTagRenameFrom: null,
    setEditTagRenameFrom: noop,
    addTagToNote: noop,
    removeTagFromNote: noop,
    renameTagOnNote: noop,
    updateNote: noop,
    openImageInsert: noop,
    wikiLinkOptions: [],
  },
  mediaNoteActions: {
    onSubmitBookmarkUrl: noop,
    onOpenBookmarkUrl: noop,
    onSelectImageNoteFile: async () => undefined,
    onSubmitImageNoteUrl: noop,
    onRenameImageNote: noop,
    onUpdateImageCaption: noop,
    onOpenImageNote: noop,
    onDownloadImageNote: noop,
    onSelectFileNoteFile: async () => undefined,
    onSubmitFileNoteUrl: noop,
    onOpenFileNote: noop,
    onDownloadFileNote: noop,
    onSelectAudioNoteFile: async () => undefined,
    onSubmitAudioNoteUrl: noop,
    onRenameAudioNote: noop,
    onOpenAudioNote: noop,
    onDownloadAudioNote: noop,
    onSelectVideoNoteFile: async () => undefined,
    onSubmitVideoNoteUrl: noop,
    onRenameVideoNote: noop,
    onOpenVideoNote: noop,
    onDownloadVideoNote: noop,
  },
  zoom: {
    canZoomToSelection: false,
    detailsPanelOpen: false,
    onZoomIn: noop,
    onZoomOut: noop,
    onResetZoom: noop,
    onZoomToFit: noop,
    onZoomToSelection: noop,
  },
  timeline: {
    showHeatmap: false,
    timelineEntries: [],
    jumpToTimelineDay: noop,
    timelineMode: false,
    timelineIndex: 0,
    isTimelinePlaying: false,
    setIsTimelinePlaying: noop,
    setTimelineIndex: noop,
  },
  presentation: {
    presentationMode: false,
    presentationIndex: 0,
    presentationLength: 0,
    presentationModeType: "notes",
    narrativePaths: [],
    activeNarrativePathId: "",
    activeStepTalkingPoints: "",
    onCreateNarrativePath: noop,
    onPathChange: noop,
    onAddNarrativeStep: noop,
    onDeleteNarrativeStep: noop,
    onUpdateStepTalkingPoints: noop,
    onCaptureNarrativeStepCamera: noop,
    setPresentationIndex: noop,
    setPresentationMode: noop,
  },
  linkMenu: {
    linkMenu: { open: false, x: 0, y: 0 },
    setLinkMenu: noop,
    deleteLink: noop,
    updateLinkType: noop,
    maxViewportWidth: 0,
    maxViewportHeight: 0,
  },
  tagPreview: {},
  history: {
    timelineEntriesCount: 0,
    visibleNotesCount: 0,
    historyUndoDepth: 0,
    historyRedoDepth: 0,
    notes: [],
    onJumpStale: noop,
    onJumpPriority: noop,
    onClearHistory: noop,
  },
  onToggleDetailsSection: noop,
  onCloseRightPanel: noop,
};

const WallChromeContext = createContext<WallChromeContextValue>(defaultWallChromeContext);

export type WallChromeProviderProps = {
  value?: Partial<WallChromeContextValue>;
  children: ReactNode;
};

const mergeNested = <T extends object>(defaults: T, overrides?: Partial<T>): T => {
  if (!overrides) {
    return defaults;
  }
  const merged = { ...defaults, ...overrides } as T;
  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const value = overrides[key];
    if (value && typeof value === "object" && !Array.isArray(value) && typeof defaults[key] === "object") {
      merged[key] = { ...(defaults[key] as object), ...(value as object) } as T[keyof T];
    }
  }
  return merged;
};

export const WallChromeProvider = ({ value, children }: WallChromeProviderProps) => (
  <WallChromeContext.Provider
    value={{
      ...defaultWallChromeContext,
      ...value,
      editing: mergeNested(defaultWallChromeContext.editing, value?.editing),
      mediaNoteActions: mergeNested(defaultWallChromeContext.mediaNoteActions, value?.mediaNoteActions),
      zoom: mergeNested(defaultWallChromeContext.zoom, value?.zoom),
      timeline: mergeNested(defaultWallChromeContext.timeline, value?.timeline),
      presentation: mergeNested(defaultWallChromeContext.presentation, value?.presentation),
      linkMenu: mergeNested(defaultWallChromeContext.linkMenu, value?.linkMenu),
      tagPreview: mergeNested(defaultWallChromeContext.tagPreview, value?.tagPreview),
      history: mergeNested(defaultWallChromeContext.history, value?.history),
    }}
  >
    {children}
  </WallChromeContext.Provider>
);

export const useWallChrome = () => useContext(WallChromeContext);
