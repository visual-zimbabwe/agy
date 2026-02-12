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
import { beforeEach, describe, expect, it } from "vitest";

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
    const [firstLink] = links;
    expect(firstLink).toBeDefined();
    if (!firstLink) {
      return;
    }
    expect(firstLink.fromNoteId).toBe(fromId);
    expect(firstLink.toNoteId).toBe(toId);
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
    const sourceGroup = state.zoneGroups[sourceGroupId];
    const targetGroup = state.zoneGroups[targetGroupId];
    const zone = state.zones[zoneId];
    expect(sourceGroup).toBeDefined();
    expect(targetGroup).toBeDefined();
    expect(zone).toBeDefined();
    if (!sourceGroup || !targetGroup || !zone) {
      return;
    }
    expect(sourceGroup.zoneIds).not.toContain(zoneId);
    expect(targetGroup.zoneIds).toEqual([zoneId]);
    expect(zone.groupId).toBe(targetGroupId);
  });

  it("creates zone variants with distinct kind", () => {
    const frameId = createZone(10, 10, "Frame");
    const columnId = createZone(20, 20, "Column", "column");
    const swimlaneId = createZone(30, 30, "Swimlane", "swimlane");

    const state = useWallStore.getState();
    expect(state.zones[frameId]?.kind).toBe("frame");
    expect(state.zones[columnId]?.kind).toBe("column");
    expect(state.zones[swimlaneId]?.kind).toBe("swimlane");
  });
});
