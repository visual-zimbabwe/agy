"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildTimelineStreamGroups,
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
};

export const useWallTimelineStream = ({ notes, selectedNoteId, onSelectNote }: UseWallTimelineStreamOptions) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<TimelineStreamSortMode>("created");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>();
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const groupHeaderRefs = useRef<Record<string, HTMLElement | null>>({});
  const selectedCardRef = useRef<HTMLDivElement | null>(null);

  const totalNoteCount = useMemo(() => notes.filter((note) => !note.deletedAt).length, [notes]);
  const groups = useMemo(
    () => buildTimelineStreamGroups(notes, { sortMode, searchQuery }),
    [notes, searchQuery, sortMode],
  );
  const entryIds = useMemo(() => groups.flatMap((group) => group.entries.map((entry) => entry.id)), [groups]);
  const dayOptions = useMemo(() => getTimelineStreamDayOptions(groups), [groups]);
  const filteredNoteCount = entryIds.length;
  const hasActiveSearch = searchQuery.trim().length > 0;

  const effectiveSelectedId = resolveTimelineStreamSelection(entryIds, selectedNoteId, localSelectedId);

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

  const scrollToDay = useCallback((dayKey: string) => {
    if (!dayKey) {
      return;
    }
    const node = groupHeaderRefs.current[dayKey];
    node?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  const setEntryRef = useCallback((noteId: string, node: HTMLDivElement | null) => {
    entryRefs.current[noteId] = node;
  }, []);

  const setGroupHeaderRef = useCallback((dayKey: string, node: HTMLElement | null) => {
    groupHeaderRefs.current[dayKey] = node;
  }, []);

  useEffect(() => {
    if (!effectiveSelectedId) {
      return;
    }
    const node = entryRefs.current[effectiveSelectedId] ?? selectedCardRef.current;
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [effectiveSelectedId]);

  const visibleSelectedDayKey = useMemo(() => {
    if (!selectedDayKey) {
      return "";
    }
    return dayOptions.some((option) => option.key === selectedDayKey) ? selectedDayKey : "";
  }, [dayOptions, selectedDayKey]);

  const handleDayJump = useCallback(
    (dayKey: string) => {
      setSelectedDayKey(dayKey);
      scrollToDay(dayKey);
    },
    [scrollToDay],
  );

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
    entryIds,
    dayOptions,
    totalNoteCount,
    filteredNoteCount,
    hasActiveSearch,
    effectiveSelectedId,
    selectEntry,
    moveSelection,
    canMovePrevious,
    canMoveNext,
    selectedCardRef,
    setEntryRef,
    setGroupHeaderRef,
  };
};
