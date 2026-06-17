"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addPresentationStep,
  clampPresentationIndex,
  createPresentationPath,
  makeDefaultPathTitle,
  type PresentationPath,
} from "@/lib/presentation-paths";

type UseWallPresentationPathsOptions = {
  publishedReadOnly: boolean;
  presentationPaths: PresentationPath[];
  setPresentationPaths: (value: PresentationPath[] | ((previous: PresentationPath[]) => PresentationPath[])) => void;
  camera: { x: number; y: number; zoom: number };
  setCamera: (camera: { x: number; y: number; zoom: number }) => void;
  presentationMode: boolean;
  notesCount: number;
};

export const useWallPresentationPaths = ({
  publishedReadOnly,
  presentationPaths,
  setPresentationPaths,
  camera,
  setCamera,
  presentationMode,
  notesCount,
}: UseWallPresentationPathsOptions) => {
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [activePresentationPathId, setActivePresentationPathId] = useState("");

  const activePresentationPath = useMemo(
    () => presentationPaths.find((path) => path.id === activePresentationPathId),
    [activePresentationPathId, presentationPaths],
  );
  const activePresentationSteps = activePresentationPath?.steps ?? [];
  const hasNarrativePresentation = activePresentationSteps.length > 0;
  const presentationLengthForKeyboard = hasNarrativePresentation ? activePresentationSteps.length : notesCount;
  const presentationModeType: "notes" | "narrative" = hasNarrativePresentation ? "narrative" : "notes";
  const activePresentationStep =
    presentationModeType === "narrative"
      ? activePresentationSteps[clampPresentationIndex(presentationIndex, activePresentationSteps.length)]
      : undefined;

  const narrativePathOptions = useMemo(
    () =>
      presentationPaths.map((path) => ({
        id: path.id,
        title: path.title,
        stepsCount: path.steps.length,
      })),
    [presentationPaths],
  );

  useEffect(() => {
    if (!activePresentationPathId) {
      return;
    }
    if (!activePresentationPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale path selection when prefs change
      setActivePresentationPathId("");
      setPresentationIndex(0);
      return;
    }
    setPresentationIndex((previous) => clampPresentationIndex(previous, activePresentationSteps.length || 1));
  }, [activePresentationPath, activePresentationPathId, activePresentationSteps.length]);

  useEffect(() => {
    if (!presentationMode || !activePresentationStep) {
      return;
    }
    setCamera(activePresentationStep.camera);
  }, [activePresentationStep, presentationMode, setCamera]);

  const createNarrativePath = useCallback(() => {
    if (publishedReadOnly) {
      return;
    }
    const defaultTitle = makeDefaultPathTitle(presentationPaths);
    const provided = window.prompt("Name this narrative path", defaultTitle);
    if (provided === null) {
      return;
    }
    const path = createPresentationPath(provided.trim() || defaultTitle);
    setPresentationPaths((previous) => [path, ...previous]);
    setActivePresentationPathId(path.id);
    setPresentationIndex(0);
  }, [presentationPaths, publishedReadOnly, setPresentationPaths]);

  const addNarrativeStep = useCallback(() => {
    if (publishedReadOnly) {
      return;
    }
    const now = Date.now();
    let targetPathId = activePresentationPathId;
    if (!targetPathId) {
      const created = createPresentationPath(makeDefaultPathTitle(presentationPaths), now);
      setPresentationPaths((previous) => [created, ...previous]);
      targetPathId = created.id;
      setActivePresentationPathId(created.id);
    }

    setPresentationPaths((previous) =>
      previous.map((path) => (path.id === targetPathId ? addPresentationStep(path, camera, now) : path)),
    );

    const nextLength = activePresentationPath?.steps.length ?? 0;
    setPresentationIndex(nextLength);
  }, [activePresentationPath, activePresentationPathId, camera, presentationPaths, publishedReadOnly, setPresentationPaths]);

  const updateNarrativeTalkingPoints = useCallback(
    (value: string) => {
      if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
        return;
      }
      setPresentationPaths((previous) =>
        previous.map((path) => {
          if (path.id !== activePresentationPathId) {
            return path;
          }
          return {
            ...path,
            updatedAt: Date.now(),
            steps: path.steps.map((step) => (step.id === activePresentationStep.id ? { ...step, talkingPoints: value } : step)),
          };
        }),
      );
    },
    [activePresentationPathId, activePresentationStep, publishedReadOnly, setPresentationPaths],
  );

  const captureNarrativeStepCamera = useCallback(() => {
    if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
      return;
    }
    setPresentationPaths((previous) =>
      previous.map((path) => {
        if (path.id !== activePresentationPathId) {
          return path;
        }
        return {
          ...path,
          updatedAt: Date.now(),
          steps: path.steps.map((step) => (step.id === activePresentationStep.id ? { ...step, camera: { ...camera } } : step)),
        };
      }),
    );
  }, [activePresentationPathId, activePresentationStep, camera, publishedReadOnly, setPresentationPaths]);

  const deleteNarrativeStep = useCallback(() => {
    if (!activePresentationPathId || !activePresentationStep || publishedReadOnly) {
      return;
    }
    setPresentationPaths((previous) =>
      previous
        .map((path) => {
          if (path.id !== activePresentationPathId) {
            return path;
          }
          return {
            ...path,
            updatedAt: Date.now(),
            steps: path.steps.filter((step) => step.id !== activePresentationStep.id),
          };
        })
        .filter((path) => path.steps.length > 0 || path.id !== activePresentationPathId),
    );
    setPresentationIndex((previous) => Math.max(0, previous - 1));
  }, [activePresentationPathId, activePresentationStep, publishedReadOnly, setPresentationPaths]);

  const handleNarrativePathChange = useCallback((pathId: string) => {
    setActivePresentationPathId(pathId);
    setPresentationIndex(0);
  }, []);

  return {
    presentationIndex,
    setPresentationIndex,
    activePresentationPathId,
    activePresentationPath,
    activePresentationSteps,
    hasNarrativePresentation,
    presentationLengthForKeyboard,
    presentationModeType,
    activePresentationStep,
    narrativePathOptions,
    createNarrativePath,
    addNarrativeStep,
    updateNarrativeTalkingPoints,
    captureNarrativeStepCamera,
    deleteNarrativeStep,
    handleNarrativePathChange,
  };
};
