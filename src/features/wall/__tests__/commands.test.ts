import {
  applyTemplate,
  assignZoneToGroup,
  createLink,
  createNote,
  createZone,
  createZoneGroup,
  duplicateNote,
} from "@/features/wall/commands";
import { NOTE_COLORS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { PersistedWallState } from "@/features/wall/types";

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

const resetStore = () => {
  const state = useWallStore.getState();
  state.hydrate(emptySnapshot);
  state.setLastColor(NOTE_COLORS[0]);
  state.setLinkType("cause_effect");
  state.setTemplateType("brainstorm");
  state.clearHistory();
  state.resetSelection();
};

describe("wall commands", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates and duplicates notes while keeping selection in sync", () => {
    const firstId = createNote(120, 220);
    duplicateNote(firstId);

    const state = useWallStore.getState();
    const notes = Object.values(state.notes);

    expect(notes).toHaveLength(2);
    expect(state.ui.selectedNoteId).toBeDefined();
    expect(state.ui.selectedNoteId).not.toBe(firstId);
  });

  it("creates links and rejects duplicate/self links", () => {
    const fromId = createNote(0, 0);
    const toId = createNote(200, 100);

    createLink(fromId, toId, "cause_effect");
    createLink(fromId, toId, "cause_effect");
    createLink(fromId, fromId, "cause_effect");

    const links = Object.values(useWallStore.getState().links);
    expect(links).toHaveLength(1);
    expect(links[0].fromNoteId).toBe(fromId);
    expect(links[0].toNoteId).toBe(toId);
  });

  it("applies template with grouped zones and notes", () => {
    applyTemplate("brainstorm", 0, 0);
    const state = useWallStore.getState();

    expect(Object.keys(state.zones).length).toBeGreaterThan(0);
    expect(Object.keys(state.zoneGroups).length).toBeGreaterThan(0);
    expect(Object.keys(state.notes).length).toBeGreaterThan(0);
    expect(state.ui.selectedGroupId).toBeDefined();
  });

  it("assigns zones between groups without duplicating membership", () => {
    const zoneId = createZone(100, 100);
    const sourceGroupId = createZoneGroup("Source", [zoneId]);
    const targetGroupId = createZoneGroup("Target", []);

    assignZoneToGroup(zoneId, targetGroupId);
    assignZoneToGroup(zoneId, targetGroupId);

    const state = useWallStore.getState();
    expect(state.zoneGroups[sourceGroupId].zoneIds).not.toContain(zoneId);
    expect(state.zoneGroups[targetGroupId].zoneIds).toEqual([zoneId]);
    expect(state.zones[zoneId].groupId).toBe(targetGroupId);
  });
});
