"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TourCoachmark } from "@/components/wall/WallProductTour";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

type PersistedTourState = {
  version: number;
  dismissed: boolean;
  spineStep: number;
  spineCompleted: boolean;
  completed: boolean;
  completionToastSeen: boolean;
  createdNote: boolean;
  selectedNote: boolean;
  openedTools: boolean;
  openedDetails: boolean;
  usedSearch: boolean;
  usedFit: boolean;
  seenDetailsTip: boolean;
  seenOmnibarTip: boolean;
};

type UseWallProductTourOptions = {
  enabled: boolean;
  noteCount: number;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  searchOpen: boolean;
  selectedNoteId?: string;
  openLeftPanel: () => void;
};

const storageKey = "wall-product-tour:v1";
const tourVersion = 1;
const spineSteps: TourCoachmark[] = ["welcome", "canvas", "omnibar", "create-note", "fit"];

const createInitialState = (): PersistedTourState => ({
  version: tourVersion,
  dismissed: false,
  spineStep: 0,
  spineCompleted: false,
  completed: false,
  completionToastSeen: false,
  createdNote: false,
  selectedNote: false,
  openedTools: false,
  openedDetails: false,
  usedSearch: false,
  usedFit: false,
  seenDetailsTip: false,
  seenOmnibarTip: false,
});

const parseStoredState = (value: string | null): PersistedTourState => {
  if (!value) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(value) as Partial<PersistedTourState>;
    if (parsed.version !== tourVersion) {
      return createInitialState();
    }
    return { ...createInitialState(), ...parsed, version: tourVersion };
  } catch {
    return createInitialState();
  }
};

export const useWallProductTour = ({
  enabled,
  noteCount,
  leftPanelOpen,
  rightPanelOpen,
  searchOpen,
  selectedNoteId,
  openLeftPanel,
}: UseWallProductTourOptions) => {
  const [tourState, setTourState] = useState<PersistedTourState>(() => parseStoredState(readStorageValue(storageKey)));
  const createStepBaselineRef = useRef<number | null>(null);

  const patchTourState = useCallback((apply: (previous: PersistedTourState) => PersistedTourState) => {
    setTourState((previous) => {
      const next = apply(previous);
      return JSON.stringify(next) === JSON.stringify(previous) ? previous : next;
    });
  }, []);

  useEffect(() => {
    writeStorageValue(storageKey, JSON.stringify(tourState));
  }, [tourState]);

  useEffect(() => {
    if (!enabled || tourState.dismissed) {
      return;
    }
    if (!tourState.spineCompleted && spineSteps[tourState.spineStep] === "create-note" && !leftPanelOpen) {
      openLeftPanel();
    }

    queueMicrotask(() => {
      patchTourState((previous) => ({
        ...previous,
        openedTools: previous.openedTools || leftPanelOpen,
        openedDetails: previous.openedDetails || rightPanelOpen,
        usedSearch: previous.usedSearch || searchOpen,
        selectedNote: previous.selectedNote || Boolean(selectedNoteId),
      }));
    });
  }, [enabled, leftPanelOpen, openLeftPanel, patchTourState, rightPanelOpen, searchOpen, selectedNoteId, tourState.dismissed, tourState.spineCompleted, tourState.spineStep]);

  useEffect(() => {
    if (!enabled || tourState.dismissed || tourState.spineCompleted) {
      createStepBaselineRef.current = null;
      return;
    }

    if (spineSteps[tourState.spineStep] === "create-note") {
      if (createStepBaselineRef.current === null) {
        createStepBaselineRef.current = noteCount;
      }
      return;
    }

    createStepBaselineRef.current = null;
  }, [enabled, noteCount, tourState.dismissed, tourState.spineCompleted, tourState.spineStep]);

  useEffect(() => {
    if (!enabled || tourState.dismissed || tourState.spineCompleted || spineSteps[tourState.spineStep] !== "create-note") {
      return;
    }
    const baseline = createStepBaselineRef.current;
    if (baseline === null || noteCount <= baseline) {
      return;
    }

    queueMicrotask(() => {
      patchTourState((previous) => {
        if (spineSteps[previous.spineStep] !== "create-note") {
          return previous;
        }
        return {
          ...previous,
          createdNote: true,
          spineStep: Math.min(previous.spineStep + 1, spineSteps.length - 1),
        };
      });
    });
  }, [enabled, noteCount, patchTourState, tourState.dismissed, tourState.spineCompleted, tourState.spineStep]);

  useEffect(() => {
    if (!enabled || tourState.dismissed || tourState.completed || !tourState.spineCompleted) {
      return;
    }
    const activated = tourState.createdNote
      && tourState.selectedNote
      && (tourState.openedTools || tourState.openedDetails)
      && (tourState.usedSearch || tourState.usedFit);
    if (!activated) {
      return;
    }

    queueMicrotask(() => {
      patchTourState((previous) => ({ ...previous, completed: true, completionToastSeen: false }));
    });
  }, [enabled, patchTourState, tourState.completed, tourState.createdNote, tourState.dismissed, tourState.openedDetails, tourState.openedTools, tourState.selectedNote, tourState.spineCompleted, tourState.usedFit, tourState.usedSearch]);

  const nextSpineStep = useCallback(() => {
    patchTourState((previous) => {
      if (previous.dismissed || previous.spineCompleted) {
        return previous;
      }
      const nextStep = previous.spineStep + 1;
      if (nextStep >= spineSteps.length) {
        return { ...previous, spineCompleted: true };
      }
      return { ...previous, spineStep: nextStep };
    });
  }, [patchTourState]);

  const markFitUsed = useCallback(() => {
    patchTourState((previous) => {
      if (previous.usedFit && previous.spineCompleted) {
        return previous;
      }
      const activeStep = spineSteps[previous.spineStep];
      if (!previous.spineCompleted && activeStep === "fit") {
        return {
          ...previous,
          usedFit: true,
          spineCompleted: true,
        };
      }
      return { ...previous, usedFit: true };
    });
  }, [patchTourState]);

  const skipTour = useCallback(() => {
    patchTourState((previous) => ({ ...previous, dismissed: true }));
  }, [patchTourState]);

  const openTour = useCallback(() => {
    createStepBaselineRef.current = null;
    setTourState(createInitialState());
  }, []);

  const dismissCurrentTip = useCallback(() => {
    patchTourState((previous) => {
      if (previous.openedDetails && !previous.seenDetailsTip) {
        return { ...previous, seenDetailsTip: true };
      }
      if (previous.usedSearch && !previous.seenOmnibarTip) {
        return { ...previous, seenOmnibarTip: true };
      }
      return previous;
    });
  }, [patchTourState]);

  const dismissCompletion = useCallback(() => {
    patchTourState((previous) => ({ ...previous, completionToastSeen: true }));
  }, [patchTourState]);

  const activeCoachmark = useMemo<TourCoachmark | null>(() => {
    if (!enabled || tourState.dismissed) {
      return null;
    }
    if (!tourState.spineCompleted) {
      return spineSteps[tourState.spineStep] ?? null;
    }
    if (tourState.completed && !tourState.completionToastSeen) {
      return "complete";
    }
    if (tourState.openedDetails && !tourState.seenDetailsTip) {
      return "details-tip";
    }
    if (tourState.usedSearch && !tourState.seenOmnibarTip) {
      return "omnibar-tip";
    }
    return null;
  }, [enabled, tourState.completed, tourState.completionToastSeen, tourState.dismissed, tourState.openedDetails, tourState.seenDetailsTip, tourState.seenOmnibarTip, tourState.spineCompleted, tourState.spineStep, tourState.usedSearch]);

  return {
    activeCoachmark,
    nextSpineStep,
    markFitUsed,
    skipTour,
    openTour,
    dismissCurrentTip,
    dismissCompletion,
  };
};

