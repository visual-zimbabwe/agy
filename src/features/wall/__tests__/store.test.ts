import { useWallStore } from "@/features/wall/store";
import type { Note, PersistedWallState } from "@/features/wall/types";
import { beforeEach, describe, expect, it } from "vitest";

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
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
  });
});
