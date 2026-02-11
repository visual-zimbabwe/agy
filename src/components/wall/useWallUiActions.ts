"use client";

import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { DetailsSectionKey, RecallDateFilter, SavedRecallSearch } from "@/components/wall/details/DetailsSectionTypes";

type UseWallUiActionsOptions = {
  presentationMode: boolean;
  timelineEntriesLength: number;
  timelineModeRef: MutableRefObject<boolean>;
  setPresentationMode: Dispatch<SetStateAction<boolean>>;
  setPresentationIndex: Dispatch<SetStateAction<number>>;
  setQuickCaptureOpen: Dispatch<SetStateAction<boolean>>;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setTimelineMode: Dispatch<SetStateAction<boolean>>;
  setTimelineIndex: Dispatch<SetStateAction<number>>;
  setIsTimelinePlaying: Dispatch<SetStateAction<boolean>>;
  setLeftPanelOpen: Dispatch<SetStateAction<boolean>>;
  setRightPanelOpen: Dispatch<SetStateAction<boolean>>;
  setLayoutPrefs: Dispatch<SetStateAction<Record<"showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags", boolean>>>;
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
  presentationMode,
  timelineEntriesLength,
  timelineModeRef,
  setPresentationMode,
  setPresentationIndex,
  setQuickCaptureOpen,
  setSearchOpen,
  setExportOpen,
  setTimelineMode,
  setTimelineIndex,
  setIsTimelinePlaying,
  setLeftPanelOpen,
  setRightPanelOpen,
  setLayoutPrefs,
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
  const setLayoutPreference = useCallback(
    (key: "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags", value: boolean) => {
      if (!value) {
        if (key === "showToolsPanel") {
          setLeftPanelOpen(false);
        }
        if (key === "showDetailsPanel") {
          setRightPanelOpen(false);
        }
      }
      setLayoutPrefs((previous) => ({ ...previous, [key]: value }));
    },
    [setLayoutPrefs, setLeftPanelOpen, setRightPanelOpen],
  );

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
      setPresentationIndex(0);
      setQuickCaptureOpen(false);
      setSearchOpen(false);
      setExportOpen(false);
    }
  }, [presentationMode, setExportOpen, setPresentationIndex, setPresentationMode, setQuickCaptureOpen, setSearchOpen]);

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
    setLayoutPreference,
    toggleDetailsSection,
    togglePresentationMode,
    toggleTimelineMode,
    saveCurrentRecallSearch,
    applySavedRecallSearch,
  };
};
