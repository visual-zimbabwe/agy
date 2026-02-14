import type { Camera } from "@/features/wall/types";

export type PresentationWaypoint = {
  id: string;
  title: string;
  camera: Camera;
  talkingPoints: string;
  createdAt: number;
};

export type PresentationPath = {
  id: string;
  title: string;
  steps: PresentationWaypoint[];
  createdAt: number;
  updatedAt: number;
};

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const normalizeCamera = (value: unknown): Camera => {
  if (!isRecord(value)) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const zoom = asNumber(value.zoom, 1);
  return {
    x: asNumber(value.x),
    y: asNumber(value.y),
    zoom: zoom > 0 ? zoom : 1,
  };
};

export const clampPresentationIndex = (index: number, size: number) => {
  if (size <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, size - 1));
};

export const makeDefaultPathTitle = (paths: PresentationPath[]) => `Narrative Path ${paths.length + 1}`;

export const createPresentationPath = (title: string, now = Date.now()): PresentationPath => ({
  id: makeId(),
  title: title.trim() || "Narrative Path",
  steps: [],
  createdAt: now,
  updatedAt: now,
});

export const addPresentationStep = (path: PresentationPath, camera: Camera, now = Date.now()): PresentationPath => {
  const stepNumber = path.steps.length + 1;
  const step: PresentationWaypoint = {
    id: makeId(),
    title: `Step ${stepNumber}`,
    camera: { ...camera },
    talkingPoints: "",
    createdAt: now,
  };
  return {
    ...path,
    steps: [...path.steps, step],
    updatedAt: now,
  };
};

export const parsePresentationPathsPayload = (payload: string): PresentationPath[] => {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized: PresentationPath[] = [];
    for (const rawPath of parsed) {
      if (!isRecord(rawPath)) {
        continue;
      }

      const id = asString(rawPath.id);
      if (!id) {
        continue;
      }

      const stepsRaw = Array.isArray(rawPath.steps) ? rawPath.steps : [];
      const steps: PresentationWaypoint[] = [];
      for (const rawStep of stepsRaw) {
        if (!isRecord(rawStep)) {
          continue;
        }
        const stepId = asString(rawStep.id);
        if (!stepId) {
          continue;
        }
        steps.push({
          id: stepId,
          title: asString(rawStep.title, "Step"),
          camera: normalizeCamera(rawStep.camera),
          talkingPoints: asString(rawStep.talkingPoints),
          createdAt: asNumber(rawStep.createdAt, Date.now()),
        });
      }

      normalized.push({
        id,
        title: asString(rawPath.title, "Narrative Path"),
        steps,
        createdAt: asNumber(rawPath.createdAt, Date.now()),
        updatedAt: asNumber(rawPath.updatedAt, Date.now()),
      });
    }

    return normalized;
  } catch {
    return [];
  }
};
