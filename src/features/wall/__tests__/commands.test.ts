import {
  addNotesToNoteGroup,
  applyTemplate,
  assignZoneToGroup,
  createNoteGroup,
  createLink,
  createCanonNote,
  createJournalNote,
  createEisenhowerNote,
  createNote,
  createQuoteNote,
  createZone,
  createZoneGroup,
  duplicateNote,
  mergeNotes,
  removeNotesFromNoteGroup,
  toggleNoteGroupCollapse,
} from "@/features/wall/commands";
import { NOTE_COLORS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { PersistedWallState } from "@/features/wall/types";
import { beforeEach, describe, expect, it } from "vitest";

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
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

  it("creates quote notes with quote metadata fields", () => {
    const quoteId = createQuoteNote(64, 96);
    const quote = useWallStore.getState().notes[quoteId];
    expect(quote?.noteKind).toBe("quote");
    expect(quote?.quoteAuthor).toBe("");
    expect(quote?.quoteSource).toBe("");
  });

  it("creates canon notes with single/list capable payload", () => {
    const canonId = createCanonNote(64, 96);
    const canon = useWallStore.getState().notes[canonId];
    expect(canon?.noteKind).toBe("canon");
    expect(canon?.canon?.mode).toBe("single");
    expect(canon?.canon?.items.length).toBeGreaterThan(0);
  });

  it("creates journal notes with handwritten defaults and sample text", () => {
    const journalId = createJournalNote(64, 96);
    const journal = useWallStore.getState().notes[journalId];
    expect(journal?.noteKind).toBe("journal");
    expect(journal?.textFont).toBe("patrick_hand");
    expect(journal?.text).toContain("Today felt like");
  });

  it("creates Eisenhower notes with quadrant payload", () => {
    const matrixId = createEisenhowerNote(64, 96);
    const matrix = useWallStore.getState().notes[matrixId];
    expect(matrix?.noteKind).toBe("eisenhower");
    expect(matrix?.eisenhower?.displayDate).toContain(",");
    expect(matrix?.eisenhower?.quadrants.doFirst.title).toBe("Do First");
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

  it("creates and mutates note groups for arbitrary note selections", () => {
    const firstId = createNote(0, 0);
    const secondId = createNote(220, 10);
    const thirdId = createNote(440, 20);
    const groupId = createNoteGroup("Sprint Scope", [firstId, secondId]);

    addNotesToNoteGroup(groupId, [secondId, thirdId]);
    removeNotesFromNoteGroup(groupId, [firstId]);
    toggleNoteGroupCollapse(groupId);

    const state = useWallStore.getState();
    const group = state.noteGroups[groupId];
    expect(group).toBeDefined();
    if (!group) {
      return;
    }
    expect(group.noteIds).toEqual([secondId, thirdId]);
    expect(group.collapsed).toBe(true);
  });

  it("merges notes and rewires relationships", () => {
    const keepId = createNote(0, 0);
    const mergeId = createNote(240, 0);
    const tailId = createNote(480, 0);
    const state = useWallStore.getState();
    state.patchNote(keepId, { text: "Launch checklist", tags: ["release"] });
    state.patchNote(mergeId, { text: "launch checklist", tags: ["ops"] });
    const groupId = createNoteGroup("Merge Group", [mergeId]);
    createLink(mergeId, tailId, "dependency");

    mergeNotes(keepId, mergeId);

    const next = useWallStore.getState();
    expect(next.notes[mergeId]).toBeUndefined();
    expect(next.notes[keepId]?.tags).toEqual(["release", "ops"]);
    expect(next.noteGroups[groupId]?.noteIds).toEqual([keepId]);
    const links = Object.values(next.links);
    expect(links).toHaveLength(1);
    expect(links[0]?.fromNoteId).toBe(keepId);
    expect(links[0]?.toNoteId).toBe(tailId);
  });
});


