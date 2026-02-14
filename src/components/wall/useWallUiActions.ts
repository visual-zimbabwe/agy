"use client";

import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { DetailsSectionKey, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";

type UseWallUiActionsOptions = {
  readingMode: boolean;
  presentationMode: boolean;
  timelineEntriesLength: number;
  timelineModeRef: MutableRefObject<boolean>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
  setReadingMode: Dispatch<SetStateAction<boolean>>;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setQuickCaptureOpen: Dispatch<SetStateAction<boolean>>;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setTimelineMode: Dispatch<SetStateAction<boolean>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  setIsTimelinePlaying: Dispatch<SetStateAction<boolean>>;
  setDetailsSectionsOpen: Dispatch<SetStateAction<Record<DetailsSectionKey, boolean>>>;
  recallQuery: string;
  recallZoneId: string;
  recallTag: string;
  recallDateFilter: RecallDateFilter;
  savedRecallSearchesLength: number;
  setSavedRecallSearches: Dispatch<SetStateAction<SavedRecallSearch[]>>;
  setRecallQuery: (value: string) => void;
  setRecallZoneId: (value: string) => void;
  setRecallTag: (value: string) => void;
  setRecallDateFilter: (value: RecallDateFilter) => void;
};

export const useWallUiActions = ({
  readingMode,
  presentationMode,
  timelineEntriesLength,
  timelineModeRef,
  setPresentationMode,
  setReadingMode,
  setPresentationIndex,
  setQuickCaptureOpen,
  setSearchOpen,
  setExportOpen,
  setTimelineMode,
  setTimelineIndex,
  setIsTimelinePlaying,
  setDetailsSectionsOpen,
  recallQuery,
  recallZoneId,
  recallTag,
  recallDateFilter,
  savedRecallSearchesLength,
  setSavedRecallSearches,
  setRecallQuery,
  setRecallZoneId,
  setRecallTag,
  setRecallDateFilter,
}: UseWallUiActionsOptions) => {
  const toggleDetailsSection = useCallback(
    (key: DetailsSectionKey) => {
      setDetailsSectionsOpen((previous) => ({ ...previous, [key]: !previous[key] }));
    },
    [setDetailsSectionsOpen],
  );

  const togglePresentationMode = useCallback(() => {
    const next = !presentationMode;
    setPresentationMode(next);
    if (next) {
      setReadingMode(false);
      setPresentationIndex(0);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
  }, [presentationMode, setExportOpen, setPresentationIndex, setPresentationMode, setQuickCaptureOpen, setReadingMode, setSearchOpen]);

  const toggleReadingMode = useCallback(() => {
    const next = !readingMode;
    setReadingMode(next);
    if (next) {
      setPresentationMode(false);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
  }, [readingMode, setExportOpen, setPresentationMode, setQuickCaptureOpen, setReadingMode, setSearchOpen]);

  const toggleTimelineMode = useCallback(() => {
    const next = !timelineModeRef.current;
    setTimelineMode(next);
    if (next && timelineEntriesLength > 0) {
      setTimelineIndex(timelineEntriesLength - 1);
    }
    if (!next) {
      setIsTimelinePlaying(false);
    }
  }, [setIsTimelinePlaying, setTimelineIndex, setTimelineMode, timelineEntriesLength, timelineModeRef]);

  const saveCurrentRecallSearch = useCallback(() => {
    const activeCount = Number(Boolean(recallQuery)) + Number(Boolean(recallZoneId)) + Number(Boolean(recallTag)) + Number(recallDateFilter !== "all");
    if (activeCount === 0) {
      return;
    }
    const name = window.prompt("Name this recall search", `Recall ${savedRecallSearchesLength + 1}`);
    if (!name) {
      return;
    }
    const item: SavedRecallSearch = {
      id: crypto.randomUUID(),
      name: name.trim(),
      query: recallQuery,
      zoneId: recallZoneId || undefined,
      tag: recallTag || undefined,
      dateFilter: recallDateFilter,
    };
    setSavedRecallSearches((previous) => [item, ...previous].slice(0, 20));
  }, [recallDateFilter, recallQuery, recallTag, recallZoneId, savedRecallSearchesLength, setSavedRecallSearches]);

  const applySavedRecallSearch = useCallback(
    (item: SavedRecallSearch) => {
      setRecallQuery(item.query);
      setRecallZoneId(item.zoneId ?? "");
      setRecallTag(item.tag ?? "");
      setRecallDateFilter(item.dateFilter);
    },
    [setRecallDateFilter, setRecallQuery, setRecallTag, setRecallZoneId],
  );

  return {
    toggleDetailsSection,
    togglePresentationMode,
    toggleReadingMode,
    toggleTimelineMode,
    saveCurrentRecallSearch,
    applySavedRecallSearch,
  };
};
