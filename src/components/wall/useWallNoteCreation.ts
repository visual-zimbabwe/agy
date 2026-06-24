"use client";

import { useCallback } from "react";

import { toWorldPoint } from "@/components/wall/wall-coordinates";
import {
  createAudioNote,
  createCanonNote,
  createEisenhowerNote,
  createFileNote,
  createImageNote,
  createJournalNote,
  createNote,
  createQuoteNote,
  createVideoNote,
  createWebBookmarkNote,
  updateNote,
} from "@/features/wall/commands";
import {
  AUDIO_NOTE_DEFAULTS,
  EISENHOWER_NOTE_DEFAULTS,
  JOURNAL_NOTE_DEFAULTS,
  NOTE_COLORS,
  NOTE_DEFAULTS,
} from "@/features/wall/constants";
import { WEB_BOOKMARK_DEFAULTS } from "@/features/wall/bookmarks";
import { IMAGE_NOTE_DEFAULTS } from "@/features/wall/image-notes";
import { VIDEO_NOTE_DEFAULTS } from "@/features/wall/video-notes";
import { useWallStore } from "@/features/wall/store";

const CODE_NOTE_DEFAULTS = {
  width: 320,
  height: 220,
  color: "#1F1F21",
  textColor: "#D4D4D4",
  textSizePx: 14,
};

const DEFAULT_CODE_NOTE_TEXT = `\`\`\`ts
const idea = "";
\`\`\``;

type UseWallNoteCreationOptions = {
  isTimeLocked: boolean;
  camera: { x: number; y: number; zoom: number };
  viewport: { w: number; h: number };
  lastColor: string;
  placeNewNote: (
    preferredCenter: { x: number; y: number },
    size?: { w: number; h: number },
    extraOccupiedRects?: Array<{ x: number; y: number; w: number; h: number }>,
  ) => { x: number; y: number };
  openEditor: (noteId: string, text: string, focusField?: string) => void;
  selectNote: (noteId?: string) => void;
  setSelectedNoteIds: (value: string[] | ((previous: string[]) => string[])) => void;
};

export const useWallNoteCreation = ({
  isTimeLocked,
  camera,
  viewport,
  lastColor,
  placeNewNote,
  openEditor,
  selectNote,
  setSelectedNoteIds,
}: UseWallNoteCreationOptions) => {
  const makeWebBookmarkNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: WEB_BOOKMARK_DEFAULTS.width, h: WEB_BOOKMARK_DEFAULTS.height });
    const id = createWebBookmarkNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeImageNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: IMAGE_NOTE_DEFAULTS.width, h: IMAGE_NOTE_DEFAULTS.height });
    const id = createImageNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeFileNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: 320, h: 112 });
    const id = createFileNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeAudioNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: AUDIO_NOTE_DEFAULTS.width, h: AUDIO_NOTE_DEFAULTS.height });
    const id = createAudioNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeVideoNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: VIDEO_NOTE_DEFAULTS.width, h: VIDEO_NOTE_DEFAULTS.height });
    const id = createVideoNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeQuoteNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world);
    const id = createQuoteNote(position.x, position.y);
    updateNote(id, {
      textColor: NOTE_DEFAULTS.textColor,
    });
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeCodeNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: CODE_NOTE_DEFAULTS.width, h: CODE_NOTE_DEFAULTS.height });
    const id = createNote(position.x, position.y, CODE_NOTE_DEFAULTS.color);
    updateNote(id, {
      noteKind: "standard",
      text: DEFAULT_CODE_NOTE_TEXT,
      color: CODE_NOTE_DEFAULTS.color,
      textColor: CODE_NOTE_DEFAULTS.textColor,
      textSizePx: CODE_NOTE_DEFAULTS.textSizePx,
      w: CODE_NOTE_DEFAULTS.width,
      h: CODE_NOTE_DEFAULTS.height,
      tags: [...new Set([...(useWallStore.getState().notes[id]?.tags ?? []), "code"])],
    });
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, DEFAULT_CODE_NOTE_TEXT);
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeCanonNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world);
    const id = createCanonNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeJournalNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: JOURNAL_NOTE_DEFAULTS.width, h: JOURNAL_NOTE_DEFAULTS.height });
    const id = createJournalNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, useWallStore.getState().notes[id]?.text ?? "");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  const makeEisenhowerNoteAtViewportCenter = useCallback(() => {
    if (isTimeLocked) {
      return;
    }
    const world = toWorldPoint(viewport.w / 2, viewport.h / 2, camera);
    const position = placeNewNote(world, { w: EISENHOWER_NOTE_DEFAULTS.width, h: EISENHOWER_NOTE_DEFAULTS.height });
    const id = createEisenhowerNote(position.x, position.y);
    setSelectedNoteIds([id]);
    selectNote(id);
    openEditor(id, "", "doFirst");
  }, [camera, isTimeLocked, openEditor, placeNewNote, selectNote, setSelectedNoteIds, viewport.h, viewport.w]);

  return {
    makeWebBookmarkNoteAtViewportCenter,
    makeImageNoteAtViewportCenter,
    makeFileNoteAtViewportCenter,
    makeAudioNoteAtViewportCenter,
    makeVideoNoteAtViewportCenter,
    makeQuoteNoteAtViewportCenter,
    makeCodeNoteAtViewportCenter,
    makeCanonNoteAtViewportCenter,
    makeJournalNoteAtViewportCenter,
    makeEisenhowerNoteAtViewportCenter,
  };
};
