import { describe, expect, it } from "vitest";

import { rebaseLocalWallSnapshot, shouldRejectWallSync, stageWallSyncRequest, takeNextQueuedWallSync } from "@/features/wall/sync";
import type { PersistedWallState } from "@/features/wall/types";

const makeSnapshot = (updatedAt: number): PersistedWallState => ({
  notes: {
    n1: {
      id: "n1",
      text: `note-${updatedAt}`,
      tags: [],
      x: 0,
      y: 0,
      w: 200,
      h: 140,
      color: "#FEEA89",
      createdAt: 1,
      updatedAt,
    },
  },
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
});

describe("wall sync helpers", () => {
  it("rejects stale wall revisions but allows matching or missing revisions", () => {
    expect(shouldRejectWallSync(undefined, "2026-04-02T00:00:00.000Z")).toBe(false);
    expect(shouldRejectWallSync("2026-04-02T00:00:00.000Z", "2026-04-02T00:00:00.000Z")).toBe(false);
    expect(shouldRejectWallSync("2026-04-01T00:00:00.000Z", "2026-04-02T00:00:00.000Z")).toBe(true);
  });

  it("keeps only the latest queued sync while another sync is in flight", () => {
    const first = stageWallSyncRequest({
      inFlight: true,
      next: { wallId: "wall-1", snapshot: makeSnapshot(1) },
    });
    const second = stageWallSyncRequest({
      inFlight: true,
      next: { wallId: "wall-1", snapshot: makeSnapshot(2) },
    });

    expect(first.active).toBeNull();
    expect(first.queued?.snapshot.notes.n1?.updatedAt).toBe(1);
    expect(second.active).toBeNull();
    expect(second.queued?.snapshot.notes.n1?.updatedAt).toBe(2);

    const drained = takeNextQueuedWallSync(second.queued);
    expect(drained.next?.snapshot.notes.n1?.updatedAt).toBe(2);
    expect(drained.queued).toBeNull();
  });

  it("rebases local changes onto the latest server snapshot by updatedAt", () => {
    const serverSnapshot = makeSnapshot(1);
    serverSnapshot.notes.serverOnly = {
      id: "serverOnly",
      text: "server",
      tags: [],
      x: 0,
      y: 0,
      w: 200,
      h: 140,
      color: "#FEEA89",
      createdAt: 1,
      updatedAt: 5,
    };

    const localSnapshot = makeSnapshot(10);

    const merged = rebaseLocalWallSnapshot(serverSnapshot, localSnapshot);
    expect(merged.notes.n1?.updatedAt).toBe(10);
    expect(merged.notes.n1?.text).toBe("note-10");
    expect(merged.notes.serverOnly?.text).toBe("server");
  });
});
