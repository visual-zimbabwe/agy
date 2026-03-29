"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type DecksPayload = {
  decks?: Deck[];
  noteTypes?: NoteType[];
};

type NoteType = {
  id: string;
  name: string;
  fields: unknown;
};

const CANVAS_BACKGROUND =
  "url(https://lh3.googleusercontent.com/aida-public/AB6AXuDmKzY_cVLUJ3bSCeVW0hmjtMArbpr0GNAU7bHyDZnmUwRPAEX8lLAPpUdiojr9D5y_H1M4_zrkIayPoFWvkkOAl8aUXSF_qnuUbb2RCb0OKSsxrbq0gpBFMbYtDuweC8vy2jm5kzRTNO52NJBagL2_QbXrJMTB1Z3bBNElzHmFvf4XMjLI8Lez0Uc_gsfsKVKsJ_p-oKhMJ3_SBurwzOXVSEudCLliBNxxeZOfUznRs_4sF0iF-YJPNhzv6eqCt1G8ArAtRIK3n5Ms)";
const GRAIN_OVERLAY =
  "url(https://lh3.googleusercontent.com/aida-public/AB6AXuDXG-kDCh5WCO09ONZ-VHukW1gaVA5_SR8-HOrJrCh1ieiLpS2EqWHKILVcOOdOv6v7NvOkZ8sbKVz4MLI2itcLH1-wXm0ncUOIj_pp3pYLPg0dUEE05UtDzb-JdcIf1IgTxKPxORvxpGmcdCk8B2I_erErmbPV8HCrj5s_KWKlO3Ee4SfKXHGTnqMa93cgGg62B-N1di5sRp1dFqIa9R4gcPT4iKBJMyIEfLXYGYSc2zvV78l6IirbQpBtWKejdNvytvCj5PoeLIoL)";

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry));
};

export function DecksDecksView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [noteTypes, setNoteTypes] = useState<NoteType[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [deckName, setDeckName] = useState("");
  const [toolbarModal, setToolbarModal] = useState<"none" | "add">("none");
  const [addDeckId, setAddDeckId] = useState("");
  const [addNoteTypeId, setAddNoteTypeId] = useState("");
  const [addFields, setAddFields] = useState<Record<string, string>>({});
  const [addTags, setAddTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/decks", { cache: "no-store" });
        const payload = (await response.json()) as DecksPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load decks.");
        }
        if (cancelled) {
          return;
        }
        const nextDecks = payload.decks ?? [];
        const nextNoteTypes = payload.noteTypes ?? [];
        setDecks(nextDecks);
        setNoteTypes(nextNoteTypes);
        const requestedDeckId = searchParams.get("deckId") ?? "";
        const requestedDeck = nextDecks.find((deck) => deck.id === requestedDeckId);
        const fallbackDeck = nextDecks.find((deck) => deck.parent_id !== null) ?? nextDecks[0] ?? null;
        const nextSelectedDeckId = requestedDeck?.id ?? fallbackDeck?.id ?? "";
        setSelectedDeckId(nextSelectedDeckId);
        setAddDeckId((current) => current || nextSelectedDeckId);
        setAddNoteTypeId((current) => current || nextNoteTypes[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Failed to load decks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const rootDecks = useMemo(() => decks.filter((deck) => deck.parent_id === null), [decks]);
  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === selectedDeckId) ?? null, [decks, selectedDeckId]);
  const selectedParentDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeck?.parent_id) ?? null,
    [decks, selectedDeck],
  );
  const visibleChildDecks = useMemo(
    () => decks.filter((deck) => deck.parent_id === (selectedParentDeck?.id ?? selectedDeck?.id ?? "")),
    [decks, selectedDeck, selectedParentDeck],
  );
  const selectedNoteType = useMemo(() => noteTypes.find((entry) => entry.id === addNoteTypeId) ?? null, [addNoteTypeId, noteTypes]);
  const addNoteFields = useMemo(() => toStringArray(selectedNoteType?.fields), [selectedNoteType]);
  const totalCards =
    (selectedDeck?.counts.newCount ?? 0) +
    (selectedDeck?.counts.learningCount ?? 0) +
    (selectedDeck?.counts.reviewCount ?? 0);

  const chooseDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    const next = new URLSearchParams(searchParams.toString());
    next.set("deckId", deckId);
    router.replace(`/decks/decks?${next.toString()}`);
  };

  const openView = (view: "study" | "browse" | "stats") => {
    const next = new URLSearchParams();
    if (selectedDeckId) {
      next.set("deckId", selectedDeckId);
    }
    router.push(`/decks/${view}${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const reloadDeckData = async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = (await response.json()) as DecksPayload & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load decks.");
    }
    setDecks(payload.decks ?? []);
    setNoteTypes(payload.noteTypes ?? []);
  };

  const createDeck = async () => {
    const nextName = deckName.trim();
    if (!nextName) {
      return;
    }
    setStatusMessage("");
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName, parentId: selectedParentDeck?.id ?? null }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to create deck.");
      return;
    }
    setDeckName("");
    const reload = await fetch("/api/decks", { cache: "no-store" });
    const reloadPayload = (await reload.json()) as DecksPayload;
    const nextDecks = reloadPayload.decks ?? [];
    setDecks(nextDecks);
    const created = nextDecks.find((deck) => deck.name === nextName);
    if (created) {
      chooseDeck(created.id);
    }
  };

  const openAddNote = () => {
    setAddDeckId(selectedDeck?.id ?? addDeckId ?? decks[0]?.id ?? "");
    setAddNoteTypeId((current) => current || noteTypes[0]?.id || "");
    setToolbarModal("add");
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
      setStatusMessage(payload.error ?? "Failed to create note.");
      return;
    }
    setToolbarModal("none");
    setAddFields({});
    setAddTags("");
    await reloadDeckData();
    setStatusMessage("Note created.");
  };

  return (
    <main
      className="min-h-screen bg-[#fcf9f4] font-[Manrope] text-[#1c1c19] antialiased"
      style={{ backgroundImage: CANVAS_BACKGROUND }}
    >
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-black/5 bg-[#fcf9f4] py-8">
        <div className="mb-12 px-8">
          <h1 className="font-['Newsreader'] text-xl text-[#1c1c19]">Library</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/60">The Workspace</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">My Decks</p>
            {rootDecks.map((rootDeck) => {
              const childDecks = decks.filter((deck) => deck.parent_id === rootDeck.id);
              const expanded = selectedDeck?.id === rootDeck.id || selectedParentDeck?.id === rootDeck.id;
              return (
                <div key={rootDeck.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => chooseDeck(childDecks[0]?.id ?? rootDeck.id)}
                    className={`w-full rounded-lg px-4 py-2 text-left transition-all duration-300 ${
                      expanded ? "bg-[#4d6356]/10 font-bold text-[#4d6356]" : "text-black/70 hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[18px]">{childDecks.length > 0 ? (expanded ? "⌄" : "›") : "•"}</span>
                      <span className="text-sm">{rootDeck.name}</span>
                    </div>
                  </button>
                  {expanded && childDecks.length > 0 && (
                    <div className="mt-1 space-y-1 pl-8">
                      {childDecks.map((deck) => {
                        const active = selectedDeck?.id === deck.id;
                        return (
                          <button
                            key={deck.id}
                            type="button"
                            onClick={() => chooseDeck(deck.id)}
                            className="group flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-black/70 transition-all duration-300 hover:bg-black/5"
                          >
                            <span className="text-sm">{deck.name}</span>
                            <span
                              className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                                active ? "bg-[#a33818]/10 text-[#a33818]" : "bg-[#4d6356]/10 text-[#4d6356]"
                              }`}
                            >
                              {deck.counts.reviewCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
        <div className="mt-auto space-y-2 px-4">
          <button
            type="button"
            onClick={createDeck}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#a33818] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#a33818]/10 transition-transform active:scale-95"
          >
            <span className="text-[20px]">+</span>
            Create New Deck
          </button>
          <input
            value={deckName}
            onChange={(event) => setDeckName(event.target.value)}
            placeholder="New deck name"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
          />
          <div className="space-y-1 border-t border-black/5 pt-4">
            <button type="button" className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-black/50 transition-colors hover:bg-black/5">
              <span className="text-[18px]">⚙</span>
              <span className="text-xs font-bold uppercase tracking-[0.22em]">Settings</span>
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-black/50 transition-colors hover:bg-black/5">
              <span className="text-[18px]">?</span>
              <span className="text-xs font-bold uppercase tracking-[0.22em]">Help</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="fixed left-64 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/10 bg-[rgba(252,249,244,0.8)] px-8 backdrop-blur-xl">
          <div className="flex items-center gap-8">
            <span className="font-['Newsreader'] text-2xl font-bold tracking-tight text-[#a33818]">Agy Decks</span>
            <nav className="hidden items-center gap-6 md:flex">
              <button type="button" className="border-b-2 border-[#a33818] pb-1 text-sm font-bold text-[#a33818]">Decks</button>
              <button type="button" onClick={() => openView("browse")} className="text-sm text-black/60 transition-colors hover:text-[#a33818]">Browse</button>
              <button type="button" onClick={() => openView("stats")} className="text-sm text-black/60 transition-colors hover:text-[#a33818]">Stats</button>
              <button type="button" onClick={() => openView("study")} className="text-sm text-black/60 transition-colors hover:text-[#a33818]">Study</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">⌕</span>
              <input className="w-64 rounded-full bg-[#f0ede8] py-1.5 pl-10 pr-4 text-sm outline-none" placeholder="Search cards..." />
            </div>
            <Button size="sm" onClick={openAddNote}>Add Note</Button>
            <button type="button" onClick={() => openView("study")} className="rounded-full p-2 text-black/60 transition-colors hover:bg-black/5">⚙</button>
            <button type="button" onClick={() => openView("study")} className="rounded-full p-2 text-black/60 transition-colors hover:bg-black/5">◉</button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-12 pb-20 pt-24">
          <div className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
            <span>{selectedParentDeck?.name ?? "Library"}</span>
            <span>›</span>
            <span className="text-[#a33818]">{selectedDeck?.name ?? "Select a deck"}</span>
          </div>

          <div className="mb-16">
            <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="mb-4 font-['Newsreader'] text-6xl text-[#1c1c19]">{selectedDeck?.name ?? "Select a deck"}</h2>
                <p className="max-w-lg leading-relaxed text-black/60">
                  {selectedDeck
                    ? `${selectedDeck.name} is the selected deck in your study workspace. Use this overview to inspect live counts, launch study, or branch into browse and stats.`
                    : "Choose a deck from the library."}
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={openAddNote}>Add Note</Button>
                <button
                  type="button"
                  onClick={() => openView("study")}
                  className="flex items-center gap-3 rounded-full bg-[#a33818] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-[#a33818]/20 transition-all active:scale-95"
                >
                  <span>▶</span>
                  Start Study
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: "New Concepts", value: selectedDeck?.counts.newCount ?? 0, color: "#a33818" },
                { label: "In Learning", value: selectedDeck?.counts.learningCount ?? 0, color: "#4d6356" },
                { label: "Due for Review", value: selectedDeck?.counts.reviewCount ?? 0, color: "#755717" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-black/5 bg-white p-8 shadow-[0_10px_30px_rgba(28,28,25,0.06)]">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: metric.color }}>{metric.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Newsreader'] text-5xl text-[#1c1c19]">{metric.value}</span>
                    <span className="text-sm text-black/30">Cards</span>
                  </div>
                  <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-[#f0ede8]">
                    <div className="h-full" style={{ width: `${Math.max(10, Math.round((metric.value / Math.max(1, totalCards || 1)) * 100))}%`, backgroundColor: metric.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16 flex items-center gap-6 border-y border-black/5 py-4">
            <button type="button" onClick={() => openView("study")} className="text-sm font-bold text-black/60 transition-colors hover:text-[#a33818]">Custom Study</button>
            <button type="button" onClick={() => openView("stats")} className="text-sm font-bold text-black/60 transition-colors hover:text-[#a33818]">Deck Stats</button>
            <button type="button" onClick={() => openView("browse")} className="text-sm font-bold text-black/60 transition-colors hover:text-[#a33818]">Browse Cards</button>
          </div>

          <section>
            <h3 className="mb-6 font-['Newsreader'] text-2xl text-[#1c1c19]">Sub-Decks</h3>
            <div className="overflow-hidden rounded-xl border border-black/5 bg-[#f6f3ee]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Scope</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Deck Name</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">New</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Learning</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {visibleChildDecks.length > 0 ? (
                    visibleChildDecks.map((deck) => (
                      <tr key={deck.id} className="transition-colors hover:bg-black/5">
                        <td className="px-8 py-6">
                          <input checked={selectedDeck?.id === deck.id} onChange={() => chooseDeck(deck.id)} className="cursor-pointer rounded-sm border-black/20 text-[#a33818] focus:ring-[#a33818]/20" type="checkbox" />
                        </td>
                        <td className="px-8 py-6">
                          <button type="button" onClick={() => chooseDeck(deck.id)} className="font-['Newsreader'] text-lg text-[#1c1c19]">{deck.name}</button>
                        </td>
                        <td className="px-8 py-6 font-bold text-[#a33818]">{deck.counts.newCount}</td>
                        <td className="px-8 py-6 font-bold text-[#4d6356]">{deck.counts.learningCount}</td>
                        <td className="px-8 py-6 font-bold text-[#755717]">{deck.counts.reviewCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-sm text-black/50">No child decks for this selection.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {statusMessage && <p className="mt-6 rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm">{statusMessage}</p>}
          {loading && <p className="mt-6 text-sm text-black/50">Loading deck workspace...</p>}
        </div>
      </main>

      <ModalShell
        open={toolbarModal === "add"}
        onClose={() => setToolbarModal("none")}
        title="Add Note"
        description="Compose a note, choose its deck, and preview the generated study object."
        maxWidthClassName="max-w-5xl"
        panelClassName="border-[#dfc0b8] bg-[linear-gradient(180deg,rgba(252,249,244,0.98)_0%,rgba(243,232,221,0.96)_100%)] shadow-[0_30px_90px_rgba(87,52,34,0.16)]"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_24rem]">
          <div className="space-y-4 rounded-[28px] border border-[#e5d2c5] bg-[rgba(255,251,245,0.9)] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
            {addNoteFields.map((field) => (
              <div key={field}>
                <FieldLabel>{field}</FieldLabel>
                <TextAreaField
                  value={addFields[field] ?? ""}
                  onChange={(event) => setAddFields((previous) => ({ ...previous, [field]: event.target.value }))}
                  rows={field.length > 16 ? 4 : 3}
                />
              </div>
            ))}
            <div>
              <FieldLabel>Tags (comma-separated)</FieldLabel>
              <TextField value={addTags} onChange={(event) => setAddTags(event.target.value)} placeholder="biology, exam1" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateNote} disabled={!addDeckId || !addNoteTypeId}>
                Create Note
              </Button>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[#e1c6b7] bg-[linear-gradient(180deg,rgba(248,239,228,0.92)_0%,rgba(243,229,216,0.98)_100%)] p-6 shadow-[0_24px_60px_rgba(94,56,37,0.1)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9b6c55]">Live Preview</p>
            <h3 className="mt-3 font-['Newsreader'] text-[2rem] italic leading-none text-[#2b1c16]">
              {selectedNoteType?.name ?? "Study note"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#6f5a52]">
              {decks.find((deck) => deck.id === addDeckId)?.name ?? "Select a deck to place this note into your collection."}
            </p>
            <div className="mt-6 space-y-3">
              {addNoteFields.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-[#cfaf9d] bg-[rgba(255,250,244,0.82)] px-4 py-5 text-sm text-[#7a6257]">
                  Choose a note type to see its fields.
                </div>
              )}
              {addNoteFields.map((field) => (
                <article key={field} className="rounded-[22px] border border-[#e6d5c7] bg-[rgba(255,252,247,0.92)] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6c55]">{field}</p>
                  <p className="mt-2 text-sm leading-6 text-[#322621]">{addFields[field]?.trim() || "Empty field"}</p>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-[#e6d5c7] bg-[rgba(255,252,247,0.86)] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b6c55]">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {addTags
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter((entry) => entry.length > 0)
                  .map((tag) => (
                    <span key={tag} className="rounded-full border border-[#d8b7a8] bg-[#f7ede4] px-2.5 py-1 text-[11px] font-medium text-[#7d5948]">
                      {tag}
                    </span>
                  ))}
                {addTags.trim().length === 0 && <p className="text-sm text-[#7a6257]">No tags yet.</p>}
              </div>
            </div>
          </aside>
        </div>
      </ModalShell>

      <div className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.03]" style={{ backgroundImage: GRAIN_OVERLAY }} />
    </main>
  );
}
