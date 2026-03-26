"use client";

import { useEffect, useMemo } from "react";
import Fuse from "fuse.js";

import type { RecallDateFilter } from "@/components/wall/details/DetailsSectionTypes";
import { noteInAnyZone, graphPathLinks, zoneContainsNote } from "@/components/wall/wall-canvas-helpers";
import { isPrivateNote } from "@/features/wall/private-notes";
import {
  matchesWallOmnibarNoteFilters,
  parseWallOmnibarQuery,
} from "@/features/wall/omnibar";
import type { Link, Note, Zone, ZoneGroup } from "@/features/wall/types";
import { findSmartMergeSuggestions, type SmartMergeSuggestion } from "@/lib/smart-merge";
import { clamp, computeContentBounds, detectClusters } from "@/lib/wall-utils";

type Bounds = { x: number; y: number; w: number; h: number };
type TagGroup = { tag: string; noteIds: string[]; bounds: Bounds };
type TagLabelLayout = Record<string, { x: number; y: number }>;

type UseWallDerivedDataOptions = {
  notes: Note[];
  zones: Zone[];
  zoneGroups: ZoneGroup[];
  links: Link[];
  selectedNoteId?: string;
  recallQuery: string;
  recallZoneId: string;
  recallTag: string;
  recallDateFilter: RecallDateFilter;
  zonesById: Record<string, Zone>;
  wallClockTs: number;
  presentationMode: boolean;
  presentationIndex: number;
  presentationCameraEnabled?: boolean;
  viewport: { w: number; h: number };
  setCamera: (camera: { x: number; y: number; zoom: number }) => void;
};

export const useWallDerivedData = ({
  notes,
  zones,
  zoneGroups,
  links,
  selectedNoteId,
  recallQuery,
  recallZoneId,
  recallTag,
  recallDateFilter,
  zonesById,
  wallClockTs,
  presentationMode,
  presentationIndex,
  presentationCameraEnabled = true,
  viewport,
  setCamera,
}: UseWallDerivedDataOptions) => {
  const parsedOmnibarQuery = useMemo(() => parseWallOmnibarQuery(recallQuery), [recallQuery]);
  const collapsedGroupIds = useMemo(
    () => new Set(zoneGroups.filter((group) => group.collapsed).map((group) => group.id)),
    [zoneGroups],
  );
  const visibleZones = useMemo(
    () => zones.filter((zone) => !zone.groupId || !collapsedGroupIds.has(zone.groupId)),
    [collapsedGroupIds, zones],
  );
  const hiddenNotes = useMemo(() => {
    const collapsedZones = zones.filter((zone) => zone.groupId && collapsedGroupIds.has(zone.groupId));
    return new Set(notes.filter((note) => noteInAnyZone(note, collapsedZones)).map((note) => note.id));
  }, [collapsedGroupIds, notes, zones]);
  const baseVisibleNotes = useMemo(() => notes.filter((note) => !hiddenNotes.has(note.id)), [hiddenNotes, notes]);
  const recallSearchableNotes = useMemo(
    () => baseVisibleNotes.filter((note) => !isPrivateNote(note) && matchesWallOmnibarNoteFilters(note, parsedOmnibarQuery)),
    [baseVisibleNotes, parsedOmnibarQuery],
  );
  const recallFuse = useMemo(
    () =>
      new Fuse(recallSearchableNotes, {
        keys: [
          "text",
          "quoteAuthor",
          "quoteSource",
          "canon.title",
          "canon.statement",
          "canon.interpretation",
          "canon.example",
          "canon.source",
          "canon.items.title",
          "canon.items.text",
          "canon.items.interpretation",
          "tags",
          "vocabulary.word",
          "vocabulary.meaning",
          "vocabulary.sourceContext",
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [recallSearchableNotes],
  );
  const recallQueryIds = useMemo(() => {
    if (parsedOmnibarQuery.commandsOnly || !parsedOmnibarQuery.searchText) {
      return new Set(recallSearchableNotes.map((note) => note.id));
    }
    return new Set(recallFuse.search(parsedOmnibarQuery.searchText, { limit: 500 }).map((result) => result.item.id));
  }, [parsedOmnibarQuery.commandsOnly, parsedOmnibarQuery.searchText, recallFuse, recallSearchableNotes]);
  const visibleNotes = useMemo(() => {
    const now = wallClockTs;
    const selectedZone = recallZoneId ? zonesById[recallZoneId] : undefined;
    return baseVisibleNotes.filter((note) => {
      if (!matchesWallOmnibarNoteFilters(note, parsedOmnibarQuery)) {
        return false;
      }
      if (!parsedOmnibarQuery.commandsOnly && parsedOmnibarQuery.searchText && !recallQueryIds.has(note.id)) {
        return false;
      }
      if (selectedZone && !zoneContainsNote(selectedZone, note)) {
        return false;
      }
      if (recallTag && !note.tags.includes(recallTag)) {
        return false;
      }
      if (recallDateFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        if (note.updatedAt < start.getTime()) {
          return false;
        }
      }
      if (recallDateFilter === "7d" && now - note.updatedAt > 1000 * 60 * 60 * 24 * 7) {
        return false;
      }
      if (recallDateFilter === "30d" && now - note.updatedAt > 1000 * 60 * 60 * 24 * 30) {
        return false;
      }
      return true;
    });
  }, [baseVisibleNotes, parsedOmnibarQuery, recallDateFilter, recallQueryIds, recallTag, recallZoneId, wallClockTs, zonesById]);
  const visibleNoteIdSet = useMemo(() => new Set(visibleNotes.map((note) => note.id)), [visibleNotes]);
  const visibleLinks = useMemo(
    () => links.filter((link) => visibleNoteIdSet.has(link.fromNoteId) && visibleNoteIdSet.has(link.toNoteId)),
    [links, visibleNoteIdSet],
  );
  const availableRecallTags = useMemo(
    () => [...new Set(baseVisibleNotes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b)),
    [baseVisibleNotes],
  );
  const presentationNotes = useMemo(
    () => [...visibleNotes].sort((a, b) => a.updatedAt - b.updatedAt),
    [visibleNotes],
  );
  const presentationTarget = useMemo(() => {
    if (!presentationMode || presentationNotes.length === 0) {
      return undefined;
    }
    const clamped = clamp(presentationIndex, 0, presentationNotes.length - 1);
    return presentationNotes[clamped];
  }, [presentationIndex, presentationMode, presentationNotes]);

  useEffect(() => {
    if (!presentationTarget || !presentationCameraEnabled) {
      return;
    }
    const zoom = 1.25;
    setCamera({
      zoom,
      x: viewport.w / 2 - (presentationTarget.x + presentationTarget.w / 2) * zoom,
      y: viewport.h / 2 - (presentationTarget.y + presentationTarget.h / 2) * zoom,
    });
  }, [presentationCameraEnabled, presentationTarget, setCamera, viewport.h, viewport.w]);

  const autoTagGroups = useMemo<TagGroup[]>(() => {
    const byTag = new Map<string, Note[]>();
    for (const note of visibleNotes) {
      const seen = new Set<string>();
      for (const rawTag of note.tags) {
        const tag = rawTag.trim().toLowerCase();
        if (!tag || seen.has(tag)) {
          continue;
        }
        seen.add(tag);
        const normalized = tag.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        const list = byTag.get(normalized) ?? [];
        list.push(note);
        byTag.set(normalized, list);
      }
    }

    return [...byTag.entries()]
      .filter(([, taggedNotes]) => taggedNotes.length > 1)
      .map(([tag, taggedNotes]) => {
        const bounds = computeContentBounds(taggedNotes, []);
        if (!bounds) {
          return null;
        }
        return {
          tag,
          noteIds: taggedNotes.map((note) => note.id),
          bounds: {
            x: bounds.x - 26,
            y: bounds.y - 26,
            w: bounds.w + 52,
            h: bounds.h + 52,
          },
        };
      })
      .filter((group): group is TagGroup => Boolean(group))
      .sort((a, b) => b.noteIds.length - a.noteIds.length || a.tag.localeCompare(b.tag));
  }, [visibleNotes]);
  const autoTagLabelLayout = useMemo<TagLabelLayout>(() => {
    const placements: TagLabelLayout = {};
    const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

    const intersects = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    for (const group of autoTagGroups) {
      const text = `#${group.tag} (${group.noteIds.length})`;
      const width = Math.max(96, Math.min(240, 18 + text.length * 6));
      const height = 18;
      let x = group.bounds.x + 10;
      const y = group.bounds.y + 8;

      let attempts = 0;
      while (attempts < 18) {
        const box = { x, y, w: width, h: height };
        const hasCollision = occupied.some((entry) => intersects(box, entry));
        if (!hasCollision) {
          occupied.push(box);
          break;
        }
        x += width + 8;
        attempts += 1;
      }

      placements[group.tag] = { x, y };
    }

    return placements;
  }, [autoTagGroups]);
  const clusterBounds = useMemo(() => detectClusters(visibleNotes), [visibleNotes]);
  const pathLinkIds = useMemo(() => graphPathLinks(selectedNoteId, visibleLinks), [selectedNoteId, visibleLinks]);
  const smartMergeSuggestions = useMemo<SmartMergeSuggestion[]>(() => findSmartMergeSuggestions(visibleNotes), [visibleNotes]);

  return {
    visibleZones,
    visibleNotes,
    visibleLinks,
    availableRecallTags,
    presentationNotes,
    autoTagGroups,
    autoTagLabelLayout,
    clusterBounds,
    pathLinkIds,
    smartMergeSuggestions,
  };
};
