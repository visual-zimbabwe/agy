"use client";

import { useCallback, useMemo, useState } from "react";

import {
  buildTimelineStreamGroups,
  findTimelineStreamEntry,
  flattenTimelineStreamGroups,
  getTimelineStreamDayOptions,
  moveTimelineStreamSelection,
  resolveTimelineStreamSelection,
  type TimelineStreamSortMode,
} from "@/components/wall/wallTimelineStreamHelpers";
import type { Note } from "@/features/wall/types";

type UseWallTimelineStreamOptions = {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onClearSelection?: () => void;
};

export const useWallTimelineStream = ({ notes, selectedNoteId, onSelectNote, onClearSelection }: UseWallTimelineStreamOptions) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<TimelineStreamSortMode>("created");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>();

  const totalNoteCount = useMemo(() => notes.filter((note) => !note.deletedAt).length, [notes]);
  const groups = useMemo(
    () => buildTimelineStreamGroups(notes, { sortMode, searchQuery }),
    [notes, searchQuery, sortMode],
  );
  const flatItems = useMemo(() => flattenTimelineStreamGroups(groups), [groups]);
  const entryIds = useMemo(() => groups.flatMap((group) => group.entries.map((entry) => entry.id)), [groups]);
  const dayOptions = useMemo(() => getTimelineStreamDayOptions(groups), [groups]);
  const filteredNoteCount = entryIds.length;
  const hasActiveSearch = searchQuery.trim().length > 0;

  const effectiveSelectedId = resolveTimelineStreamSelection(entryIds, selectedNoteId, localSelectedId);
  const selectedEntry = useMemo(
    () => findTimelineStreamEntry(groups, effectiveSelectedId),
    [effectiveSelectedId, groups],
  );

  const selectEntry = useCallback(
    (noteId: string) => {
      setLocalSelectedId(noteId);
      onSelectNote(noteId);
    },
    [onSelectNote],
  );

  const moveSelection = useCallback(
    (direction: "next" | "previous") => {
      const nextId = moveTimelineStreamSelection(entryIds, effectiveSelectedId, direction);
      if (nextId) {
        selectEntry(nextId);
      }
    },
    [effectiveSelectedId, entryIds, selectEntry],
  );

  const visibleSelectedDayKey = useMemo(() => {
    if (!selectedDayKey) {
      return "";
    }
    return dayOptions.some((option) => option.key === selectedDayKey) ? selectedDayKey : "";
  }, [dayOptions, selectedDayKey]);

  const handleDayJump = useCallback((dayKey: string) => {
    setSelectedDayKey(dayKey);
  }, []);

  const clearSelection = useCallback(() => {
    setLocalSelectedId(undefined);
    onClearSelection?.();
  }, [onClearSelection]);

  const canMovePrevious = Boolean(effectiveSelectedId && entryIds.indexOf(effectiveSelectedId) > 0);
  const canMoveNext = Boolean(
    effectiveSelectedId && entryIds.indexOf(effectiveSelectedId) >= 0 && entryIds.indexOf(effectiveSelectedId) < entryIds.length - 1,
  );

  return {
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    selectedDayKey: visibleSelectedDayKey,
    handleDayJump,
    groups,
    flatItems,
    entryIds,
    dayOptions,
    totalNoteCount,
    filteredNoteCount,
    hasActiveSearch,
    effectiveSelectedId,
    selectedEntry,
    selectEntry,
    clearSelection,
    moveSelection,
    canMovePrevious,
    canMoveNext,
  };
};
