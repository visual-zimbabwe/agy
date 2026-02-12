import LZString from "lz-string";

import type { PersistedWallState } from "@/features/wall/types";

const snapshotParam = "snapshot";

export const encodeSnapshotForUrl = (snapshot: PersistedWallState): string => {
  const json = JSON.stringify(snapshot);
  return LZString.compressToEncodedURIComponent(json);
};

export const decodeSnapshotFromUrl = (encoded: string): PersistedWallState | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) {
      return null;
    }
    const parsed = JSON.parse(json) as PersistedWallState;

    const notes = Object.fromEntries(
      Object.entries(parsed.notes ?? {}).map(([id, note]) => [id, { ...note, tags: note.tags ?? [] }]),
    );
    const zones = Object.fromEntries(
      Object.entries(parsed.zones ?? {}).map(([id, zone]) => [id, { ...zone, kind: zone.kind ?? "frame" }]),
    );

    return {
      notes,
      zones,
      zoneGroups: parsed.zoneGroups ?? {},
      noteGroups: parsed.noteGroups ?? {},
      links: parsed.links ?? {},
      camera: parsed.camera ?? { x: 0, y: 0, zoom: 1 },
      lastColor: parsed.lastColor,
    };
  } catch {
    return null;
  }
};

export const buildPublishedSnapshotUrl = (snapshot: PersistedWallState): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  const encoded = encodeSnapshotForUrl(snapshot);
  url.searchParams.set(snapshotParam, encoded);
  url.pathname = "/wall";
  return url.toString();
};

export const readSnapshotParamFromLocation = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const url = new URL(window.location.href);
  return url.searchParams.get(snapshotParam);
};
