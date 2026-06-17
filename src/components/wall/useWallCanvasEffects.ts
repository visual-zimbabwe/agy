"use client";

import { useEffect, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from "react";
import type Konva from "konva";

import type { LinkContextMenuState } from "@/components/wall/session/wall-chrome-context";
import type { Note, NoteGroup, Zone } from "@/features/wall/types";
import { clampPresentationIndex } from "@/lib/presentation-paths";

const flashDurationMs = 1200;

type EditingState = {
  id: string;
  text: string;
  focusField?: string;
};

type UseWallCanvasEffectsOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
  noteTransformerRef: RefObject<Konva.Transformer | null>;
  zoneTransformerRef: RefObject<Konva.Transformer | null>;
  noteNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  zoneNodeRefs: MutableRefObject<Record<string, Konva.Group | null>>;
  handledDeepLinkNoteRef: MutableRefObject<string | null>;
  setViewport: (value: { w: number; h: number }) => void;
  isTimeLocked: boolean;
  renderSnapshotNotes: Record<string, Note>;
  uiSelectedNoteId?: string;
  uiSelectedZoneId?: string;
  uiSelectedNoteGroupId?: string;
  uiFlashNoteId?: string;
  editing: EditingState | null;
  commitEditedNoteText: (noteId: string, text: string) => void | Promise<void>;
  linkMenu: LinkContextMenuState;
  setLinkMenu: Dispatch<SetStateAction<LinkContextMenuState>>;
  setFlashNote: (noteId?: string) => void;
  presentationLength: number;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  renderVisibleNotes: Note[];
  renderVisibleZones: Zone[];
  renderSnapshotNoteGroups: Record<string, NoteGroup>;
  selectedNoteIds: string[];
  setSelectedNoteIds: Dispatch<SetStateAction<string[]>>;
  selectNote: (noteId?: string) => void;
  selectZone: (zoneId?: string) => void;
  selectGroup: (groupId?: string) => void;
  selectNoteGroup: (groupId?: string) => void;
  focusedNoteId?: string;
  setFocusedNoteId: Dispatch<SetStateAction<string | undefined>>;
  visibleNotes: Note[];
  focusNote: (noteId: string) => void;
};

export const useWallCanvasEffects = ({
  containerRef,
  noteTransformerRef,
  zoneTransformerRef,
  noteNodeRefs,
  zoneNodeRefs,
  handledDeepLinkNoteRef,
  setViewport,
  isTimeLocked,
  renderSnapshotNotes,
  uiSelectedNoteId,
  uiSelectedZoneId,
  uiSelectedNoteGroupId,
  uiFlashNoteId,
  editing,
  commitEditedNoteText,
  linkMenu,
  setLinkMenu,
  setFlashNote,
  presentationLength,
  setPresentationIndex,
  renderVisibleNotes,
  renderVisibleZones,
  renderSnapshotNoteGroups,
  selectedNoteIds,
  setSelectedNoteIds,
  selectNote,
  selectZone,
  selectGroup,
  selectNoteGroup,
  focusedNoteId,
  setFocusedNoteId,
  visibleNotes,
  focusNote,
}: UseWallCanvasEffectsOptions) => {
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setViewport({
        w: Math.max(600, Math.round(entry.contentRect.width)),
        h: Math.max(420, Math.round(entry.contentRect.height)),
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [containerRef, setViewport]);

  useEffect(() => {
    if (!uiSelectedNoteId || !noteTransformerRef.current) {
      noteTransformerRef.current?.nodes([]);
      return;
    }

    const node = noteNodeRefs.current[uiSelectedNoteId];
    if (node) {
      const selectedNote = renderSnapshotNotes[uiSelectedNoteId];
      const disableResize = isTimeLocked || Boolean(selectedNote?.pinned);
      noteTransformerRef.current.enabledAnchors(
        disableResize
          ? []
          : [
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ],
      );
      noteTransformerRef.current.nodes([node]);
      noteTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [isTimeLocked, noteNodeRefs, noteTransformerRef, renderSnapshotNotes, uiSelectedNoteId]);

  useEffect(() => {
    if (!uiSelectedZoneId || !zoneTransformerRef.current) {
      zoneTransformerRef.current?.nodes([]);
      return;
    }

    const node = zoneNodeRefs.current[uiSelectedZoneId];
    if (node) {
      zoneTransformerRef.current.nodes([node]);
      zoneTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [renderSnapshotNotes, uiSelectedZoneId, zoneNodeRefs, zoneTransformerRef]);

  useEffect(() => {
    if (!editing?.id) {
      return;
    }

    const timer = setTimeout(() => {
      void commitEditedNoteText(editing.id, editing.text);
    }, 280);

    return () => clearTimeout(timer);
  }, [commitEditedNoteText, editing]);

  useEffect(() => {
    if (!uiFlashNoteId) {
      return;
    }

    const timer = setTimeout(() => setFlashNote(undefined), flashDurationMs);
    return () => clearTimeout(timer);
  }, [setFlashNote, uiFlashNoteId]);

  useEffect(() => {
    if (!linkMenu.open) {
      return;
    }

    const close = () => setLinkMenu((previous) => ({ ...previous, open: false }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [linkMenu.open, setLinkMenu]);

  useEffect(() => {
    setPresentationIndex((previous) => clampPresentationIndex(previous, presentationLength || 1));
  }, [presentationLength, setPresentationIndex]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const targetNoteId = new URLSearchParams(window.location.search).get("note");
    if (!targetNoteId) {
      handledDeepLinkNoteRef.current = null;
      return;
    }
    if (handledDeepLinkNoteRef.current === targetNoteId) {
      return;
    }
    if (!renderSnapshotNotes[targetNoteId]) {
      return;
    }
    handledDeepLinkNoteRef.current = targetNoteId;
    focusNote(targetNoteId);
  }, [focusNote, handledDeepLinkNoteRef, renderSnapshotNotes]);

  useEffect(() => {
    const visibleNoteIdSet = new Set(renderVisibleNotes.map((note) => note.id));
    const visibleZoneIdSet = new Set(renderVisibleZones.map((zone) => zone.id));
    const nextSelectedNoteIds = selectedNoteIds.filter((id) => visibleNoteIdSet.has(id));
    if (nextSelectedNoteIds.length !== selectedNoteIds.length) {
      setSelectedNoteIds(nextSelectedNoteIds);
    }
    if (uiSelectedNoteId && !visibleNoteIdSet.has(uiSelectedNoteId)) {
      selectNote(nextSelectedNoteIds[0]);
    }
    if (uiSelectedZoneId && !visibleZoneIdSet.has(uiSelectedZoneId)) {
      selectZone(undefined);
      selectGroup(undefined);
    }
    if (uiSelectedNoteGroupId && !renderSnapshotNoteGroups[uiSelectedNoteGroupId]) {
      selectNoteGroup(undefined);
    }
  }, [
    renderSnapshotNoteGroups,
    renderVisibleNotes,
    renderVisibleZones,
    selectedNoteIds,
    selectGroup,
    selectNote,
    selectNoteGroup,
    selectZone,
    setSelectedNoteIds,
    uiSelectedNoteGroupId,
    uiSelectedNoteId,
    uiSelectedZoneId,
  ]);

  useEffect(() => {
    if (!focusedNoteId) {
      return;
    }
    if (!renderSnapshotNotes[focusedNoteId]) {
      setFocusedNoteId(undefined);
      return;
    }
    if (!visibleNotes.some((note) => note.id === focusedNoteId)) {
      setFocusedNoteId(undefined);
    }
  }, [focusedNoteId, renderSnapshotNotes, setFocusedNoteId, visibleNotes]);
};

export type { EditingState };
