import { afterEach, describe, expect, it, vi } from "vitest";

import { loadWallWindow } from "@/features/wall/cloud-delta";

const createWindowPayload = (syncVersion: number) => ({
  snapshot: { notes: {}, zones: {}, zoneGroups: {}, noteGroups: {}, links: {}, camera: { x: 0, y: 0, zoom: 1 } },
  assets: {},
  readModel: {
    tileKey: "tile",
    queryBounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    candidateBounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
    prefetchBounds: [],
    counts: {
      candidateNotes: 0,
      candidateZones: 0,
      visibleNotes: 0,
      visibleZones: 0,
      visibleLinks: 0,
      visibleZoneGroups: 0,
      visibleNoteGroups: 0,
    },
  },
  syncVersion,
  shell: {
    id: "wall-1",
    camera: { x: 0, y: 0, zoom: 1 },
    syncVersion,
  },
  bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
});

describe("loadWallWindow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("de-dupes overlapping window requests for the same wall bounds", async () => {
    const responsePayload = createWindowPayload(3);

    let resolveFetch: ((value: Response) => void) | null = null;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const firstRequest = loadWallWindow("wall-1", { minX: 0, minY: 0, maxX: 100, maxY: 100 });
    const secondRequest = loadWallWindow("wall-1", { minX: 0, minY: 0, maxX: 100, maxY: 100 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(resolveFetch).not.toBeNull();
    resolveFetch!(
      new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(firstRequest).resolves.toEqual(responsePayload);
    await expect(secondRequest).resolves.toEqual(responsePayload);
  });

  it("allows a fresh request after the previous one settles", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(),
    );
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(createWindowPayload(4)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await loadWallWindow("wall-1", { minX: 0, minY: 0, maxX: 100, maxY: 100 });
    await loadWallWindow("wall-1", { minX: 0, minY: 0, maxX: 100, maxY: 100 });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
