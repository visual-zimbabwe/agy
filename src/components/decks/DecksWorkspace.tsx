"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  createWorkspaceWindowId,
  workspaceChannelName,
  type WorkspaceEnvelope,
} from "@/lib/workspace-sync";

type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };
type StudyLimits = {
  effectiveNewLimit: number;
  effectiveReviewLimit: number;
  newServed: number;
  reviewServed: number;
  remainingNew: number;
  remainingReview: number;
};

type Deck = {
  id: string;
  name: string;
  parent_id: string | null;
  scheduler_mode?: "legacy" | "fsrs";
  fsrs_params?: unknown;
  fsrs_optimized_at?: string | null;
  counts: DeckCounts;
};

type NoteType = {
  id: string;
  name: string;
  builtin_key: string | null;
  fields: unknown;
  front_template: string;
  back_template: string;
  css: string;
};

type StudyCard = {
  id: string;
  prompt: string;
  answer: string;
};

type CustomStudyMode = "increase_new" | "increase_review" | "forgotten" | "ahead" | "preview_new" | "state_tag";
type CustomStateFilter = "new" | "due" | "all_random" | "all_added";

type CustomStudySessionPayload = {
  mode: CustomStudyMode;
  name: string;
  reschedule: boolean;
  cards: Array<{
    id: string;
    prompt: string;
    answer: string;
    state: string;
    due_at: string | null;
    created_at: string;
    tags: string[];
  }>;
  counts: DeckCounts;
};

type BrowseRow = {
  id: string;
  deck_id: string;
  deckName: string;
  noteTypeName: string;
  prompt: string;
  answer: string;
  due_at: string | null;
  state: string;
  note: {
    id: string;
    suspended: boolean;
    flagged: boolean;
    tags: unknown;
  } | null;
};

type StatsPayload = {
  summary: { totalCards: number; totalReviews: number; retentionRate: number; dueTomorrow: number };
  workload7: Array<{ day: string; due: number }>;
};

type ImportPreset = {
  id: string;
  name: string;
  mapping: {
    deckId: string;
    noteTypeId: string;
    frontColumn: string;
    backColumn: string;
    tagsColumn: string;
  };
};

type View = "decks" | "browse" | "stats" | "study";
type ToolbarModal = "none" | "add" | "import" | "options" | "customStudy" | "customStudyTags";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
};

const parseDelimitedLine = (line: string, delimiter: "," | "\t") => {
  const cells: string[] = [];
  let cursor = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cursor += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      cells.push(cursor.trim());
      cursor = "";
      continue;
    }
    cursor += char;
  }
  cells.push(cursor.trim());
  return cells;
};

type ParsedImportFile = {
  columns: string[];
  rows: string[][];
};

const parseSeparatorDirective = (line: string): "," | "\t" | null => {
  const match = line.match(/^#\s*separator\s*:\s*(.+)\s*$/i);
  if (!match) {
    return null;
  }
  const value = match[1]?.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value === "tab" || value === "\\t") {
    return "\t";
  }
  if (value === "comma" || value === "csv") {
    return ",";
  }
  return null;
};

const parseImportText = (raw: string): ParsedImportFile => {
  let delimiterFromDirective: "," | "\t" | null = null;
  const contentLines: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("#")) {
      delimiterFromDirective = parseSeparatorDirective(trimmed) ?? delimiterFromDirective;
      continue;
    }
    contentLines.push(trimmed);
  }

  if (contentLines.length === 0) {
    return { columns: [], rows: [] };
  }

  const delimiter: "," | "\t" = delimiterFromDirective ?? (contentLines[0]?.includes("\t") ? "\t" : ",");
  const firstRow = parseDelimitedLine(contentLines[0] ?? "", delimiter);
  const firstRowLower = firstRow.map((cell) => cell.toLowerCase());
  const hasHeader =
    firstRowLower.includes("front") ||
    firstRowLower.includes("back") ||
    firstRowLower.includes("tags") ||
    firstRowLower.includes("tag");

  const columns = hasHeader ? firstRow : firstRow.map((_, index) => `Column ${index + 1}`);
  const dataLines = hasHeader ? contentLines.slice(1) : contentLines;
  const rows = dataLines
    .map((line) => parseDelimitedLine(line, delimiter))
    .filter((cells) => cells.some((cell) => cell.trim().length > 0));

  return { columns, rows };
};

export const DecksWorkspace = () => {
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("decks");
  const [toolbarModal, setToolbarModal] = useState<ToolbarModal>("none");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [noteTypes, setNoteTypes] = useState<NoteType[]>([]);
  const [studyDeckId, setStudyDeckId] = useState("");
  const [studyStage, setStudyStage] = useState<"overview" | "session">("overview");
  const [includeChildren, setIncludeChildren] = useState(true);
  const [excludedDeckIds, setExcludedDeckIds] = useState<string[]>([]);
  const [studyCard, setStudyCard] = useState<StudyCard | null>(null);
  const [studyCounts, setStudyCounts] = useState<DeckCounts>({ newCount: 0, learningCount: 0, reviewCount: 0 });
  const [studyLimits, setStudyLimits] = useState<StudyLimits | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [browseRows, setBrowseRows] = useState<BrowseRow[]>([]);
  const [browseQuery, setBrowseQuery] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [statsRange, setStatsRange] = useState("30d");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [deckName, setDeckName] = useState("");
  const [renameDeckName, setRenameDeckName] = useState("");
  const [newDeckParentId, setNewDeckParentId] = useState("");
  const [addDeckId, setAddDeckId] = useState("");
  const [addNoteTypeId, setAddNoteTypeId] = useState("");
  const [addFields, setAddFields] = useState<Record<string, string>>({});
  const [addTags, setAddTags] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFrontColumn, setImportFrontColumn] = useState("");
  const [importBackColumn, setImportBackColumn] = useState("");
  const [importTagsColumn, setImportTagsColumn] = useState("");
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importPresets, setImportPresets] = useState<ImportPreset[]>([]);
  const [importPresetName, setImportPresetName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [customStudyMode, setCustomStudyMode] = useState<CustomStudyMode>("increase_new");
  const [customStudyLimit, setCustomStudyLimit] = useState(20);
  const [customStudyDays, setCustomStudyDays] = useState(7);
  const [customStudyIncludedTags, setCustomStudyIncludedTags] = useState<string[]>([]);
  const [customStudyExcludedTags, setCustomStudyExcludedTags] = useState<string[]>([]);
  const [customStudyAvailableTags, setCustomStudyAvailableTags] = useState<string[]>([]);
  const [isLoadingCustomStudyTags, setIsLoadingCustomStudyTags] = useState(false);
  const [customStudyStateFilter, setCustomStudyStateFilter] = useState<CustomStateFilter>("all_random");
  const [customStudyReschedule, setCustomStudyReschedule] = useState(true);
  const [isBuildingCustomStudy, setIsBuildingCustomStudy] = useState(false);
  const [customSession, setCustomSession] = useState<{ mode: CustomStudyMode; reschedule: boolean; cards: StudyCard[] } | null>(null);
  const [customSessionQueue, setCustomSessionQueue] = useState<StudyCard[]>([]);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number; imported: number }>({
    processed: 0,
    total: 0,
    imported: 0,
  });
  const [wallOnline, setWallOnline] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [fsrsEnabled, setFsrsEnabled] = useState(false);
  const [fsrsAvailable, setFsrsAvailable] = useState(true);
  const [isTogglingFsrs, setIsTogglingFsrs] = useState(false);
  const [isOptimizingFsrs, setIsOptimizingFsrs] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const windowIdRef = useRef<string>(createWorkspaceWindowId());
  const wallSeenAtRef = useRef<number>(0);
  const autoStudyInitRef = useRef(false);
  const routeDeckId = searchParams.get("deckId") ?? "";
  const appliedRouteDeckIdRef = useRef<string>("");
  const isDesktop = typeof window !== "undefined" && Boolean(window.desktopMeta?.isDesktop || window.desktopApi);

  const safeRun = useCallback((run: () => Promise<void>) => {
    void run().catch((error) => {
      setStatusMessage(error instanceof Error ? error.message : "Action failed.");
    });
  }, []);

  const resetCustomSessionState = useCallback(() => {
    setCustomSession(null);
    setCustomSessionQueue([]);
  }, []);

  const loadDeckData = useCallback(async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load decks.");
    }
    setDecks(payload.decks ?? []);
    setNoteTypes(payload.noteTypes ?? []);
    setFsrsAvailable(payload.fsrsAvailable !== false);
    if (!studyDeckId && (payload.decks?.length ?? 0) > 0) {
      setStudyDeckId(payload.decks[0].id);
    }
    if (!addDeckId && (payload.decks?.length ?? 0) > 0) {
      setAddDeckId(payload.decks[0].id);
    }
    if (!addNoteTypeId && (payload.noteTypes?.length ?? 0) > 0) {
      setAddNoteTypeId(payload.noteTypes[0].id);
    }
  }, [addDeckId, addNoteTypeId, studyDeckId]);

  const loadStudyCard = useCallback(async (deckId?: string) => {
    const effectiveDeckId = deckId ?? studyDeckId;
    if (!effectiveDeckId) {
      setStudyCard(null);
      return;
    }
    const params = new URLSearchParams({
      deckId: effectiveDeckId,
      includeChildren: includeChildren ? "1" : "0",
      excludedDeckIds: excludedDeckIds.join(","),
    });
    const response = await fetch(`/api/decks/study?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load study session.");
    }
    setStudyCard(payload.card);
    setStudyCounts(payload.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 });
    setStudyLimits(payload.limits ?? null);
    setShowAnswer(false);
  }, [excludedDeckIds, includeChildren, studyDeckId]);

  const loadBrowse = useCallback(async () => {
    const params = new URLSearchParams();
    if (browseQuery.trim()) {
      params.set("q", browseQuery.trim());
    }
    if (studyDeckId) {
      params.set("deckId", studyDeckId);
      params.set("includeChildren", includeChildren ? "1" : "0");
      if (excludedDeckIds.length > 0) {
        params.set("excludedDeckIds", excludedDeckIds.join(","));
      }
    }
    const response = await fetch(`/api/decks/browse?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load browser.");
    }
    setBrowseRows(payload.rows ?? []);
  }, [browseQuery, excludedDeckIds, includeChildren, studyDeckId]);

  const loadStats = useCallback(async () => {
    const params = new URLSearchParams({ range: statsRange });
    if (studyDeckId) {
      params.set("deckId", studyDeckId);
      params.set("includeChildren", includeChildren ? "1" : "0");
    }
    const response = await fetch(`/api/decks/stats?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load stats.");
    }
    setStats(payload);
  }, [includeChildren, statsRange, studyDeckId]);

  const loadImportPresets = useCallback(async () => {
    const response = await fetch("/api/decks/import-presets", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load import presets.");
    }
    setImportPresets(payload.presets ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadDeckData(), loadImportPresets()]);
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to load decks workspace.");
      }
    })();
  }, [loadDeckData, loadImportPresets]);

  useEffect(() => {
    if (!routeDeckId || decks.length === 0 || appliedRouteDeckIdRef.current === routeDeckId) {
      return;
    }
    if (decks.some((deck) => deck.id === routeDeckId)) {
      appliedRouteDeckIdRef.current = routeDeckId;
      resetCustomSessionState();
      setStudyDeckId(routeDeckId);
      setView("study");
      setStudyStage("overview");
      safeRun(() => loadStudyCard(routeDeckId));
    }
  }, [decks, loadStudyCard, resetCustomSessionState, routeDeckId, safeRun]);

  useEffect(() => {
    if (autoStudyInitRef.current || routeDeckId || decks.length === 0) {
      return;
    }
    const selectedId = decks.some((deck) => deck.id === studyDeckId) ? studyDeckId : decks[0]?.id ?? "";
    if (!selectedId) {
      return;
    }
    autoStudyInitRef.current = true;
    if (selectedId !== studyDeckId) {
      setStudyDeckId(selectedId);
    }
    resetCustomSessionState();
    setView("study");
    setStudyStage("overview");
    safeRun(() => loadStudyCard(selectedId));
  }, [decks, loadStudyCard, resetCustomSessionState, routeDeckId, safeRun, studyDeckId]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }
    const channel = new BroadcastChannel(workspaceChannelName);
    channelRef.current = channel;

    const emit = (event: WorkspaceEnvelope["event"]) => {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "decks",
        sentAt: Date.now(),
        event,
      };
      channel.postMessage(payload);
    };

    const sendPresence = () => emit({ type: "presence" });
    sendPresence();
    const heartbeat = window.setInterval(sendPresence, 12_000);
    const wallStatusTick = window.setInterval(() => {
      setWallOnline(Date.now() - wallSeenAtRef.current < 20_000);
    }, 2_000);
    const notifyDecksClosed = () => emit({ type: "decks_closed" });
    window.addEventListener("pagehide", notifyDecksClosed);
    window.addEventListener("beforeunload", notifyDecksClosed);

    channel.onmessage = (message: MessageEvent<WorkspaceEnvelope>) => {
      const payload = message.data;
      if (!payload || payload.sourceId === windowIdRef.current) {
        return;
      }

      if (payload.sourceRole === "wall" && payload.event.type === "presence") {
        wallSeenAtRef.current = payload.sentAt;
        setWallOnline(true);
      }

      if (payload.event.type === "open_window" && payload.event.target === "decks") {
        window.focus();
        return;
      }

      if (payload.event.type === "deck_selection") {
        const deckId = payload.event.deckId;
        if (deckId !== studyDeckId) {
          resetCustomSessionState();
          setStudyDeckId(deckId);
          setView("study");
          setStudyStage("overview");
          safeRun(() => loadStudyCard(deckId));
        }
        return;
      }

      if (payload.event.type === "decks_changed") {
        safeRun(loadDeckData);
      }
    };

    return () => {
      window.clearInterval(heartbeat);
      window.clearInterval(wallStatusTick);
      window.removeEventListener("pagehide", notifyDecksClosed);
      window.removeEventListener("beforeunload", notifyDecksClosed);
      channel.close();
      channelRef.current = null;
    };
  }, [loadDeckData, loadStudyCard, resetCustomSessionState, safeRun, studyDeckId]);

  useEffect(() => {
    if (!channelRef.current) {
      return;
    }
    if (!studyDeckId) {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "decks",
        sentAt: Date.now(),
        event: { type: "deck_selection_cleared" },
      };
      channelRef.current.postMessage(payload);
      return;
    }
    const selectedDeck = decks.find((deck) => deck.id === studyDeckId);
    if (!selectedDeck) {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "decks",
        sentAt: Date.now(),
        event: { type: "deck_selection_cleared" },
      };
      channelRef.current.postMessage(payload);
      return;
    }
    const payload: WorkspaceEnvelope = {
      sourceId: windowIdRef.current,
      sourceRole: "decks",
      sentAt: Date.now(),
      event: { type: "deck_selection", deckId: selectedDeck.id, deckName: selectedDeck.name },
    };
    channelRef.current.postMessage(payload);
  }, [decks, studyDeckId]);

  useEffect(() => {
    const selectedDeck = decks.find((deck) => deck.id === studyDeckId);
    setRenameDeckName(selectedDeck?.name ?? "");
    setFsrsEnabled(selectedDeck?.scheduler_mode === "fsrs");
  }, [decks, studyDeckId]);

  useEffect(() => {
    setCustomStudyIncludedTags([]);
    setCustomStudyExcludedTags([]);
    setCustomStudyAvailableTags([]);
  }, [studyDeckId]);

  useEffect(() => {
    setCustomStudyReschedule(customStudyMode !== "preview_new");
    if (customStudyMode === "ahead") {
      setCustomStudyDays(2);
    } else if (customStudyMode === "forgotten") {
      setCustomStudyDays(7);
    } else if (customStudyMode === "preview_new") {
      setCustomStudyDays(7);
    }
  }, [customStudyMode]);

  useEffect(() => {
    if (!customSession) {
      return;
    }
    const nextCard = customSessionQueue[0] ?? null;
    if (!nextCard) {
      setCustomSession(null);
      setCustomSessionQueue([]);
      setStudyStage("overview");
      setStatusMessage("Custom Study Session complete. Returned to deck overview.");
      safeRun(loadStudyCard);
      return;
    }
    setStudyCard(nextCard);
    setShowAnswer(false);
  }, [customSession, customSessionQueue, loadStudyCard, safeRun]);

  const selectedNoteType = useMemo(() => noteTypes.find((entry) => entry.id === addNoteTypeId) ?? null, [addNoteTypeId, noteTypes]);
  const selectedRow = useMemo(() => browseRows.find((row) => row.id === selectedRowId) ?? null, [browseRows, selectedRowId]);
  const selectedStudyDeck = useMemo(() => decks.find((deck) => deck.id === studyDeckId) ?? null, [decks, studyDeckId]);
  const childDecks = useMemo(() => decks.filter((deck) => deck.parent_id === studyDeckId), [decks, studyDeckId]);
  const isCustomSessionActive = customSession !== null;

  const emitDecksChanged = () => {
    if (!channelRef.current) {
      return;
    }
    const payload: WorkspaceEnvelope = {
      sourceId: windowIdRef.current,
      sourceRole: "decks",
      sentAt: Date.now(),
      event: { type: "decks_changed" },
    };
    channelRef.current.postMessage(payload);
  };

  const handleCreateDeck = async () => {
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deckName, parentId: newDeckParentId || null }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to create deck.");
    }
    setDeckName("");
    setNewDeckParentId("");
    await loadDeckData();
    emitDecksChanged();
    setStatusMessage("Deck created.");
  };

  const handleClearDeck = async () => {
    if (!studyDeckId) {
      throw new Error("Select a deck first.");
    }
    const selectedDeck = decks.find((entry) => entry.id === studyDeckId);
    const confirmed = window.confirm(`Delete all cards and notes in "${selectedDeck?.name ?? "this deck"}"?`);
    if (!confirmed) {
      return;
    }
    const response = await fetch(`/api/decks/${studyDeckId}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to clear deck.");
    }
    setSelectedRowId("");
    setSelectedRowIds([]);
    setStudyCard(null);
    setShowAnswer(false);
    await Promise.all([loadDeckData(), loadBrowse(), loadStats()]);
    emitDecksChanged();
    setStatusMessage("Deck cleared.");
  };

  const handleRenameDeck = async () => {
    if (!studyDeckId) {
      throw new Error("Select a deck first.");
    }
    const nextName = renameDeckName.trim();
    if (!nextName) {
      throw new Error("Deck name cannot be empty.");
    }
    const response = await fetch(`/api/decks/${studyDeckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to rename deck.");
    }
    await loadDeckData();
    emitDecksChanged();
    setStatusMessage("Deck renamed.");
  };

  const handleCreateNote = async () => {
    const response = await fetch("/api/decks/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: addDeckId,
        noteTypeId: addNoteTypeId,
        fields: addFields,
        tags: addTags
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to create note.");
    }
    setToolbarModal("none");
    setAddFields({});
    setAddTags("");
    await loadDeckData();
    emitDecksChanged();
    setStatusMessage("Note created.");
  };

  const handleRateCard = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!studyCard) {
      return;
    }
    if (isCustomSessionActive) {
      if (customSession?.reschedule) {
        const response = await fetch("/api/decks/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: studyCard.id, rating, studyDeckId, sessionType: "custom" }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to rate card.");
        }
      }
      setCustomSessionQueue((previous) => previous.filter((card) => card.id !== studyCard.id));
      if (customSession?.reschedule) {
        await loadDeckData();
        emitDecksChanged();
      }
      return;
    }
    const response = await fetch("/api/decks/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: studyCard.id, rating, studyDeckId, sessionType: "default" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to rate card.");
    }
    await Promise.all([loadStudyCard(), loadDeckData()]);
    emitDecksChanged();
  };

  const loadCustomStudyTags = useCallback(async () => {
    if (!studyDeckId) {
      setCustomStudyAvailableTags([]);
      return;
    }
    setIsLoadingCustomStudyTags(true);
    try {
      const params = new URLSearchParams({
        deckId: studyDeckId,
        includeChildren: includeChildren ? "1" : "0",
        excludedDeckIds: excludedDeckIds.join(","),
      });
      const response = await fetch(`/api/decks/tags?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load tags.");
      }
      setCustomStudyAvailableTags(Array.isArray(payload.tags) ? payload.tags.map((tag: unknown) => String(tag)) : []);
    } finally {
      setIsLoadingCustomStudyTags(false);
    }
  }, [excludedDeckIds, includeChildren, studyDeckId]);

  const openCustomStudyTagsModal = () => {
    setToolbarModal("customStudyTags");
    safeRun(loadCustomStudyTags);
  };

  const getCustomTagMode = (tag: string) => {
    if (customStudyIncludedTags.includes(tag)) {
      return "include";
    }
    if (customStudyExcludedTags.includes(tag)) {
      return "exclude";
    }
    return "none";
  };

  const cycleCustomTagMode = (tag: string) => {
    const mode = getCustomTagMode(tag);
    if (mode === "none") {
      setCustomStudyIncludedTags((previous) => [...previous, tag]);
      setCustomStudyExcludedTags((previous) => previous.filter((entry) => entry !== tag));
      return;
    }
    if (mode === "include") {
      setCustomStudyIncludedTags((previous) => previous.filter((entry) => entry !== tag));
      setCustomStudyExcludedTags((previous) => [...previous, tag]);
      return;
    }
    setCustomStudyExcludedTags((previous) => previous.filter((entry) => entry !== tag));
  };

  const handleCreateCustomStudy = async () => {
    if (!studyDeckId) {
      throw new Error("Select a deck first.");
    }
    setIsBuildingCustomStudy(true);
    try {
      const response = await fetch("/api/decks/custom-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: studyDeckId,
          includeChildren,
          excludedDeckIds,
          mode: customStudyMode,
          limit: customStudyLimit,
          days: customStudyDays,
          stateFilter: customStudyStateFilter,
          tagsInclude: customStudyIncludedTags,
          tagsExclude: customStudyExcludedTags,
          reschedule: customStudyReschedule,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create custom study session.");
      }
      if (payload.override?.applied) {
        setToolbarModal("none");
        resetCustomSessionState();
        setStudyStage("session");
        await Promise.all([loadDeckData(), loadStudyCard()]);
        setStatusMessage(
          customStudyMode === "increase_new"
            ? `Today's new-card limit increased by ${payload.override.increment}.`
            : `Today's review-card limit increased by ${payload.override.increment}.`,
        );
        return;
      }
      const session = (payload.session ?? null) as CustomStudySessionPayload | null;
      if (!session) {
        throw new Error("No custom session returned.");
      }
      const cards: StudyCard[] = (session.cards ?? []).map((card) => ({
        id: card.id,
        prompt: card.prompt,
        answer: card.answer,
      }));
      setCustomSession({ mode: session.mode, reschedule: session.reschedule, cards });
      setCustomSessionQueue(cards);
      setStudyCounts(session.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 });
      setToolbarModal("none");
      setStudyStage("session");
      setShowAnswer(false);
      if (cards.length === 0) {
        setStudyCard(null);
        setStatusMessage("No cards matched this custom study selection.");
      } else {
        setStudyCard(cards[0] ?? null);
        setStatusMessage(`Custom Study Session ready with ${cards.length} cards.`);
      }
    } finally {
      setIsBuildingCustomStudy(false);
    }
  };

  const handleToggleFsrs = async (enabled: boolean) => {
    if (!studyDeckId) {
      throw new Error("Select a deck first.");
    }
    if (!fsrsAvailable) {
      throw new Error("FSRS requires the latest deck migration. Apply migrations, then try again.");
    }
    setIsTogglingFsrs(true);
    try {
      const response = await fetch(`/api/decks/${studyDeckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedulerMode: enabled ? "fsrs" : "legacy" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setFsrsAvailable(false);
        }
        throw new Error(payload.error ?? "Failed to update scheduler.");
      }
      setFsrsEnabled(enabled);
      await loadDeckData();
      setStatusMessage(enabled ? "FSRS enabled for this deck." : "FSRS disabled for this deck.");
    } finally {
      setIsTogglingFsrs(false);
    }
  };

  const handleOptimizeFsrs = async () => {
    if (!studyDeckId) {
      throw new Error("Select a deck first.");
    }
    if (!fsrsAvailable) {
      throw new Error("FSRS requires the latest deck migration. Apply migrations, then try again.");
    }
    setIsOptimizingFsrs(true);
    try {
      const response = await fetch(`/api/decks/${studyDeckId}/fsrs/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setFsrsAvailable(false);
        }
        throw new Error(payload.error ?? "Failed to optimize FSRS.");
      }
      setFsrsEnabled(true);
      await loadDeckData();
      setStatusMessage(`FSRS optimized using ${payload.optimization?.reviewsAnalyzed ?? 0} reviews.`);
    } finally {
      setIsOptimizingFsrs(false);
    }
  };

  const handleBrowsePatch = async (patch: Record<string, unknown>) => {
    if (!selectedRow) {
      return;
    }
    const response = await fetch(`/api/decks/cards/${selectedRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to update row.");
    }
    await loadBrowse();
  };

  const handleBulk = async (action: "suspend" | "unsuspend" | "delete") => {
    if (selectedRowIds.length === 0) {
      return;
    }
    const response = await fetch("/api/decks/browse/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardIds: selectedRowIds, action }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to run bulk action.");
    }
    setSelectedRowIds([]);
    await loadBrowse();
    emitDecksChanged();
  };

  const applyPreset = (preset: ImportPreset) => {
    setAddDeckId(preset.mapping.deckId);
    setAddNoteTypeId(preset.mapping.noteTypeId);
    setImportFrontColumn(preset.mapping.frontColumn);
    setImportBackColumn(preset.mapping.backColumn);
    setImportTagsColumn(preset.mapping.tagsColumn);
  };

  const handleSaveImportPreset = async () => {
    const response = await fetch("/api/decks/import-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: importPresetName,
        mapping: {
          deckId: addDeckId,
          noteTypeId: addNoteTypeId,
          frontColumn: importFrontColumn,
          backColumn: importBackColumn,
          tagsColumn: importTagsColumn,
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to save preset.");
    }
    setImportPresetName("");
    await loadImportPresets();
  };

  const handleImportFile = async () => {
    if (!importFile) {
      throw new Error("Choose a CSV or TXT file.");
    }
    const raw = await importFile.text();
    const parsed = parseImportText(raw);
    if (parsed.rows.length === 0) {
      throw new Error("Import file has no card rows.");
    }
    const frontIndex = parsed.columns.indexOf(importFrontColumn);
    const backIndex = parsed.columns.indexOf(importBackColumn);
    const tagsIndex = parsed.columns.indexOf(importTagsColumn);
    if (frontIndex < 0 || backIndex < 0) {
      throw new Error("Pick valid Front and Back columns.");
    }

    const rowsToImport = parsed.rows.filter((row) => {
      const front = row[frontIndex] ?? "";
      const back = row[backIndex] ?? "";
      return Boolean(front.trim() || back.trim());
    });
    setIsImporting(true);
    setImportProgress({ processed: 0, total: rowsToImport.length, imported: 0 });

    let imported = 0;
    try {
      for (const [index, row] of rowsToImport.entries()) {
        const front = row[frontIndex] ?? "";
        const back = row[backIndex] ?? "";
        const tags = tagsIndex >= 0 ? (row[tagsIndex] ?? "").split(";").map((entry) => entry.trim()).filter(Boolean) : [];
        const noteTypeFields = toStringArray(selectedNoteType?.fields);
        const fieldKeyA = noteTypeFields[0] ?? "Front";
        const fieldKeyB = noteTypeFields[1] ?? "Back";
        const response = await fetch("/api/decks/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId: addDeckId,
            noteTypeId: addNoteTypeId,
            fields: { [fieldKeyA]: front, [fieldKeyB]: back },
            tags,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Import failed.");
        }
        imported += 1;
        setImportProgress({ processed: index + 1, total: rowsToImport.length, imported });
      }
    } finally {
      setIsImporting(false);
    }
    setToolbarModal("none");
    setImportFile(null);
    await loadDeckData();
    emitDecksChanged();
    setStatusMessage(`Import complete: ${imported} notes added.`);
  };

  const switchView = (nextView: View) => {
    setView(nextView);
    if (nextView === "study") {
      resetCustomSessionState();
      setStudyStage("overview");
      safeRun(loadStudyCard);
    }
    if (nextView === "browse") {
      safeRun(loadBrowse);
    }
    if (nextView === "stats") {
      safeRun(loadStats);
    }
  };

  const openWallWindow = () => {
    window.open("/wall", "idea-wall-wall-window", "width=1460,height=920");
    if (!channelRef.current) {
      return;
    }
    const payload: WorkspaceEnvelope = {
      sourceId: windowIdRef.current,
      sourceRole: "decks",
      sentAt: Date.now(),
      event: { type: "open_window", target: "wall" },
    };
    channelRef.current.postMessage(payload);
  };

  const handleBackToWall = () => {
    if (channelRef.current) {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "decks",
        sentAt: Date.now(),
        event: { type: "open_window", target: "wall" },
      };
      channelRef.current.postMessage(payload);
    }

    const opener = window.opener as Window | null;
    const canFocusOpener = Boolean(opener && !opener.closed);
    if (canFocusOpener) {
      try {
        opener?.focus();
      } catch {
        // Ignore focus errors and use route fallback.
      }
    }

    window.close();
    window.setTimeout(() => {
      if (!window.closed) {
        window.location.href = "/wall";
      }
    }, 120);
  };

  const startStudyNow = () => {
    resetCustomSessionState();
    setStudyStage("session");
    safeRun(loadStudyCard);
  };

  return (
    <main className="route-shell text-[var(--color-text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-8 pt-4 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-3 shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)]">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => switchView("decks")}>Decks</Button>
            <Button onClick={() => setToolbarModal("add")}>Add</Button>
            <Button onClick={() => setToolbarModal("import")}>Import File</Button>
            <Button onClick={() => switchView("browse")}>Browse</Button>
            <Button onClick={() => switchView("stats")}>Stats</Button>
          </div>
          <div className="flex items-center gap-2">
            {isDesktop && (
              <Button size="sm" variant="secondary" onClick={openWallWindow}>
                Open Wall Window
              </Button>
            )}
            <span
              className={`rounded-[var(--radius-md)] border px-2 py-1 text-[11px] ${
                wallOnline
                  ? "border-emerald-300/70 bg-emerald-100/70 text-emerald-900"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              }`}
            >
              Wall {wallOnline ? "Online" : "Offline"}
            </span>
            <button
              type="button"
              onClick={handleBackToWall}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold"
            >
              Back to Wall
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="text-lg font-semibold">Decks</h2>
            <div className="mt-3 space-y-2">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => {
                    resetCustomSessionState();
                    setStudyDeckId(deck.id);
                    setView("study");
                    setStudyStage("overview");
                    safeRun(() => loadStudyCard(deck.id));
                  }}
                  className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm ${
                    studyDeckId === deck.id ? "border-[var(--color-focus)] bg-[var(--color-accent-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <p className="font-semibold">{deck.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    New {deck.counts.newCount} | Learning {deck.counts.learningCount} | Review {deck.counts.reviewCount}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
              <FieldLabel htmlFor="deck-name">Create deck</FieldLabel>
              <TextField id="deck-name" value={deckName} onChange={(event) => setDeckName(event.target.value)} placeholder="Deck name" />
              <SelectField value={newDeckParentId} onChange={(event) => setNewDeckParentId(event.target.value)}>
                <option value="">No parent</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </SelectField>
              <Button onClick={() => safeRun(handleCreateDeck)} disabled={!deckName.trim()}>
                Create Deck
              </Button>
              <FieldLabel htmlFor="rename-deck-name">Rename selected deck</FieldLabel>
              <TextField
                id="rename-deck-name"
                value={renameDeckName}
                onChange={(event) => setRenameDeckName(event.target.value)}
                placeholder="New deck name"
                disabled={!studyDeckId}
              />
              <Button onClick={() => safeRun(handleRenameDeck)} disabled={!studyDeckId || !renameDeckName.trim()}>
                Rename Deck
              </Button>
              <Button variant="danger" onClick={() => safeRun(handleClearDeck)} disabled={!studyDeckId}>
                Clear Selected Deck
              </Button>
            </div>
          </aside>

          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            {view === "study" && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">Study Deck</p>
                  <h2 className="mt-1 text-xl font-semibold">{selectedStudyDeck?.name ?? "Select a deck"}</h2>
                </div>
                {studyStage === "overview" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                        <p className="text-xs text-[var(--color-text-muted)]">New</p>
                        <p className="mt-1 text-2xl font-semibold">{studyCounts.newCount}</p>
                      </article>
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                        <p className="text-xs text-[var(--color-text-muted)]">Learning</p>
                        <p className="mt-1 text-2xl font-semibold">{studyCounts.learningCount}</p>
                      </article>
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                        <p className="text-xs text-[var(--color-text-muted)]">To Review</p>
                        <p className="mt-1 text-2xl font-semibold">{studyCounts.reviewCount}</p>
                      </article>
                    </div>
                    {studyLimits && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Today limits: New {studyLimits.remainingNew}/{studyLimits.effectiveNewLimit} remaining, Review {studyLimits.remainingReview}/{studyLimits.effectiveReviewLimit} remaining.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={startStudyNow} disabled={!studyDeckId}>
                        Study Now
                      </Button>
                      <Button variant="secondary" onClick={() => setToolbarModal("customStudy")} disabled={!studyDeckId}>
                        Custom Study
                      </Button>
                      <Button variant="ghost" onClick={() => setToolbarModal("options")} disabled={!studyDeckId}>
                        Options
                      </Button>
                    </div>
                  </div>
                )}
                {studyStage === "session" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={includeChildren} onChange={(event) => setIncludeChildren(event.target.checked)} />
                      Include child decks
                    </label>
                    {childDecks.length > 0 && (
                      <SelectField
                        value=""
                        onChange={(event) => {
                          const id = event.target.value;
                          if (id && !excludedDeckIds.includes(id)) {
                            setExcludedDeckIds((previous) => [...previous, id]);
                          }
                        }}
                        className="max-w-64"
                      >
                        <option value="">Exclude child deck...</option>
                        {childDecks.map((deck) => (
                          <option key={deck.id} value={deck.id}>
                            {deck.name}
                          </option>
                        ))}
                      </SelectField>
                    )}
                    {excludedDeckIds.length > 0 && (
                      <Button variant="ghost" onClick={() => setExcludedDeckIds([])}>
                        Clear excluded
                      </Button>
                    )}
                  </div>
                )}
                {studyStage === "session" && (
                  <>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Queue: New {studyCounts.newCount} | Learning {studyCounts.learningCount} | Review {studyCounts.reviewCount}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (isCustomSessionActive) {
                            setStudyCard(customSessionQueue[0] ?? null);
                            setShowAnswer(false);
                            return;
                          }
                          safeRun(loadStudyCard);
                        }}
                        disabled={!studyDeckId}
                      >
                        Refresh Queue
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          resetCustomSessionState();
                          setStudyStage("overview");
                          safeRun(loadStudyCard);
                        }}
                      >
                        Back to Overview
                      </Button>
                    </div>
                    {studyCard ? (
                      <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
                        <p className="text-sm font-semibold text-[var(--color-text-muted)]">Front</p>
                        <p className="mt-2 text-xl">{studyCard.prompt}</p>
                        {showAnswer && (
                          <>
                            <p className="mt-5 text-sm font-semibold text-[var(--color-text-muted)]">Back</p>
                            <p className="mt-2 text-lg">{studyCard.answer}</p>
                          </>
                        )}
                      </article>
                    ) : (
                      <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm">
                        {isCustomSessionActive ? "No cards remaining in this Custom Study Session." : "No due cards in this deck selection."}
                      </p>
                    )}
                    {studyCard && !showAnswer && <Button onClick={() => setShowAnswer(true)}>Show Answer</Button>}
                    {studyCard && showAnswer && (
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => safeRun(() => handleRateCard("again"))}>Again</Button>
                        <Button onClick={() => safeRun(() => handleRateCard("hard"))}>Hard</Button>
                        <Button onClick={() => safeRun(() => handleRateCard("good"))}>Good</Button>
                        <Button onClick={() => safeRun(() => handleRateCard("easy"))}>Easy</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {view === "browse" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TextField value={browseQuery} onChange={(event) => setBrowseQuery(event.target.value)} placeholder="Search cards..." className="max-w-sm" />
                  <Button onClick={() => safeRun(loadBrowse)}>Search</Button>
                  <Button variant="ghost" onClick={() => safeRun(() => handleBulk("suspend"))}>
                    Suspend
                  </Button>
                  <Button variant="ghost" onClick={() => safeRun(() => handleBulk("unsuspend"))}>
                    Unsuspend
                  </Button>
                  <Button variant="danger" onClick={() => safeRun(() => handleBulk("delete"))}>
                    Delete
                  </Button>
                </div>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="max-h-[30rem] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[var(--color-surface-muted)]">
                        <tr>
                          <th className="px-2 py-2"></th>
                          <th className="px-2 py-2">Prompt</th>
                          <th className="px-2 py-2">Deck</th>
                          <th className="px-2 py-2">Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {browseRows.map((row) => (
                          <tr key={row.id} className="border-t border-[var(--color-border)]">
                            <td className="px-2 py-2">
                              <input
                                type="checkbox"
                                checked={selectedRowIds.includes(row.id)}
                                onChange={(event) =>
                                  setSelectedRowIds((previous) =>
                                    event.target.checked ? [...previous, row.id] : previous.filter((entry) => entry !== row.id),
                                  )
                                }
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button type="button" onClick={() => setSelectedRowId(row.id)} className="text-left hover:underline">
                                {row.prompt}
                              </button>
                            </td>
                            <td className="px-2 py-2">{row.deckName}</td>
                            <td className="px-2 py-2">{row.due_at ? row.due_at.slice(0, 10) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    {selectedRow ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{selectedRow.noteTypeName}</p>
                        <TextAreaField value={selectedRow.prompt} onChange={(event) => setBrowseRows((previous) => previous.map((entry) => (entry.id === selectedRow.id ? { ...entry, prompt: event.target.value } : entry)))} rows={3} />
                        <TextAreaField value={selectedRow.answer} onChange={(event) => setBrowseRows((previous) => previous.map((entry) => (entry.id === selectedRow.id ? { ...entry, answer: event.target.value } : entry)))} rows={4} />
                        <div className="flex gap-2">
                          <Button onClick={() => safeRun(() => handleBrowsePatch({ prompt: selectedRow.prompt, answer: selectedRow.answer }))}>Save</Button>
                          <Button variant="ghost" onClick={() => safeRun(() => handleBrowsePatch({ suspended: !Boolean(selectedRow.note?.suspended) }))}>
                            {selectedRow.note?.suspended ? "Unsuspend" : "Suspend"}
                          </Button>
                          <Button variant="ghost" onClick={() => safeRun(() => handleBrowsePatch({ flagged: !Boolean(selectedRow.note?.flagged) }))}>
                            {selectedRow.note?.flagged ? "Unflag" : "Flag"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-text-muted)]">Select a row to edit.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === "stats" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <SelectField value={statsRange} onChange={(event) => setStatsRange(event.target.value)} className="max-w-52">
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                    <option value="1y">1 year</option>
                    <option value="deck_life">Deck life</option>
                  </SelectField>
                  <Button onClick={() => safeRun(loadStats)}>Refresh</Button>
                </div>
                {stats ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Total Cards</p><p className="text-xl font-semibold">{stats.summary.totalCards}</p></article>
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Reviews</p><p className="text-xl font-semibold">{stats.summary.totalReviews}</p></article>
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Retention</p><p className="text-xl font-semibold">{stats.summary.retentionRate}%</p></article>
                      <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="text-xs text-[var(--color-text-muted)]">Due Tomorrow</p><p className="text-xl font-semibold">{stats.summary.dueTomorrow}</p></article>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                      <p className="text-sm font-semibold">7-day workload forecast</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {stats.workload7.map((entry) => (
                          <li key={entry.day} className="flex items-center justify-between">
                            <span>{entry.day}</span>
                            <span>{entry.due}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">No stats yet.</p>
                )}
              </div>
            )}

            {view === "decks" && <p className="text-sm text-[var(--color-text-muted)]">Choose a deck on the left to start Study Now.</p>}
          </section>
        </div>

        {statusMessage && <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">{statusMessage}</p>}
      </section>

      <ModalShell
        open={toolbarModal === "options"}
        onClose={() => setToolbarModal("none")}
        title="Deck Options"
        description="Manage deck settings and maintenance actions."
        maxWidthClassName="max-w-xl"
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            Selected deck: <span className="font-semibold text-[var(--color-text)]">{selectedStudyDeck?.name ?? "None"}</span>
          </p>
          <div>
            <FieldLabel htmlFor="deck-options-rename">Deck name</FieldLabel>
            <TextField
              id="deck-options-rename"
              value={renameDeckName}
              onChange={(event) => setRenameDeckName(event.target.value)}
              placeholder="New deck name"
              disabled={!studyDeckId}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => safeRun(handleRenameDeck)} disabled={!studyDeckId || !renameDeckName.trim()}>
              Save Name
            </Button>
            <Button variant="danger" onClick={() => safeRun(handleClearDeck)} disabled={!studyDeckId}>
              Clear Deck
            </Button>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Modern Scheduler (FSRS)</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Use a memory-model scheduler instead of legacy ease/interval math.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fsrsEnabled}
                  onChange={(event) => safeRun(() => handleToggleFsrs(event.target.checked))}
                  disabled={!studyDeckId || isTogglingFsrs || !fsrsAvailable}
                />
                <span>{isTogglingFsrs ? "Updating..." : "Enable FSRS"}</span>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => safeRun(handleOptimizeFsrs)}
                disabled={!studyDeckId || isOptimizingFsrs || !fsrsAvailable}
              >
                {isOptimizingFsrs ? "Optimizing..." : "Optimize"}
              </Button>
              <p className="text-xs text-[var(--color-text-muted)]">
                Analyze your review history and tune intervals for this deck.
              </p>
            </div>
            {!fsrsAvailable && (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                FSRS is unavailable until migration `202603040002_deck_scheduler_fsrs.sql` is applied.
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Last optimized:{" "}
              {selectedStudyDeck?.fsrs_optimized_at
                ? new Date(selectedStudyDeck.fsrs_optimized_at).toLocaleString()
                : "Never"}
            </p>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={toolbarModal === "customStudy"}
        onClose={() => setToolbarModal("none")}
        title="Custom Study"
        description="Temporarily bypass limits or create a focused filtered session."
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--color-text)]">Mode</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "increase_new"}
                onChange={() => setCustomStudyMode("increase_new")}
                className="mt-0.5"
              />
              <span className="text-sm">Increase Today&apos;s New Card Limit</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "increase_review"}
                onChange={() => setCustomStudyMode("increase_review")}
                className="mt-0.5"
              />
              <span className="text-sm">Increase Today&apos;s Review Card Limit</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "forgotten"}
                onChange={() => setCustomStudyMode("forgotten")}
                className="mt-0.5"
              />
              <span className="text-sm">Review Forgotten Cards</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "ahead"}
                onChange={() => setCustomStudyMode("ahead")}
                className="mt-0.5"
              />
              <span className="text-sm">Review Ahead</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "preview_new"}
                onChange={() => setCustomStudyMode("preview_new")}
                className="mt-0.5"
              />
              <span className="text-sm">Preview New Cards</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
              <input
                type="radio"
                name="custom-study-mode"
                checked={customStudyMode === "state_tag"}
                onChange={() => setCustomStudyMode("state_tag")}
                className="mt-0.5"
              />
              <span className="text-sm">Study by Card State or Tag</span>
            </label>
          </fieldset>

          {(customStudyMode === "increase_new" || customStudyMode === "increase_review" || customStudyMode === "state_tag") && (
            <div>
              {customStudyMode === "increase_new" && (
                <p className="mb-1 text-xs text-[var(--color-text-muted)]">Available new cards: {studyCounts.newCount}</p>
              )}
              {customStudyMode === "increase_review" && (
                <p className="mb-1 text-xs text-[var(--color-text-muted)]">Available review cards: {studyCounts.reviewCount}</p>
              )}
              <div className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                <span>
                  {customStudyMode === "increase_new"
                    ? "Add"
                    : customStudyMode === "increase_review"
                      ? "Add"
                      : "Study up to"}
                </span>
                <TextField
                  type="number"
                  min={1}
                  max={500}
                  value={String(customStudyLimit)}
                  onChange={(event) => setCustomStudyLimit(Math.max(1, Number(event.target.value || "1")))}
                  className="w-20"
                />
                <span>
                  {customStudyMode === "increase_new"
                    ? "new cards to today’s study limit"
                    : customStudyMode === "increase_review"
                      ? "review cards to today’s study limit"
                      : "matching cards"}
                </span>
              </div>
            </div>
          )}

          {(customStudyMode === "forgotten" || customStudyMode === "ahead" || customStudyMode === "preview_new") && (
            <div>
              <div className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                <span>
                  {customStudyMode === "forgotten"
                    ? "Review cards forgotten in the last"
                    : customStudyMode === "ahead"
                      ? "Review cards due in the next"
                      : "Preview new cards added in the last"}
                </span>
                <TextField
                  id="custom-study-days"
                  type="number"
                  min={1}
                  max={365}
                  value={String(customStudyDays)}
                  onChange={(event) => setCustomStudyDays(Math.max(1, Number(event.target.value || "1")))}
                  className="w-20"
                />
                <span>days</span>
              </div>
            </div>
          )}

          {customStudyMode === "state_tag" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Select</FieldLabel>
                <div className="space-y-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-study-state-filter"
                      checked={customStudyStateFilter === "all_random"}
                      onChange={() => setCustomStudyStateFilter("all_random")}
                      className="mt-0.5"
                    />
                    <span>All cards in random order</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-study-state-filter"
                      checked={customStudyStateFilter === "all_added"}
                      onChange={() => setCustomStudyStateFilter("all_added")}
                      className="mt-0.5"
                    />
                    <span>All cards in order added</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-study-state-filter"
                      checked={customStudyStateFilter === "new"}
                      onChange={() => setCustomStudyStateFilter("new")}
                      className="mt-0.5"
                    />
                    <span>New cards only</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-study-state-filter"
                      checked={customStudyStateFilter === "due"}
                      onChange={() => setCustomStudyStateFilter("due")}
                      className="mt-0.5"
                    />
                    <span>Due cards only</span>
                  </label>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={openCustomStudyTagsModal}>
                    Choose Tags
                  </Button>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Included: {customStudyIncludedTags.length} | Excluded: {customStudyExcludedTags.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {customStudyMode !== "increase_new" && customStudyMode !== "increase_review" && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={customStudyReschedule}
                  onChange={(event) => setCustomStudyReschedule(event.target.checked)}
                />
                Reschedule cards based on my answers in this deck
              </label>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Preview sessions default to no rescheduling. Other filtered sessions default to rescheduling.
              </p>
            </div>
          )}

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            {customStudyMode === "increase_new" || customStudyMode === "increase_review"
              ? "This updates today's limits for the selected deck and resumes normal Study Now."
              : "Creating a new custom session replaces the previous Custom Study Session deck selection."}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setToolbarModal("none")} disabled={isBuildingCustomStudy}>
              Cancel
            </Button>
            <Button onClick={() => safeRun(handleCreateCustomStudy)} disabled={!studyDeckId || isBuildingCustomStudy}>
              {isBuildingCustomStudy ? "Building..." : "OK"}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={toolbarModal === "customStudyTags"}
        onClose={() => setToolbarModal("customStudy")}
        title="Choose Tags"
        description="Pick include/exclude labels for Study by card state or tag."
        maxWidthClassName="max-w-3xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <p className="text-sm font-semibold">Selected Tags</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Included (OR logic)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {customStudyIncludedTags.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No included tags yet.</p>}
                  {customStudyIncludedTags.map((tag) => (
                    <button
                      key={`include-${tag}`}
                      type="button"
                      onClick={() => cycleCustomTagMode(tag)}
                      className="rounded-full border border-emerald-300/80 bg-emerald-100/70 px-2.5 py-1 text-xs text-emerald-900"
                      title="Click to switch to Excluded"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Excluded</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {customStudyExcludedTags.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No excluded tags yet.</p>}
                  {customStudyExcludedTags.map((tag) => (
                    <button
                      key={`exclude-${tag}`}
                      type="button"
                      onClick={() => cycleCustomTagMode(tag)}
                      className="rounded-full border border-rose-300/80 bg-rose-100/70 px-2.5 py-1 text-xs text-rose-900"
                      title="Click to remove"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Available Tags</p>
              <Button size="sm" variant="ghost" onClick={() => safeRun(loadCustomStudyTags)} disabled={isLoadingCustomStudyTags}>
                {isLoadingCustomStudyTags ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="mt-3 max-h-72 overflow-auto">
              {customStudyAvailableTags.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isLoadingCustomStudyTags ? "Loading tags..." : "No tags available in this deck scope."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customStudyAvailableTags.map((tag) => {
                    const mode = getCustomTagMode(tag);
                    const modeClass =
                      mode === "include"
                        ? "border-emerald-300/80 bg-emerald-100/70 text-emerald-900"
                        : mode === "exclude"
                          ? "border-rose-300/80 bg-rose-100/70 text-rose-900"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]";
                    return (
                      <button
                        key={`available-${tag}`}
                        type="button"
                        onClick={() => cycleCustomTagMode(tag)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${modeClass}`}
                        title={mode === "none" ? "Click to include" : mode === "include" ? "Click to exclude" : "Click to clear"}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Click a tag to cycle: Include -&gt; Exclude -&gt; None.
            </p>
          </section>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => {
            setCustomStudyIncludedTags([]);
            setCustomStudyExcludedTags([]);
          }}>
            Clear Selection
          </Button>
          <Button onClick={() => setToolbarModal("customStudy")}>Done</Button>
        </div>
      </ModalShell>

      <ModalShell
        open={toolbarModal === "add"}
        onClose={() => setToolbarModal("none")}
        title="Add Note"
        description="Create one note and choose deck + note type."
        maxWidthClassName="max-w-2xl"
      >
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Deck</FieldLabel>
              <SelectField value={addDeckId} onChange={(event) => setAddDeckId(event.target.value)}>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Note Type</FieldLabel>
              <SelectField value={addNoteTypeId} onChange={(event) => setAddNoteTypeId(event.target.value)}>
                {noteTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          {toStringArray(selectedNoteType?.fields).map((field) => (
            <div key={field}>
              <FieldLabel>{field}</FieldLabel>
              <TextAreaField value={addFields[field] ?? ""} onChange={(event) => setAddFields((previous) => ({ ...previous, [field]: event.target.value }))} rows={field.length > 16 ? 4 : 3} />
            </div>
          ))}
          <div>
            <FieldLabel>Tags (comma-separated)</FieldLabel>
            <TextField value={addTags} onChange={(event) => setAddTags(event.target.value)} placeholder="biology, exam1" />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => safeRun(handleCreateNote)} disabled={!addDeckId || !addNoteTypeId}>
              Create Note
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={toolbarModal === "import"}
        onClose={() => setToolbarModal("none")}
        title="Import File"
        description="Import .csv or .txt with field mapping."
        maxWidthClassName="max-w-2xl"
      >
        <div className="grid gap-3">
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            disabled={isImporting}
            onChange={async (event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setImportFile(nextFile);
              if (!nextFile) {
                setImportColumns([]);
                setImportFrontColumn("");
                setImportBackColumn("");
                setImportTagsColumn("");
                return;
              }
              try {
                const raw = await nextFile.text();
                const parsed = parseImportText(raw);
                const columns = parsed.columns;
                if (columns.length === 0) {
                  setImportColumns([]);
                  setImportFrontColumn("");
                  setImportBackColumn("");
                  setImportTagsColumn("");
                  setStatusMessage("Import file has no card rows.");
                  return;
                }
                setImportColumns(columns);
                setImportFrontColumn(columns[0] ?? "");
                setImportBackColumn(columns[1] ?? columns[0] ?? "");
                setImportTagsColumn(columns.find((entry) => entry.toLowerCase().includes("tag")) ?? "");
              } catch (error) {
                setImportColumns([]);
                setImportFrontColumn("");
                setImportBackColumn("");
                setImportTagsColumn("");
                setStatusMessage(error instanceof Error ? error.message : "Unable to parse import file.");
              }
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Deck</FieldLabel>
              <SelectField value={addDeckId} onChange={(event) => setAddDeckId(event.target.value)} disabled={isImporting}>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Note Type</FieldLabel>
              <SelectField value={addNoteTypeId} onChange={(event) => setAddNoteTypeId(event.target.value)} disabled={isImporting}>
                {noteTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Front column</FieldLabel>
              <SelectField value={importFrontColumn} onChange={(event) => setImportFrontColumn(event.target.value)} disabled={isImporting}>
                <option value="">Select</option>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Back column</FieldLabel>
              <SelectField value={importBackColumn} onChange={(event) => setImportBackColumn(event.target.value)} disabled={isImporting}>
                <option value="">Select</option>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Tags column (optional)</FieldLabel>
              <SelectField value={importTagsColumn} onChange={(event) => setImportTagsColumn(event.target.value)} disabled={isImporting}>
                <option value="">None</option>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <p className="text-sm font-semibold">Mapping presets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {importPresets.map((preset) => (
                <Button key={preset.id} variant="ghost" size="sm" onClick={() => applyPreset(preset)} disabled={isImporting}>
                  {preset.name}
                </Button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <TextField value={importPresetName} onChange={(event) => setImportPresetName(event.target.value)} placeholder="New preset name" disabled={isImporting} />
              <Button onClick={() => safeRun(handleSaveImportPreset)} disabled={!importPresetName.trim() || isImporting}>
                Save Preset
              </Button>
            </div>
          </div>

          {(isImporting || importProgress.total > 0) && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>{isImporting ? "Importing..." : "Last import"}</span>
                <span>
                  {importProgress.processed}/{importProgress.total} ({importProgress.total === 0 ? 0 : Math.round((importProgress.processed / importProgress.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full bg-[var(--color-focus)] transition-[width] duration-200"
                  style={{ width: `${importProgress.total === 0 ? 0 : (importProgress.processed / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Imported {importProgress.imported} notes.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => safeRun(handleImportFile)} disabled={!importFile || !importFrontColumn || !importBackColumn || isImporting}>
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </ModalShell>
    </main>
  );
};
