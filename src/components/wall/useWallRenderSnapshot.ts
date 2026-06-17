"use client";

import { useCallback, useMemo, useState } from "react";

import { findOpenNotePosition, toScreenPoint } from "@/components/wall/wall-coordinates";
import { deriveWallAssetRecords, mergeWallAssetRecords } from "@/features/wall/asset-records";
import { NOTE_DEFAULTS } from "@/features/wall/constants";
import type { TimelineEntry } from "@/features/wall/storage";
import type { Note, PersistedWallState, WallAssetMap } from "@/features/wall/types";
import { getVideoNoteTitle, getVideoPlayback, getVideoPosterUrl } from "@/features/wall/video-notes";
import { getNoteWikiTitle } from "@/features/wall/wiki-links";
import { decodeSnapshotFromUrl, readSnapshotParamFromLocation } from "@/lib/publish";

type UseWallRenderSnapshotOptions = {
  notesMap: Record<string, Note>;
  zonesMap: PersistedWallState["zones"];
  zoneGroupsMap: PersistedWallState["zoneGroups"];
  noteGroupsMap: PersistedWallState["noteGroups"];
  linksMap: PersistedWallState["links"];
  camera: PersistedWallState["camera"];
  lastColor?: string;
  timelineMode: boolean;
  timelineIndex: number;
  timelineEntries: TimelineEntry[];
  wallAssets: WallAssetMap;
  inlinePlayingVideoNoteId?: string;
  viewport: { w: number; h: number };
};

export const useWallRenderSnapshot = ({
  notesMap,
  zonesMap,
  zoneGroupsMap,
  noteGroupsMap,
  linksMap,
  camera,
  lastColor,
  timelineMode,
  timelineIndex,
  timelineEntries,
  wallAssets,
  inlinePlayingVideoNoteId,
  viewport,
}: UseWallRenderSnapshotOptions) => {
  const [publishedSnapshot] = useState<PersistedWallState | null>(() => {
    const encoded = readSnapshotParamFromLocation();
    if (!encoded) {
      return null;
    }
    return decodeSnapshotFromUrl(encoded);
  });
  const publishedReadOnly = Boolean(publishedSnapshot);

  const activeTimelineEntry = timelineMode
    ? timelineEntries[Math.min(timelineIndex, Math.max(0, timelineEntries.length - 1))]
    : undefined;
  const activeTimelineSnapshot = activeTimelineEntry?.snapshot;
  const renderSnapshot: PersistedWallState = publishedSnapshot ?? activeTimelineSnapshot ?? {
    notes: notesMap,
    zones: zonesMap,
    zoneGroups: zoneGroupsMap,
    noteGroups: noteGroupsMap,
    links: linksMap,
    camera,
    lastColor,
  };

  const resolvedWallAssets = useMemo(
    () => mergeWallAssetRecords(deriveWallAssetRecords(renderSnapshot.notes), wallAssets),
    [renderSnapshot.notes, wallAssets],
  );

  const inlinePlayingVideoNote = inlinePlayingVideoNoteId ? renderSnapshot.notes[inlinePlayingVideoNoteId] : undefined;
  const inlinePlayingVideoScreenRect = useMemo(() => {
    if (inlinePlayingVideoNote?.noteKind !== "video") {
      return null;
    }

    const playback = getVideoPlayback(inlinePlayingVideoNote.video);
    if (!playback) {
      return null;
    }

    const mediaWidth = Math.max(0, inlinePlayingVideoNote.w - 36);
    const mediaHeight = Math.max(0, inlinePlayingVideoNote.h - 124);
    if (mediaWidth <= 0 || mediaHeight <= 0) {
      return null;
    }

    const topLeft = toScreenPoint(inlinePlayingVideoNote.x + 18, inlinePlayingVideoNote.y + 18, camera);
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: mediaWidth * camera.zoom,
      height: mediaHeight * camera.zoom,
      title: getVideoNoteTitle(inlinePlayingVideoNote.video),
      playback,
      posterUrl: getVideoPosterUrl(inlinePlayingVideoNote.video),
    };
  }, [camera, inlinePlayingVideoNote]);

  const notes = useMemo(() => Object.values(renderSnapshot.notes), [renderSnapshot.notes]);
  const zones = useMemo(() => Object.values(renderSnapshot.zones), [renderSnapshot.zones]);
  const zoneGroups = useMemo(() => Object.values(renderSnapshot.zoneGroups), [renderSnapshot.zoneGroups]);
  const links = useMemo(() => Object.values(renderSnapshot.links), [renderSnapshot.links]);

  const wikiLinkOptions = useMemo(
    () =>
      notes
        .filter((note) => note.text.trim())
        .map((note) => ({ noteId: note.id, title: getNoteWikiTitle(note) }))
        .sort((left, right) => left.title.localeCompare(right.title)),
    [notes],
  );

  const wikiLinksByNoteId = useMemo(() => {
    const grouped: Record<string, Array<{ targetNoteId: string; title: string }>> = {};
    for (const link of links) {
      if (link.type !== "wiki") {
        continue;
      }
      const target = renderSnapshot.notes[link.toNoteId];
      if (!target) {
        continue;
      }
      const list = grouped[link.fromNoteId] ?? [];
      list.push({ targetNoteId: link.toNoteId, title: getNoteWikiTitle(target) });
      grouped[link.fromNoteId] = list;
    }
    return grouped;
  }, [links, renderSnapshot.notes]);

  const backlinksByNoteId = useMemo(() => {
    const grouped: Record<string, Array<{ noteId: string; title: string }>> = {};
    for (const link of links) {
      if (link.type !== "wiki") {
        continue;
      }
      const source = renderSnapshot.notes[link.fromNoteId];
      if (!source) {
        continue;
      }
      const list = grouped[link.toNoteId] ?? [];
      list.push({ noteId: link.fromNoteId, title: getNoteWikiTitle(source) });
      grouped[link.toNoteId] = list;
    }
    return grouped;
  }, [links, renderSnapshot.notes]);

  const occupiedNoteRects = useMemo(
    () => notes.map((note) => ({ x: note.x, y: note.y, w: note.w, h: note.h })),
    [notes],
  );

  const placeNewNote = useCallback(
    (
      preferredCenter: { x: number; y: number },
      size = { w: NOTE_DEFAULTS.width, h: NOTE_DEFAULTS.height },
      extraOccupiedRects: Array<{ x: number; y: number; w: number; h: number }> = [],
    ) =>
      findOpenNotePosition({
        camera,
        viewport,
        occupiedRects: [...occupiedNoteRects, ...extraOccupiedRects],
        preferred: {
          x: preferredCenter.x - size.w / 2,
          y: preferredCenter.y - size.h / 2,
        },
        size,
      }),
    [camera, occupiedNoteRects, viewport],
  );

  return {
    publishedReadOnly,
    renderSnapshot,
    resolvedWallAssets,
    inlinePlayingVideoNote,
    inlinePlayingVideoScreenRect,
    notes,
    zones,
    zoneGroups,
    links,
    wikiLinkOptions,
    wikiLinksByNoteId,
    backlinksByNoteId,
    occupiedNoteRects,
    placeNewNote,
    activeTimelineEntry,
  };
};
