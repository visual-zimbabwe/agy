import { GROUP_COLORS, NOTE_COLORS, NOTE_DEFAULTS, ZONE_COLORS, ZONE_DEFAULTS, ZONE_KIND_DEFAULTS } from "@/features/wall/constants";
import { useWallStore } from "@/features/wall/store";
import type { Link, LinkType, Note, NoteGroup, TemplateType, Zone, ZoneGroup, ZoneKind } from "@/features/wall/types";

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const firstColor = (palette: readonly string[], fallback: string) => palette[0] ?? fallback;
const randomColor = (palette: readonly string[], fallback: string) =>
  palette[Math.floor(Math.random() * palette.length)] ?? firstColor(palette, fallback);

const withHistoryGroup = <T>(run: () => T): T => {
  const state = useWallStore.getState();
  state.beginHistoryGroup();
  try {
    return run();
  } finally {
    useWallStore.getState().endHistoryGroup();
  }
};

export const createNote = (x: number, y: number, color?: string) => {
  const now = Date.now();
  const chosenColor = color ?? useWallStore.getState().ui.lastColor ?? firstColor(NOTE_COLORS, "#FEEA89");
  const note: Note = {
    id: makeId(),
    text: "",
    textAlign: "left",
    textFont: "nunito",
    textColor: NOTE_DEFAULTS.textColor,
    textSizePx: NOTE_DEFAULTS.textSizePx,
    tags: [],
    textSize: NOTE_DEFAULTS.textSize,
    pinned: false,
    highlighted: false,
    x,
    y,
    w: NOTE_DEFAULTS.width,
    h: NOTE_DEFAULTS.height,
    color: chosenColor,
    createdAt: now,
    updatedAt: now,
  };

  const { upsertNote, selectNote, setLastColor } = useWallStore.getState();
  upsertNote(note);
  selectNote(note.id);
  setLastColor(chosenColor);

  return note.id;
};

export const updateNote = (noteId: string, patch: Partial<Note>) => {
  useWallStore.getState().patchNote(noteId, patch);
};

export const moveNote = (noteId: string, x: number, y: number) => {
  const note = useWallStore.getState().notes[noteId];
  if (!note || note.pinned) {
    return;
  }
  useWallStore.getState().patchNote(noteId, { x, y });
};

export const deleteNote = (noteId: string) => {
  useWallStore.getState().removeNote(noteId);
};

export const duplicateNote = (noteId: string) => {
  const { notes, upsertNote, selectNote } = useWallStore.getState();
  const current = notes[noteId];
  if (!current) {
    return;
  }

  const now = Date.now();
  const duplicated: Note = {
    ...current,
    id: makeId(),
    x: current.x + 24,
    y: current.y + 24,
    createdAt: now,
    updatedAt: now,
  };

  upsertNote(duplicated);
  selectNote(duplicated.id);
};

export const duplicateNoteAt = (noteId: string, x: number, y: number) => {
  const { notes, upsertNote, selectNote } = useWallStore.getState();
  const current = notes[noteId];
  if (!current) {
    return;
  }

  const now = Date.now();
  const duplicated: Note = {
    ...current,
    id: makeId(),
    x,
    y,
    createdAt: now,
    updatedAt: now,
  };

  upsertNote(duplicated);
  selectNote(duplicated.id);
};

export const createZone = (x: number, y: number, label = "New Zone", kind: ZoneKind = "frame") => {
  const now = Date.now();
  const defaults = ZONE_KIND_DEFAULTS[kind];
  const zone: Zone = {
    id: makeId(),
    label,
    kind,
    groupId: undefined,
    x,
    y,
    w: defaults.width ?? ZONE_DEFAULTS.width,
    h: defaults.height ?? ZONE_DEFAULTS.height,
    color: randomColor(ZONE_COLORS, "#FFF4CC"),
    createdAt: now,
    updatedAt: now,
  };

  const { upsertZone, selectZone } = useWallStore.getState();
  upsertZone(zone);
  selectZone(zone.id);

  return zone.id;
};

export const updateZone = (zoneId: string, patch: Partial<Zone>) => {
  useWallStore.getState().patchZone(zoneId, patch);
};

export const moveZone = (zoneId: string, x: number, y: number) => {
  useWallStore.getState().patchZone(zoneId, { x, y });
};

export const deleteZone = (zoneId: string) => {
  useWallStore.getState().removeZone(zoneId);
};

export const createZoneGroup = (label: string, zoneIds: string[] = []) => {
  return withHistoryGroup(() => {
    const now = Date.now();
    const group: ZoneGroup = {
      id: makeId(),
      label: label.trim() || "Group",
      color: randomColor(GROUP_COLORS, "#C7D2FE"),
      zoneIds: [...new Set(zoneIds)],
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };

    const { upsertGroup, patchZone, selectGroup } = useWallStore.getState();
    upsertGroup(group);
    for (const zoneId of group.zoneIds) {
      patchZone(zoneId, { groupId: group.id });
    }
    selectGroup(group.id);
    return group.id;
  });
};

export const assignZoneToGroup = (zoneId: string, groupId?: string) => {
  withHistoryGroup(() => {
    const state = useWallStore.getState();
    const zone = state.zones[zoneId];
    if (!zone) {
      return;
    }

    const previousGroupId = zone.groupId;
    if (previousGroupId === groupId) {
      return;
    }

    if (previousGroupId && state.zoneGroups[previousGroupId]) {
      const prevGroup = state.zoneGroups[previousGroupId];
      state.patchGroup(previousGroupId, {
        zoneIds: prevGroup.zoneIds.filter((id) => id !== zoneId),
      });
    }

    state.patchZone(zoneId, { groupId });

    if (groupId && state.zoneGroups[groupId]) {
      const nextGroup = state.zoneGroups[groupId];
      if (!nextGroup.zoneIds.includes(zoneId)) {
        state.patchGroup(groupId, { zoneIds: [...nextGroup.zoneIds, zoneId] });
      }
    }
  });
};

export const toggleGroupCollapse = (groupId: string) => {
  const state = useWallStore.getState();
  const group = state.zoneGroups[groupId];
  if (!group) {
    return;
  }
  state.patchGroup(groupId, { collapsed: !group.collapsed });
};

export const setAllGroupsCollapsed = (collapsed: boolean) => {
  withHistoryGroup(() => {
    const state = useWallStore.getState();
    for (const group of Object.values(state.zoneGroups)) {
      if (group.collapsed !== collapsed) {
        state.patchGroup(group.id, { collapsed });
      }
    }
  });
};

export const deleteGroup = (groupId: string) => {
  useWallStore.getState().removeGroup(groupId);
};

export const createNoteGroup = (label: string, noteIds: string[] = []) => {
  return withHistoryGroup(() => {
    const state = useWallStore.getState();
    const now = Date.now();
    const uniqueNoteIds = [...new Set(noteIds)].filter((id) => Boolean(state.notes[id]));
    const group: NoteGroup = {
      id: makeId(),
      label: label.trim() || "Note Group",
      color: randomColor(GROUP_COLORS, "#C7D2FE"),
      noteIds: uniqueNoteIds,
      collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
    state.upsertNoteGroup(group);
    state.selectNoteGroup(group.id);
    return group.id;
  });
};

export const addNotesToNoteGroup = (groupId: string, noteIds: string[]) => {
  withHistoryGroup(() => {
    const state = useWallStore.getState();
    const group = state.noteGroups[groupId];
    if (!group) {
      return;
    }
    const additions = noteIds.filter((id) => Boolean(state.notes[id]));
    const nextIds = [...new Set([...group.noteIds, ...additions])];
    if (nextIds.length === group.noteIds.length) {
      return;
    }
    state.patchNoteGroup(groupId, { noteIds: nextIds });
  });
};

export const removeNotesFromNoteGroup = (groupId: string, noteIds: string[]) => {
  withHistoryGroup(() => {
    const state = useWallStore.getState();
    const group = state.noteGroups[groupId];
    if (!group) {
      return;
    }
    const removeSet = new Set(noteIds);
    const nextIds = group.noteIds.filter((id) => !removeSet.has(id));
    if (nextIds.length === group.noteIds.length) {
      return;
    }
    state.patchNoteGroup(groupId, { noteIds: nextIds });
  });
};

export const toggleNoteGroupCollapse = (groupId: string) => {
  const state = useWallStore.getState();
  const group = state.noteGroups[groupId];
  if (!group) {
    return;
  }
  state.patchNoteGroup(groupId, { collapsed: !group.collapsed });
};

export const setAllNoteGroupsCollapsed = (collapsed: boolean) => {
  withHistoryGroup(() => {
    const state = useWallStore.getState();
    for (const group of Object.values(state.noteGroups)) {
      if (group.collapsed !== collapsed) {
        state.patchNoteGroup(group.id, { collapsed });
      }
    }
  });
};

export const deleteNoteGroup = (groupId: string) => {
  useWallStore.getState().removeNoteGroup(groupId);
};

const linkLabelByType: Record<LinkType, string> = {
  cause_effect: "Cause -> Effect",
  dependency: "Dependency",
  idea_execution: "Idea -> Execution",
};

export const createLink = (fromNoteId: string, toNoteId: string, type: LinkType) => {
  if (fromNoteId === toNoteId) {
    return;
  }

  const state = useWallStore.getState();
  const hasDuplicate = Object.values(state.links).some(
    (link) => link.fromNoteId === fromNoteId && link.toNoteId === toNoteId && link.type === type,
  );
  if (hasDuplicate) {
    return;
  }

  const now = Date.now();
  const link: Link = {
    id: makeId(),
    fromNoteId,
    toNoteId,
    type,
    label: linkLabelByType[type],
    createdAt: now,
    updatedAt: now,
  };

  state.upsertLink(link);
  state.selectLink(link.id);
};

export const deleteLink = (linkId: string) => {
  useWallStore.getState().removeLink(linkId);
};

export const updateLinkType = (linkId: string, type: LinkType) => {
  useWallStore.getState().patchLink(linkId, { type, label: linkLabelByType[type] });
};

const templateDefinitions: Record<
  TemplateType,
  {
    zones: Array<{ label: string; dx: number; dy: number; color?: string; w?: number; h?: number }>;
    notes: Array<{ text: string; tags: string[]; dx: number; dy: number; color?: string }>;
  }
> = {
  brainstorm: {
    zones: [
      { label: "Problem Space", dx: -520, dy: -160, color: "#FFF4CC" },
      { label: "Wild Ideas", dx: -40, dy: -220, color: "#EDEBFF" },
      { label: "Feasible Bets", dx: 430, dy: -80, color: "#E7F6F2" },
    ],
    notes: [
      { text: "What if we removed onboarding friction?", tags: ["question", "users"], dx: -470, dy: -90 },
      { text: "Auto-cluster by intent and urgency", tags: ["ai", "ux"], dx: 0, dy: -140 },
      { text: "Ship a focused MVP experiment", tags: ["mvp", "experiment"], dx: 470, dy: -20 },
    ],
  },
  retro: {
    zones: [
      { label: "Went Well", dx: -520, dy: -180, color: "#E7F6F2" },
      { label: "Needs Work", dx: -40, dy: -180, color: "#FFE7EE" },
      { label: "Action Items", dx: 430, dy: -180, color: "#FFF4CC" },
    ],
    notes: [
      { text: "Team responded quickly to bugs", tags: ["wins"], dx: -470, dy: -90 },
      { text: "Release checklist was unclear", tags: ["process"], dx: 10, dy: -90 },
      { text: "Add pre-release QA gate", tags: ["action", "owner-needed"], dx: 470, dy: -90 },
    ],
  },
  strategy_map: {
    zones: [
      { label: "Vision", dx: -560, dy: -200, color: "#EDEBFF" },
      { label: "Initiatives", dx: -40, dy: -200, color: "#FFF4CC" },
      { label: "Metrics", dx: 470, dy: -200, color: "#E7F6F2" },
    ],
    notes: [
      { text: "Become the default idea capture tool", tags: ["north-star"], dx: -520, dy: -120 },
      { text: "Launch smart-link workflows", tags: ["initiative", "q2"], dx: -20, dy: -120 },
      { text: "Increase retained weekly creators by 20%", tags: ["metric", "okr"], dx: 500, dy: -120 },
    ],
  },
};

export const applyTemplate = (templateType: TemplateType, centerX: number, centerY: number) => {
  withHistoryGroup(() => {
    const now = Date.now();
    const def = templateDefinitions[templateType];
    const state = useWallStore.getState();
    const createdZoneIds: string[] = [];

    for (const zoneDef of def.zones) {
      const zone: Zone = {
        id: makeId(),
        label: zoneDef.label,
        kind: "frame",
        x: centerX + zoneDef.dx,
        y: centerY + zoneDef.dy,
        w: zoneDef.w ?? ZONE_DEFAULTS.width,
        h: zoneDef.h ?? ZONE_DEFAULTS.height,
        color: zoneDef.color ?? randomColor(ZONE_COLORS, "#FFF4CC"),
        groupId: undefined,
        createdAt: now,
        updatedAt: now,
      };
      state.upsertZone(zone);
      createdZoneIds.push(zone.id);
    }

    const groupId = createZoneGroup(
      templateType === "brainstorm" ? "Brainstorm Set" : templateType === "retro" ? "Retro Set" : "Strategy Set",
      createdZoneIds,
    );

    for (const noteDef of def.notes) {
      const note: Note = {
        id: makeId(),
        text: noteDef.text,
        textAlign: "left",
        textFont: "nunito",
        textColor: NOTE_DEFAULTS.textColor,
        textSizePx: NOTE_DEFAULTS.textSizePx,
        tags: noteDef.tags,
        textSize: NOTE_DEFAULTS.textSize,
        pinned: false,
        highlighted: false,
        x: centerX + noteDef.dx,
        y: centerY + noteDef.dy,
        w: NOTE_DEFAULTS.width,
        h: NOTE_DEFAULTS.height,
        color: noteDef.color ?? randomColor(NOTE_COLORS, "#FEEA89"),
        createdAt: now,
        updatedAt: now,
      };
      state.upsertNote(note);
    }

    state.selectGroup(groupId);
  });
};
