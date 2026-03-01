import type { PersistedWallState } from "./types";

type PortablePayload = {
  version: 1;
  exportedAt: number;
  wall: PersistedWallState;
};

export const exportWallAsJson = (wall: PersistedWallState): string => {
  const payload: PortablePayload = {
    version: 1,
    exportedAt: Date.now(),
    wall
  };
  return JSON.stringify(payload, null, 2);
};

export const parseImportedWallJson = (raw: string): PersistedWallState | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<PortablePayload> & { wall?: PersistedWallState };
    if (!parsed.wall) {
      return null;
    }
    return parsed.wall;
  } catch {
    return null;
  }
};
