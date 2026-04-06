import { describe, expect, it } from "vitest";

import {
  hasRelevantWallDeltaChanges,
  rebaseLocalWallSnapshot,
  resolveWallBootstrapSnapshot,
  shouldRejectWallSync,
  sliceWallSnapshotToBounds,
  stageWallSyncRequest,
  takeNextQueuedWallSync,
} from "@/features/wall/sync";
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

  it("prefers the cloud snapshot during bootstrap when local cache is only an acknowledged baseline", () => {
    const serverSnapshot = makeSnapshot(20);
    const localSnapshot = makeSnapshot(10);

    const resolved = resolveWallBootstrapSnapshot({
      serverSnapshot,
      fullLocalSnapshot: localSnapshot,
      localBaselineSnapshot: localSnapshot,
      latestLocalSnapshot: localSnapshot,
      localSyncVersion: 7,
      serverSyncVersion: 7,
    });

    expect(resolved.hasUnsyncedLocalShadow).toBe(false);
    expect(resolved.nextSnapshot).toBe(serverSnapshot);
    expect(resolved.replaySnapshot).toBeNull();
  });

  it("replays a local shadow during bootstrap when it diverged from the acknowledged cloud baseline", () => {
    const serverSnapshot = makeSnapshot(20);
    const localBaselineSnapshot = makeSnapshot(20);
    const fullLocalSnapshot = makeSnapshot(30);

    const resolved = resolveWallBootstrapSnapshot({
      serverSnapshot,
      fullLocalSnapshot,
      localBaselineSnapshot,
      latestLocalSnapshot: fullLocalSnapshot,
      localSyncVersion: 7,
      serverSyncVersion: 7,
    });

    expect(resolved.hasUnsyncedLocalShadow).toBe(true);
    expect(resolved.nextSnapshot).toBe(fullLocalSnapshot);
    expect(resolved.replaySnapshot).toBe(fullLocalSnapshot);
  });

  it("slices snapshots down to the current viewport window", () => {
    const snapshot: PersistedWallState = {
      notes: {
        n1: {
          id: "n1",
          text: "inside",
          tags: [],
          x: 40,
          y: 60,
          w: 120,
          h: 80,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 1,
        },
        n2: {
          id: "n2",
          text: "outside",
          tags: [],
          x: 800,
          y: 800,
          w: 120,
          h: 80,
          color: "#FEEA89",
          createdAt: 1,
          updatedAt: 2,
        },
      },
      zones: {
        z1: {
          id: "z1",
          label: "visible",
          kind: "frame",
          groupId: "zg1",
          x: 0,
          y: 0,
          w: 240,
          h: 240,
          color: "#e5e7eb",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      zoneGroups: {
        zg1: {
          id: "zg1",
          label: "zone-group",
          color: "#bfdbfe",
          zoneIds: ["z1"],
          collapsed: false,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      noteGroups: {
        ng1: {
          id: "ng1",
          label: "note-group",
          color: "#fecaca",
          noteIds: ["n1", "n2"],
          collapsed: false,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      links: {
        l1: {
          id: "l1",
          fromNoteId: "n1",
          toNoteId: "n2",
          type: "wiki",
          label: "",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      camera: { x: 0, y: 0, zoom: 1 },
    };

    const sliced = sliceWallSnapshotToBounds(snapshot, {
      minX: 0,
      minY: 0,
      maxX: 300,
      maxY: 300,
    });

    expect(Object.keys(sliced.notes)).toEqual(["n1"]);
    expect(Object.keys(sliced.zones)).toEqual(["z1"]);
    expect(Object.keys(sliced.zoneGroups)).toEqual(["zg1"]);
    expect(Object.keys(sliced.noteGroups)).toEqual(["ng1"]);
    expect(Object.keys(sliced.links)).toEqual([]);
  });

  it("marks delta changes relevant when they touch the viewport", () => {
    expect(
      hasRelevantWallDeltaChanges(
        [
          {
            entity_type: "note",
            entity_id: "n1",
            deleted: false,
            payload: {
              id: "n1",
              text: "inside",
              tags: [],
              x: 20,
              y: 20,
              w: 100,
              h: 100,
              color: "#FEEA89",
              createdAt: 1,
              updatedAt: 2,
            },
          },
        ],
        { minX: 0, minY: 0, maxX: 200, maxY: 200 },
      ),
    ).toBe(true);

    expect(
      hasRelevantWallDeltaChanges(
        [
          {
            entity_type: "note",
            entity_id: "n2",
            deleted: false,
            payload: {
              id: "n2",
              text: "outside",
              tags: [],
              x: 900,
              y: 900,
              w: 100,
              h: 100,
              color: "#FEEA89",
              createdAt: 1,
              updatedAt: 2,
            },
          },
        ],
        { minX: 0, minY: 0, maxX: 200, maxY: 200 },
      ),
    ).toBe(false);
  });
});
