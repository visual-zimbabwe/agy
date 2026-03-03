"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };

type Deck = {
  id: string;
  name: string;
  parent_id: string | null;
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
type ToolbarModal = "none" | "add" | "import";

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

export const DecksWorkspace = () => {
  const [view, setView] = useState<View>("decks");
  const [toolbarModal, setToolbarModal] = useState<ToolbarModal>("none");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [noteTypes, setNoteTypes] = useState<NoteType[]>([]);
  const [studyDeckId, setStudyDeckId] = useState("");
  const [includeChildren, setIncludeChildren] = useState(true);
  const [excludedDeckIds, setExcludedDeckIds] = useState<string[]>([]);
  const [studyCard, setStudyCard] = useState<StudyCard | null>(null);
  const [studyCounts, setStudyCounts] = useState<DeckCounts>({ newCount: 0, learningCount: 0, reviewCount: 0 });
  const [showAnswer, setShowAnswer] = useState(false);
  const [browseRows, setBrowseRows] = useState<BrowseRow[]>([]);
  const [browseQuery, setBrowseQuery] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [statsRange, setStatsRange] = useState("30d");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [deckName, setDeckName] = useState("");
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
  const [statusMessage, setStatusMessage] = useState("");

  const loadDeckData = useCallback(async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load decks.");
    }
    setDecks(payload.decks ?? []);
    setNoteTypes(payload.noteTypes ?? []);
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

  const selectedNoteType = useMemo(() => noteTypes.find((entry) => entry.id === addNoteTypeId) ?? null, [addNoteTypeId, noteTypes]);
  const selectedRow = useMemo(() => browseRows.find((row) => row.id === selectedRowId) ?? null, [browseRows, selectedRowId]);
  const childDecks = useMemo(() => decks.filter((deck) => deck.parent_id === studyDeckId), [decks, studyDeckId]);

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
    setStatusMessage("Deck created.");
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
    setStatusMessage("Note created.");
  };

  const handleRateCard = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!studyCard) {
      return;
    }
    const response = await fetch("/api/decks/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: studyCard.id, rating }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to rate card.");
    }
    await Promise.all([loadStudyCard(), loadDeckData()]);
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
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      throw new Error("Import file needs a header row and at least one data row.");
    }
    const headerLine = lines[0];
    if (!headerLine) {
      throw new Error("Import header row is missing.");
    }
    const delimiter: "," | "\t" = headerLine.includes("\t") ? "\t" : ",";
    const header = parseDelimitedLine(headerLine, delimiter);
    const frontIndex = header.indexOf(importFrontColumn);
    const backIndex = header.indexOf(importBackColumn);
    const tagsIndex = header.indexOf(importTagsColumn);
    if (frontIndex < 0 || backIndex < 0) {
      throw new Error("Pick valid Front and Back columns.");
    }
    let imported = 0;
    for (const line of lines.slice(1)) {
      const row = parseDelimitedLine(line, delimiter);
      const front = row[frontIndex] ?? "";
      const back = row[backIndex] ?? "";
      if (!front.trim() && !back.trim()) {
        continue;
      }
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
    }
    setToolbarModal("none");
    setImportFile(null);
    await loadDeckData();
    setStatusMessage(`Import complete: ${imported} notes added.`);
  };

  const safeRun = (run: () => Promise<void>) => {
    void run().catch((error) => {
      setStatusMessage(error instanceof Error ? error.message : "Action failed.");
    });
  };

  const switchView = (nextView: View) => {
    setView(nextView);
    if (nextView === "study") {
      safeRun(loadStudyCard);
    }
    if (nextView === "browse") {
      safeRun(loadBrowse);
    }
    if (nextView === "stats") {
      safeRun(loadStats);
    }
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
            <Link href="/wall" className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold">
              Back to Wall
            </Link>
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
                    setStudyDeckId(deck.id);
                    setView("study");
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
            </div>
          </aside>

          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            {view === "study" && (
              <div className="space-y-4">
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
                <p className="text-sm text-[var(--color-text-muted)]">
                  Queue: New {studyCounts.newCount} | Learning {studyCounts.learningCount} | Review {studyCounts.reviewCount}
                </p>
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
                    No due cards in this deck selection.
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
            onChange={async (event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setImportFile(nextFile);
              if (!nextFile) {
                setImportColumns([]);
                return;
              }
              const raw = await nextFile.text();
              const firstLine = raw.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
              const delimiter: "," | "\t" = firstLine.includes("\t") ? "\t" : ",";
              const columns = parseDelimitedLine(firstLine, delimiter);
              setImportColumns(columns);
              setImportFrontColumn(columns[0] ?? "");
              setImportBackColumn(columns[1] ?? columns[0] ?? "");
              setImportTagsColumn(columns.find((entry) => entry.toLowerCase().includes("tag")) ?? "");
            }}
          />
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
            <div>
              <FieldLabel>Front column</FieldLabel>
              <SelectField value={importFrontColumn} onChange={(event) => setImportFrontColumn(event.target.value)}>
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
              <SelectField value={importBackColumn} onChange={(event) => setImportBackColumn(event.target.value)}>
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
              <SelectField value={importTagsColumn} onChange={(event) => setImportTagsColumn(event.target.value)}>
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
                <Button key={preset.id} variant="ghost" size="sm" onClick={() => applyPreset(preset)}>
                  {preset.name}
                </Button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <TextField value={importPresetName} onChange={(event) => setImportPresetName(event.target.value)} placeholder="New preset name" />
              <Button onClick={() => safeRun(handleSaveImportPreset)} disabled={!importPresetName.trim()}>
                Save Preset
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => safeRun(handleImportFile)} disabled={!importFile || !importFrontColumn || !importBackColumn}>
              Import
            </Button>
          </div>
        </div>
      </ModalShell>
    </main>
  );
};
