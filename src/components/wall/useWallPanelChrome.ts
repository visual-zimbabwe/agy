"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseWallPanelChromeOptions = {
  showDetailsPanel: boolean;
  selectedNoteId?: string;
  isChromeHidden: boolean;
  markOpenIntent: (metric: "toolsPanelOpenMs" | "detailsPanelOpenMs" | "searchOpenMs" | "exportOpenMs" | "shortcutsOpenMs") => void;
  setSearchOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setFileConversionOpen: (open: boolean) => void;
};

export const useWallPanelChrome = ({
  showDetailsPanel,
  selectedNoteId,
  isChromeHidden,
  markOpenIntent,
  setSearchOpen,
  setExportOpen,
  setShortcutsOpen,
  setFileConversionOpen,
}: UseWallPanelChromeOptions) => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [preferredFileConversionMode, setPreferredFileConversionMode] = useState<"pdf_to_word" | "word_to_pdf" | null>(null);

  const previousSelectedNoteIdRef = useRef<string | undefined>(undefined);
  const previousShowDetailsPanelRef = useRef(showDetailsPanel);
  const detailsPanelAutoOpenedRef = useRef(false);

  const setSearchOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("searchOpenMs");
      }
      setSearchOpen(open);
    },
    [markOpenIntent, setSearchOpen],
  );

  const setExportOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("exportOpenMs");
      }
      setExportOpen(open);
    },
    [markOpenIntent, setExportOpen],
  );

  const setShortcutsOpenTracked = useCallback(
    (open: boolean) => {
      if (open) {
        markOpenIntent("shortcutsOpenMs");
      }
      setShortcutsOpen(open);
    },
    [markOpenIntent, setShortcutsOpen],
  );

  const openHelpCenter = useCallback(() => {
    setHelpOpen(true);
  }, []);

  const openFileConversion = useCallback(
    (conversionMode?: "pdf_to_word" | "word_to_pdf") => {
      if (conversionMode) {
        setPreferredFileConversionMode(conversionMode);
      }
      setFileConversionOpen(true);
    },
    [setFileConversionOpen],
  );

  const toggleLeftPanel = useCallback(() => {
    if (!leftPanelOpen) {
      markOpenIntent("toolsPanelOpenMs");
    }
    setLeftPanelOpen((previous) => !previous);
  }, [leftPanelOpen, markOpenIntent]);

  const openLeftPanel = useCallback(() => {
    if (leftPanelOpen) {
      return;
    }
    markOpenIntent("toolsPanelOpenMs");
    setLeftPanelOpen(true);
  }, [leftPanelOpen, markOpenIntent]);

  const closeLeftPanel = useCallback(() => {
    if (!leftPanelOpen) {
      return;
    }
    setLeftPanelOpen(false);
  }, [leftPanelOpen]);

  const toggleRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (!rightPanelOpen) {
      markOpenIntent("detailsPanelOpenMs");
    }
    setRightPanelOpen((previous) => !previous);
  }, [markOpenIntent, rightPanelOpen]);

  const openRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (rightPanelOpen) {
      return;
    }
    markOpenIntent("detailsPanelOpenMs");
    setRightPanelOpen(true);
  }, [markOpenIntent, rightPanelOpen]);

  const closeRightPanel = useCallback(() => {
    detailsPanelAutoOpenedRef.current = false;
    if (!rightPanelOpen) {
      return;
    }
    setRightPanelOpen(false);
  }, [rightPanelOpen]);

  useEffect(() => {
    if (isChromeHidden || !showDetailsPanel) {
      return;
    }

    const selectedNow = Boolean(selectedNoteId);
    const selectedBefore = Boolean(previousSelectedNoteIdRef.current);

    if (selectedNow && !selectedBefore && !rightPanelOpen) {
      markOpenIntent("detailsPanelOpenMs");
      // Sync panel open state when the user selects a note.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors prior WallCanvas auto-open behavior
      setRightPanelOpen(true);
      detailsPanelAutoOpenedRef.current = true;
    }

    if (!selectedNow && selectedBefore && detailsPanelAutoOpenedRef.current && rightPanelOpen) {
      setRightPanelOpen(false);
      detailsPanelAutoOpenedRef.current = false;
    }

    if (!selectedNow) {
      detailsPanelAutoOpenedRef.current = false;
    }

    previousSelectedNoteIdRef.current = selectedNoteId;
  }, [isChromeHidden, markOpenIntent, rightPanelOpen, selectedNoteId, showDetailsPanel]);

  useEffect(() => {
    const wasDisabled = !previousShowDetailsPanelRef.current;
    previousShowDetailsPanelRef.current = showDetailsPanel;

    if (isChromeHidden || !showDetailsPanel || !wasDisabled || !selectedNoteId || rightPanelOpen) {
      return;
    }

    markOpenIntent("detailsPanelOpenMs");
    // Account/workspace prefs can arrive after the first selection on a new device.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opens panel once prefs become available
    setRightPanelOpen(true);
    detailsPanelAutoOpenedRef.current = true;
    previousSelectedNoteIdRef.current = selectedNoteId;
  }, [isChromeHidden, markOpenIntent, rightPanelOpen, selectedNoteId, showDetailsPanel]);

  return {
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    preferredFileConversionMode,
    setPreferredFileConversionMode,
    setSearchOpenTracked,
    setExportOpenTracked,
    setShortcutsOpenTracked,
    openHelpCenter,
    openFileConversion,
    toggleLeftPanel,
    openLeftPanel,
    closeLeftPanel,
    toggleRightPanel,
    openRightPanel,
    closeRightPanel,
  };
};
