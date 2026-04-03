import { useWallStore } from "@/features/wall/store";
import type { Note, PersistedWallState } from "@/features/wall/types";
import { beforeEach, describe, expect, it } from "vitest";

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

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

const resetStore = () => {
  const state = useWallStore.getState();
  state.hydrate(emptySnapshot);
  state.clearHistory();
  state.resetSelection();
};

describe("wall store history", () => {
  beforeEach(() => {
    resetStore();
  });

  it("tracks history for note mutations and supports undo/redo", () => {
    const state = useWallStore.getState();
    state.upsertNote(baseNote());
    state.patchNote("note-1", { text: "Updated" });

    expect(useWallStore.getState().historyPast.length).toBeGreaterThan(0);
    const updated = useWallStore.getState().notes["note-1"];
    expect(updated).toBeDefined();
    if (!updated) {
      return;
    }
    expect(updated.text).toBe("Updated");

    state.undo();
    const undone = useWallStore.getState().notes["note-1"];
    expect(undone).toBeDefined();
    if (!undone) {
      return;
    }
    expect(undone.text).toBe("Hello");

    state.redo();
    const redone = useWallStore.getState().notes["note-1"];
    expect(redone).toBeDefined();
    if (!redone) {
      return;
    }
    expect(redone.text).toBe("Updated");
  });

  it("groups history operations into a single undo step", () => {
    const state = useWallStore.getState();
    state.upsertNote(baseNote());
    state.clearHistory();

    state.beginHistoryGroup();
    state.patchNote("note-1", { x: 100 });
    state.patchNote("note-1", { y: 200 });
    state.endHistoryGroup();

    expect(useWallStore.getState().historyPast).toHaveLength(1);
    state.undo();
    const restored = useWallStore.getState().notes["note-1"];
    expect(restored).toBeDefined();
    if (!restored) {
      return;
    }
    expect(restored.x).toBe(0);
    expect(restored.y).toBe(0);
  });

  it("removes links attached to a deleted note", () => {
    const state = useWallStore.getState();
    state.upsertNote(baseNote({ id: "a" }));
    state.upsertNote(baseNote({ id: "b" }));
    state.upsertNoteGroup({
      id: "group-1",
      label: "Keepers",
      color: "#C7D2FE",
      noteIds: ["a", "b"],
      collapsed: false,
      createdAt: 1,
      updatedAt: 1,
    });
    state.upsertLink({
      id: "link-1",
      fromNoteId: "a",
      toNoteId: "b",
      type: "cause_effect",
      label: "Cause -> Effect",
      createdAt: 1,
      updatedAt: 1,
    });

    state.removeNote("a");
    expect(useWallStore.getState().links["link-1"]).toBeUndefined();
    expect(useWallStore.getState().noteGroups["group-1"]?.noteIds).toEqual(["b"]);
  });

  it("merges hydrated window snapshots into the normalized entity cache without resetting history", () => {
    const state = useWallStore.getState();
    state.hydrate({
      ...emptySnapshot,
      camera: { x: 25, y: 40, zoom: 1.2 },
      lastColor: "#abc",
      notes: {
        "note-1": baseNote({ text: "Local", updatedAt: 10 }),
      },
    });
    state.clearHistory();

    state.mergeHydratedSnapshot({
      ...emptySnapshot,
      camera: { x: 999, y: 999, zoom: 2 },
      lastColor: "#def",
      notes: {
        "note-1": baseNote({ text: "Remote stale", updatedAt: 5 }),
        "note-2": baseNote({ id: "note-2", text: "Remote fresh", updatedAt: 12 }),
      },
    });

    const mergedState = useWallStore.getState();
    expect(mergedState.notes["note-1"]?.text).toBe("Local");
    expect(mergedState.notes["note-2"]?.text).toBe("Remote fresh");
    expect(mergedState.camera).toEqual({ x: 25, y: 40, zoom: 1.2 });
    expect(mergedState.ui.lastColor).toBe("#def");
    expect(mergedState.historyPast).toHaveLength(0);
  });
});
