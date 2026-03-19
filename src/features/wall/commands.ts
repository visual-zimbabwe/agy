import { EISENHOWER_NOTE_DEFAULTS, GROUP_COLORS, JOURNAL_NOTE_DEFAULTS, JOKER_NOTE_DEFAULTS, NOTE_COLORS, NOTE_DEFAULTS, THRONE_NOTE_DEFAULTS, ZONE_COLORS, ZONE_DEFAULTS, ZONE_KIND_DEFAULTS } from "@/features/wall/constants";
import { CURRENCY_NOTE_DEFAULTS, isCurrencyNote } from "@/features/wall/currency";
import { createBookmarkNoteState, isWebBookmarkNote, WEB_BOOKMARK_DEFAULTS } from "@/features/wall/bookmarks";
import { createEisenhowerNotePayload } from "@/features/wall/eisenhower";
import { buildJokerPlaceholderNote, fetchJokerJoke, formatJokerNoteText, hasJokerCardBeenActivated, isJokerNote, JOKER_NOTE_SOURCE, jokerErrorText, jokerLoadingText, markJokerCardActivated, sanitizeStandardNoteColor } from "@/features/wall/joker";
import { useWallStore } from "@/features/wall/store";
import { buildThronePlaceholderNote, fetchThroneQuote, formatThroneNoteText, isThroneNote, THRONE_NOTE_SOURCE, throneErrorText, throneLoadingText } from "@/features/wall/throne";
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

const createStandardNote = (x: number, y: number, color?: string) => {
  const now = Date.now();
  const chosenColor = sanitizeStandardNoteColor(color ?? useWallStore.getState().ui.lastColor ?? firstColor(NOTE_COLORS, "#FEEA89"));
  const note: Note = {
    id: makeId(),
    noteKind: "standard",
    text: "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    imageUrl: undefined,
    textAlign: "left",
    textVAlign: NOTE_DEFAULTS.textVAlign,
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

const findJokerNote = () => Object.values(useWallStore.getState().notes).find((note) => isJokerNote(note));
const findThroneNote = () => Object.values(useWallStore.getState().notes).find((note) => isThroneNote(note));

const populateJokerNote = async (noteId: string) => {
  try {
    const joke = await fetchJokerJoke();
    const note = useWallStore.getState().notes[noteId];
    if (!note || !isJokerNote(note)) {
      return;
    }

    useWallStore.getState().patchNote(noteId, {
      text: formatJokerNoteText(joke),
      quoteAuthor: JOKER_NOTE_SOURCE,
      quoteSource: joke.category,
      textColor: JOKER_NOTE_DEFAULTS.textColor,
    });
  } catch {
    const note = useWallStore.getState().notes[noteId];
    if (!note || !isJokerNote(note)) {
      return;
    }

    useWallStore.getState().patchNote(noteId, {
      text: jokerErrorText,
      quoteAuthor: JOKER_NOTE_SOURCE,
      quoteSource: "Unavailable",
      textColor: JOKER_NOTE_DEFAULTS.textColor,
    });
  }
};

const populateThroneNote = async (noteId: string) => {
  try {
    const quote = await fetchThroneQuote();
    const note = useWallStore.getState().notes[noteId];
    if (!note || !isThroneNote(note)) {
      return;
    }

    useWallStore.getState().patchNote(noteId, {
      text: formatThroneNoteText(quote),
      quoteAuthor: quote.character?.name?.trim() || THRONE_NOTE_SOURCE,
      quoteSource: quote.character?.house?.name?.trim() || "Game of Thrones",
      textColor: THRONE_NOTE_DEFAULTS.textColor,
    });
  } catch {
    const note = useWallStore.getState().notes[noteId];
    if (!note || !isThroneNote(note)) {
      return;
    }

    useWallStore.getState().patchNote(noteId, {
      text: throneErrorText,
      quoteAuthor: THRONE_NOTE_SOURCE,
      quoteSource: "Unavailable",
      textColor: THRONE_NOTE_DEFAULTS.textColor,
    });
  }
};

export const refreshJokerNote = (noteId: string) => {
  const note = useWallStore.getState().notes[noteId];
  if (!note || !isJokerNote(note)) {
    return;
  }

  useWallStore.getState().patchNote(noteId, {
    text: jokerLoadingText,
    quoteAuthor: JOKER_NOTE_SOURCE,
    quoteSource: "Loading...",
    textColor: JOKER_NOTE_DEFAULTS.textColor,
  });
  void populateJokerNote(noteId);
};

export const createJokerNote = (x: number, y: number, options?: { select?: boolean; markLifecycle?: boolean }) => {
  const now = Date.now();
  const note = buildJokerPlaceholderNote(makeId(), x, y, now);
  const { upsertNote, selectNote } = useWallStore.getState();
  upsertNote(note);
  if (options?.select !== false) {
    selectNote(note.id);
  }
  if (options?.markLifecycle !== false) {
    markJokerCardActivated();
  }
  void populateJokerNote(note.id);
  return note.id;
};

export const refreshThroneNote = (noteId: string) => {
  const note = useWallStore.getState().notes[noteId];
  if (!note || !isThroneNote(note)) {
    return;
  }

  useWallStore.getState().patchNote(noteId, {
    text: throneLoadingText,
    quoteAuthor: THRONE_NOTE_SOURCE,
    quoteSource: "Loading...",
    textColor: THRONE_NOTE_DEFAULTS.textColor,
  });
  void populateThroneNote(noteId);
};

export const createThroneNote = (x: number, y: number, options?: { select?: boolean }) => {
  const now = Date.now();
  const note = buildThronePlaceholderNote(makeId(), x, y, now);
  const { upsertNote, selectNote } = useWallStore.getState();
  upsertNote(note);
  if (options?.select !== false) {
    selectNote(note.id);
  }
  void populateThroneNote(note.id);
  return note.id;
};

export const createOrRefreshJokerNote = (options?: { noteId?: string; x?: number; y?: number; select?: boolean }) => {
  const existing = findJokerNote();
  if (existing) {
    if (options?.select !== false) {
      useWallStore.getState().selectNote(existing.id);
    }
    refreshJokerNote(existing.id);
    return existing.id;
  }

  const sourceNote = options?.noteId ? useWallStore.getState().notes[options.noteId] : undefined;
  if (sourceNote) {
    const jokerNote = buildJokerPlaceholderNote(sourceNote.id, sourceNote.x, sourceNote.y, sourceNote.createdAt);
    useWallStore.getState().upsertNote({
      ...jokerNote,
      createdAt: sourceNote.createdAt,
      updatedAt: Date.now(),
      pinned: sourceNote.pinned,
      highlighted: sourceNote.highlighted,
    });
    if (options?.select !== false) {
      useWallStore.getState().selectNote(sourceNote.id);
    }
    if (!hasJokerCardBeenActivated()) {
      markJokerCardActivated();
    }
    void populateJokerNote(sourceNote.id);
    return sourceNote.id;
  }

  return createJokerNote(options?.x ?? 0, options?.y ?? 0, { select: options?.select });
};

export const createOrRefreshThroneNote = (options?: { noteId?: string; x?: number; y?: number; select?: boolean }) => {
  const existing = findThroneNote();
  if (existing) {
    if (options?.select !== false) {
      useWallStore.getState().selectNote(existing.id);
    }
    refreshThroneNote(existing.id);
    return existing.id;
  }

  const sourceNote = options?.noteId ? useWallStore.getState().notes[options.noteId] : undefined;
  if (sourceNote) {
    const throneNote = buildThronePlaceholderNote(sourceNote.id, sourceNote.x, sourceNote.y, sourceNote.createdAt);
    useWallStore.getState().upsertNote({
      ...throneNote,
      createdAt: sourceNote.createdAt,
      updatedAt: Date.now(),
      pinned: sourceNote.pinned,
      highlighted: sourceNote.highlighted,
    });
    if (options?.select !== false) {
      useWallStore.getState().selectNote(sourceNote.id);
    }
    void populateThroneNote(sourceNote.id);
    return sourceNote.id;
  }

  return createThroneNote(options?.x ?? 0, options?.y ?? 0, { select: options?.select });
};

export const createNote = (x: number, y: number, color?: string) => createStandardNote(x, y, color);

export const createQuoteNote = (x: number, y: number, color?: string) => {
  const noteId = createNote(x, y, color);
  useWallStore.getState().patchNote(noteId, {
    noteKind: "quote",
    text: "",
    quoteAuthor: "",
    quoteSource: "",
    vocabulary: undefined,
  });
  return noteId;
};

export const createCanonNote = (x: number, y: number, color?: string) => {
  const noteId = createNote(x, y, color);
  useWallStore.getState().patchNote(noteId, {
    noteKind: "canon",
    text: "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    vocabulary: undefined,
    canon: {
      mode: "single",
      title: "",
      statement: "",
      interpretation: "",
      example: "",
      source: "",
      items: [{ id: makeId(), title: "", text: "", interpretation: "" }],
    },
  });
  return noteId;
};

const defaultJournalText = () =>
  [
    "Today felt like one of those weirdly good days.",
    "I finished the Journal card design idea and it finally started looking like a real notebook page.",
    "Need to keep the lines subtle and leave enough space so the handwriting still feels easy to read.",
  ].join("\n");

export const createJournalNote = (x: number, y: number) => {
  const noteId = createNote(x, y, JOURNAL_NOTE_DEFAULTS.color);
  useWallStore.getState().patchNote(noteId, {
    noteKind: "journal",
    text: defaultJournalText(),
    quoteAuthor: undefined,
    quoteSource: undefined,
    vocabulary: undefined,
    canon: undefined,
    eisenhower: undefined,
    textFont: JOURNAL_NOTE_DEFAULTS.textFont,
    textColor: JOURNAL_NOTE_DEFAULTS.textColor,
    textSizePx: JOURNAL_NOTE_DEFAULTS.textSizePx,
    w: JOURNAL_NOTE_DEFAULTS.width,
    h: JOURNAL_NOTE_DEFAULTS.height,
    color: JOURNAL_NOTE_DEFAULTS.color,
    tags: ["journal"],
  });
  return noteId;
};

export const createEisenhowerNote = (x: number, y: number) => {
  const noteId = createNote(x, y, EISENHOWER_NOTE_DEFAULTS.color);
  const now = Date.now();
  useWallStore.getState().patchNote(noteId, {
    noteKind: "eisenhower",
    text: "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    vocabulary: undefined,
    canon: undefined,
    eisenhower: createEisenhowerNotePayload(now),
    textFont: EISENHOWER_NOTE_DEFAULTS.textFont,
    textColor: EISENHOWER_NOTE_DEFAULTS.textColor,
    textSizePx: EISENHOWER_NOTE_DEFAULTS.textSizePx,
    w: EISENHOWER_NOTE_DEFAULTS.width,
    h: EISENHOWER_NOTE_DEFAULTS.height,
    color: EISENHOWER_NOTE_DEFAULTS.color,
    tags: ["matrix", "priority"],
    createdAt: now,
  });
  return noteId;
};

export const createWebBookmarkNote = (x: number, y: number, url = "") => {
  const noteId = createNote(x, y, WEB_BOOKMARK_DEFAULTS.color);
  useWallStore.getState().patchNote(noteId, {
    noteKind: "web-bookmark",
    text: "",
    quoteAuthor: undefined,
    quoteSource: undefined,
    vocabulary: undefined,
    canon: undefined,
    eisenhower: undefined,
    currency: undefined,
    imageUrl: undefined,
    bookmark: createBookmarkNoteState(url),
    textFont: WEB_BOOKMARK_DEFAULTS.textFont,
    textColor: WEB_BOOKMARK_DEFAULTS.textColor,
    textSizePx: WEB_BOOKMARK_DEFAULTS.textSizePx,
    w: WEB_BOOKMARK_DEFAULTS.width,
    h: WEB_BOOKMARK_DEFAULTS.height,
    color: WEB_BOOKMARK_DEFAULTS.color,
    tags: ["bookmark", "link"],
  });
  return noteId;
};

export const updateNote = (noteId: string, patch: Partial<Note>) => {
  const current = useWallStore.getState().notes[noteId];
  if (!current) {
    return;
  }

  if (isCurrencyNote(current)) {
    useWallStore.getState().patchNote(noteId, {
      ...patch,
      noteKind: "currency",
      color: CURRENCY_NOTE_DEFAULTS.color,
      textColor: current.textColor ?? CURRENCY_NOTE_DEFAULTS.textColor,
      textFont: current.textFont ?? CURRENCY_NOTE_DEFAULTS.textFont,
      w: CURRENCY_NOTE_DEFAULTS.width,
      h: CURRENCY_NOTE_DEFAULTS.height,
      tags: ["system", "currency"],
      text: "",
      quoteAuthor: undefined,
      quoteSource: undefined,
      canon: undefined,
      eisenhower: undefined,
      vocabulary: undefined,
      imageUrl: undefined,
    });
    return;
  }

  if (isJokerNote(current)) {
    useWallStore.getState().patchNote(noteId, {
      ...patch,
      noteKind: "joker",
      color: JOKER_NOTE_DEFAULTS.color,
      textColor: patch.textColor ?? current.textColor ?? JOKER_NOTE_DEFAULTS.textColor,
      tags: ["joker"],
    });
    return;
  }

  if (isThroneNote(current)) {
    useWallStore.getState().patchNote(noteId, {
      ...patch,
      noteKind: "throne",
      color: THRONE_NOTE_DEFAULTS.color,
      textColor: patch.textColor ?? current.textColor ?? THRONE_NOTE_DEFAULTS.textColor,
      tags: ["throne", "quote"],
    });
    return;
  }

  if (isWebBookmarkNote(current)) {
    useWallStore.getState().patchNote(noteId, {
      ...patch,
      noteKind: "web-bookmark",
      text: "",
      quoteAuthor: undefined,
      quoteSource: undefined,
      canon: undefined,
      eisenhower: undefined,
      currency: undefined,
      vocabulary: undefined,
      imageUrl: undefined,
      color: WEB_BOOKMARK_DEFAULTS.color,
      textColor: patch.textColor ?? current.textColor ?? WEB_BOOKMARK_DEFAULTS.textColor,
      textFont: patch.textFont ?? current.textFont ?? WEB_BOOKMARK_DEFAULTS.textFont,
      textSizePx: patch.textSizePx ?? current.textSizePx ?? WEB_BOOKMARK_DEFAULTS.textSizePx,
      bookmark: patch.bookmark ?? current.bookmark,
      tags: patch.tags ?? current.tags,
    });
    return;
  }

  useWallStore.getState().patchNote(noteId, {
    ...patch,
    color: patch.color ? sanitizeStandardNoteColor(patch.color, current.color) : patch.color,
  });
};

export const moveNote = (noteId: string, x: number, y: number) => {
  const note = useWallStore.getState().notes[noteId];
  if (!note || note.pinned) {
    return;
  }
  useWallStore.getState().patchNote(noteId, { x, y });
};

export const deleteNote = (noteId: string) => {
  const note = useWallStore.getState().notes[noteId];
  if (!note || isCurrencyNote(note)) {
    return;
  }
  useWallStore.getState().removeNote(noteId);
};

const normalizeNoteText = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]+/g, "");

const mergeNoteText = (left: string, right: string) => {
  const leftTrimmed = left.trim();
  const rightTrimmed = right.trim();
  if (!leftTrimmed) {
    return rightTrimmed;
  }
  if (!rightTrimmed) {
    return leftTrimmed;
  }

  const leftNormalized = normalizeNoteText(leftTrimmed);
  const rightNormalized = normalizeNoteText(rightTrimmed);
  if (leftNormalized && rightNormalized) {
    if (leftNormalized === rightNormalized) {
      return leftTrimmed.length >= rightTrimmed.length ? leftTrimmed : rightTrimmed;
    }
    if (leftNormalized.includes(rightNormalized)) {
      return leftTrimmed;
    }
    if (rightNormalized.includes(leftNormalized)) {
      return rightTrimmed;
    }
  }

  return `${leftTrimmed}\n\n${rightTrimmed}`;
};

export const mergeNotes = (keepNoteId: string, mergeNoteId: string) => {
  if (keepNoteId === mergeNoteId) {
    return;
  }

  withHistoryGroup(() => {
    const state = useWallStore.getState();
    const keep = state.notes[keepNoteId];
    const merge = state.notes[mergeNoteId];
    if (!keep || !merge || isCurrencyNote(keep) || isCurrencyNote(merge)) {
      return;
    }

    const mergedTags = [...new Set([...keep.tags, ...merge.tags])];
    state.patchNote(keepNoteId, {
      text: mergeNoteText(keep.text, merge.text),
      tags: mergedTags,
      highlighted: true,
    });

    const links = Object.values(state.links);
    for (const link of links) {
      if (link.fromNoteId !== mergeNoteId && link.toNoteId !== mergeNoteId) {
        continue;
      }

      const fromNoteId = link.fromNoteId === mergeNoteId ? keepNoteId : link.fromNoteId;
      const toNoteId = link.toNoteId === mergeNoteId ? keepNoteId : link.toNoteId;
      if (fromNoteId === toNoteId) {
        state.removeLink(link.id);
        continue;
      }

      const hasDuplicate = Object.values(useWallStore.getState().links).some(
        (candidate) =>
          candidate.id !== link.id &&
          candidate.fromNoteId === fromNoteId &&
          candidate.toNoteId === toNoteId &&
          candidate.type === link.type,
      );
      if (hasDuplicate) {
        state.removeLink(link.id);
        continue;
      }

      state.patchLink(link.id, { fromNoteId, toNoteId });
    }

    for (const noteGroup of Object.values(state.noteGroups)) {
      if (!noteGroup.noteIds.includes(mergeNoteId)) {
        continue;
      }
      const nextIds = [...new Set(noteGroup.noteIds.map((noteId) => (noteId === mergeNoteId ? keepNoteId : noteId)))];
      state.patchNoteGroup(noteGroup.id, { noteIds: nextIds });
    }

    state.removeNote(mergeNoteId);
    state.selectNote(keepNoteId);
    if (state.ui.linkingFromNoteId === mergeNoteId) {
      state.setLinkingFromNote(keepNoteId);
    }
  });
};

export const duplicateNote = (noteId: string) => {
  const { notes, upsertNote, selectNote } = useWallStore.getState();
  const current = notes[noteId];
  if (!current || isCurrencyNote(current)) {
    return;
  }

  const now = Date.now();
  const isSpecialGeneratedNote = isJokerNote(current) || isThroneNote(current);
  const duplicated: Note = {
    ...current,
    id: makeId(),
    noteKind: isSpecialGeneratedNote ? "standard" : current.noteKind,
    quoteAuthor: isSpecialGeneratedNote ? undefined : current.quoteAuthor,
    quoteSource: isSpecialGeneratedNote ? undefined : current.quoteSource,
    tags: isSpecialGeneratedNote ? [] : current.tags,
    color: isSpecialGeneratedNote ? sanitizeStandardNoteColor(undefined) : current.color,
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
  if (!current || isCurrencyNote(current)) {
    return;
  }

  const now = Date.now();
  const isSpecialGeneratedNote = isJokerNote(current) || isThroneNote(current);
  const duplicated: Note = {
    ...current,
    id: makeId(),
    noteKind: isSpecialGeneratedNote ? "standard" : current.noteKind,
    quoteAuthor: isSpecialGeneratedNote ? undefined : current.quoteAuthor,
    quoteSource: isSpecialGeneratedNote ? undefined : current.quoteSource,
    tags: isSpecialGeneratedNote ? [] : current.tags,
    color: isSpecialGeneratedNote ? sanitizeStandardNoteColor(undefined) : current.color,
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
  wiki: "Wiki Link",
};

export const createLink = (fromNoteId: string, toNoteId: string, type: LinkType, label?: string) => {
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
    label: label?.trim() || linkLabelByType[type],
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
        noteKind: "standard",
        text: noteDef.text,
        quoteAuthor: undefined,
        quoteSource: undefined,
        imageUrl: undefined,
        textAlign: "left",
        textVAlign: NOTE_DEFAULTS.textVAlign,
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









