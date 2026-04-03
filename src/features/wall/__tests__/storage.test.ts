import { __test__, createWallSnapshotWritePlan } from "@/features/wall/storage";
import { normalizePersistedWallState } from "@/features/wall/storage-migrations";
import type { Link, Note, PersistedWallState, Zone } from "@/features/wall/types";
import { describe, expect, it } from "vitest";

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  text: "Hello",
  tags: [],
  textSize: "md",
  x: 0,
  y: 0,
  w: 220,
  h: 160,
  color: "#FEEA89",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const baseZone = (overrides: Partial<Zone> = {}): Zone => ({
  id: "zone-1",
  label: "Zone",
  kind: "frame",
  x: 10,
  y: 20,
  w: 200,
  h: 120,
  color: "#D6E4FF",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const baseLink = (overrides: Partial<Link> = {}): Link => ({
  id: "link-1",
  fromNoteId: "note-1",
  toNoteId: "note-2",
  type: "cause_effect",
  label: "Cause",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const makeSnapshot = (overrides: Partial<PersistedWallState> = {}): PersistedWallState => ({
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
  ...overrides,
});

describe("createWallSnapshotWritePlan", () => {
  it("collects only changed entities and deletions", () => {
    const previous = makeSnapshot({
      notes: {
        "note-1": baseNote(),
        "note-2": baseNote({ id: "note-2", text: "Remove me" }),
      },
      zones: {
        "zone-1": baseZone(),
      },
      links: {
        "link-1": baseLink(),
      },
      lastColor: "#111111",
    });

    const next = makeSnapshot({
      notes: {
        "note-1": baseNote({ text: "Updated", updatedAt: 2 }),
        "note-3": baseNote({ id: "note-3", text: "New note" }),
      },
      zones: {
        "zone-1": baseZone(),
      },
      links: {},
      camera: { x: 40, y: 20, zoom: 1.25 },
    });

    const plan = createWallSnapshotWritePlan(previous, next);

    expect(plan.notesToPut.map((note) => note.id).sort()).toEqual(["note-1", "note-3"]);
    expect(plan.noteIdsToDelete).toEqual(["note-2"]);
    expect(plan.zonesToPut).toHaveLength(0);
    expect(plan.zoneIdsToDelete).toHaveLength(0);
    expect(plan.linkIdsToDelete).toEqual(["link-1"]);
    expect(plan.cameraChanged).toBe(true);
    expect(plan.lastColorChanged).toBe(true);
    expect(plan.nextLastColor).toBeUndefined();
  });

  it("treats a missing baseline as a full initial write", () => {
    const next = makeSnapshot({
      notes: {
        "note-1": baseNote(),
      },
      zones: {
        "zone-1": baseZone(),
      },
      links: {
        "link-1": baseLink(),
      },
      lastColor: "#222222",
    });

    const plan = createWallSnapshotWritePlan(null, next);

    expect(plan.notesToPut).toHaveLength(1);
    expect(plan.zonesToPut).toHaveLength(1);
    expect(plan.linksToPut).toHaveLength(1);
    expect(plan.cameraChanged).toBe(true);
    expect(plan.lastColorChanged).toBe(true);
    expect(plan.nextLastColor).toBe("#222222");
  });

  it("builds and reapplies compact timeline deltas", () => {
    const previous = makeSnapshot({
      notes: {
        "note-1": baseNote(),
      },
      zones: {
        "zone-1": baseZone(),
      },
      links: {
        "link-1": baseLink(),
      },
      lastColor: "#111111",
    });
    const next = makeSnapshot({
      notes: {
        "note-1": baseNote({ text: "Updated", updatedAt: 2 }),
        "note-2": baseNote({ id: "note-2", text: "Added", updatedAt: 3 }),
      },
      zones: {},
      links: {},
      camera: { x: 80, y: 40, zoom: 1.4 },
      lastColor: "#333333",
    });

    const delta = __test__.buildTimelineDeltaPayload(previous, next);
    const reapplied = __test__.applyTimelineDeltaPayload(previous, delta);

    expect(reapplied).toEqual(next);
  });

  it("parses both legacy and compact timeline payloads", () => {
    const snapshot = makeSnapshot({
      notes: {
        "note-1": baseNote(),
      },
    });

    expect(__test__.parseTimelineRecordPayload(JSON.stringify(snapshot))).toEqual({
      kind: "checkpoint",
      snapshot: normalizePersistedWallState(snapshot),
    });

    expect(
      __test__.parseTimelineRecordPayload(
        JSON.stringify({
          kind: "delta",
          delta: {
            deletedNoteIds: ["note-1"],
          },
        }),
      ),
    ).toEqual({
      kind: "delta",
      delta: {
        deletedNoteIds: ["note-1"],
      },
    });
  });
});
