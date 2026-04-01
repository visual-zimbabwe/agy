"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };
type Deck = { id: string; name: string; parent_id: string | null; counts: DeckCounts };
type BrowseRow = {
  id: string;
  deck_id: string;
  deckName: string;
  noteTypeName: string;
  prompt: string;
  answer: string;
  due_at: string | null;
  state: string;
  note: { id: string; suspended: boolean; flagged: boolean; tags: unknown } | null;
};

export function DecksBrowseView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<BrowseRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const selectedRow = useMemo(() => rows.find((row) => row.id === selectedRowId) ?? null, [rows, selectedRowId]);

  const loadDecks = async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load decks.");
    const nextDecks = payload.decks ?? [];
    setDecks(nextDecks);
    const requested = searchParams.get("deckId") ?? "";
    const nextDeck = nextDecks.find((deck: Deck) => deck.id === requested) ?? nextDecks[0] ?? null;
    if (nextDeck) setDeckId((current) => current || nextDeck.id);
  };

  const loadBrowse = async (nextDeckId: string, nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextDeckId) params.set("deckId", nextDeckId);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    params.set("includeChildren", "1");
    const response = await fetch(`/api/decks/browse?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load browser.");
    setRows(payload.rows ?? []);
    setSelectedRowId((payload.rows ?? [])[0]?.id ?? "");
  };

  useEffect(() => { void loadDecks().catch((error) => setStatus(error instanceof Error ? error.message : "Failed to load browse.")); }, [searchParams]);
  useEffect(() => { if (deckId) { void loadBrowse(deckId, query).catch((error) => setStatus(error instanceof Error ? error.message : "Failed to load browse.")); } }, [deckId]);

  const updateDeck = (nextDeckId: string) => {
    setDeckId(nextDeckId);
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/browse?${params.toString()}`);
  };

  const search = async () => { if (deckId) await loadBrowse(deckId, query); };

  const patchRow = async (patch: Record<string, unknown>) => {
    if (!selectedRow) return;
    const response = await fetch(`/api/decks/cards/${selectedRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to update row.");
      return;
    }
    await loadBrowse(deckId, query);
  };

  const runBulk = async (action: "suspend" | "unsuspend" | "delete") => {
    if (selectedRowIds.length === 0) return;
    const response = await fetch("/api/decks/browse/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardIds: selectedRowIds, action }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to run bulk action.");
      return;
    }
    setSelectedRowIds([]);
    await loadBrowse(deckId, query);
  };

  return (
    <main className="overflow-hidden bg-[#fcf9f4] font-[Manrope] text-[#1c1c19]">
      <div className="fixed inset-0 z-[-1] opacity-[0.02] pointer-events-none" style={{ backgroundImage: "url(data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E)" }} />
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1c1c19]/10 bg-[#fcf9f4]/80 px-8 backdrop-blur-xl">
        <div className="font-['Newsreader'] text-2xl font-bold tracking-tight text-[#a33818]">Agy Decks</div>
        <nav className="hidden items-center gap-4 md:flex"><button type="button" onClick={() => router.push(`/decks/decks?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Decks</button><button type="button" className="border-b-2 border-[#a33818] pb-1 font-bold text-[#a33818]">Browse</button><button type="button" onClick={() => router.push(`/decks/stats?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Stats</button><button type="button" onClick={() => router.push(`/decks/study?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Study</button><span className="h-4 w-px bg-[#1c1c19]/10" aria-hidden="true" /><Link href="/wall" className="text-[#1c1c19]/60 hover:text-[#a33818]">Wall</Link><Link href="/page" className="text-[#1c1c19]/60 hover:text-[#a33818]">Page</Link><Link href="/media" className="text-[#1c1c19]/60 hover:text-[#a33818]">Media</Link></nav>
        <div className="flex items-center space-x-4"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#58423c]/40">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void search(); }} className="w-64 rounded-full bg-[#f0ede8] py-1.5 pl-10 pr-4 text-sm outline-none" placeholder="Search the library..." /></div><button type="button" onClick={() => void search()} className="text-[#58423c]">⏎</button></div>
      </header>
      <div className="flex h-screen pt-16">
        <aside className="hidden w-64 flex-col border-r border-[#1c1c19]/5 bg-[#f6f3ee]/30 px-6 py-8 lg:flex"><div className="mb-8"><h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Library</h2><p className="font-['Newsreader'] text-xl">The Workspace</p></div><nav className="flex-1 space-y-1"><div className="rounded-lg bg-[#4d6356]/10 px-4 py-2 font-bold text-[#4d6356]">My Decks</div><div className="rounded-lg px-4 py-2 text-[#1c1c19]/70">Shared Decks</div><div className="rounded-lg px-4 py-2 text-[#1c1c19]/70">Archive</div><div className="rounded-lg px-4 py-2 text-[#1c1c19]/70">Trash</div></nav><select value={deckId} onChange={(event) => updateDeck(event.target.value)} className="mt-auto rounded-full border border-[#dfc0b8]/40 bg-white px-4 py-2 text-sm outline-none">{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></aside>
        <main className="flex min-w-0 flex-1 overflow-hidden"><div className="flex min-w-0 flex-1 flex-col bg-[#fcf9f4]"><div className="flex flex-wrap items-center gap-4 bg-[#f6f3ee]/20 p-6"><div className="rounded-full border border-[#dfc0b8]/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4d6356]">Deck: <select value={deckId} onChange={(event) => updateDeck(event.target.value)} className="bg-transparent outline-none">{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></div><div className="rounded-full border border-[#dfc0b8]/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4d6356]">Status: Any</div><div className="ml-auto flex gap-2"><button type="button" onClick={() => void runBulk('suspend')} className="rounded-full bg-[#1c1c19] px-4 py-2 text-xs font-bold text-white">Suspend</button><button type="button" onClick={() => void runBulk('unsuspend')} className="rounded-full bg-[#cde6d5] px-4 py-2 text-xs font-bold text-[#0b1f15]">Unsuspend</button><button type="button" onClick={() => void runBulk('delete')} className="rounded-full border border-[#ba1a1a]/30 px-4 py-2 text-xs font-bold text-[#ba1a1a]">Delete</button></div></div><div className="flex-1 overflow-y-auto px-6 pb-20"><table className="w-full border-separate border-spacing-y-2 text-left"><thead className="sticky top-0 z-10 bg-[#fcf9f4]"><tr className="text-[#58423c]"><th className="px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.1em]"></th><th className="px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.1em]">Note Title</th><th className="px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.1em]">Deck</th><th className="px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.1em]">Last Review</th><th className="px-4 pb-4 text-[10px] font-bold uppercase tracking-[0.1em]">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={`group cursor-pointer transition-all duration-200 ${selectedRowId === row.id ? 'relative z-10 rounded-xl bg-[#a33818]/5 ring-1 ring-[#a33818]/20' : 'hover:bg-[#f6f3ee]'}`}><td className="rounded-l-xl bg-white px-4 py-5"><input type="checkbox" checked={selectedRowIds.includes(row.id)} onChange={(event) => setSelectedRowIds((previous) => event.target.checked ? [...previous, row.id] : previous.filter((entry) => entry !== row.id))} /></td><td className="bg-white px-4 py-5" onClick={() => setSelectedRowId(row.id)}><div className={`font-['Newsreader'] text-lg leading-tight ${selectedRowId === row.id ? 'text-[#a33818]' : 'text-[#1c1c19]'}`}>{row.prompt}</div><div className="mt-1 text-[11px] text-[#58423c]/60">{row.noteTypeName}</div></td><td className="bg-white px-4 py-5"><span className="text-sm font-medium text-[#4d6356]">{row.deckName}</span></td><td className="bg-white px-4 py-5"><span className="text-sm text-[#58423c]">{row.due_at ? row.due_at.slice(0, 10) : 'Never'}</span></td><td className="rounded-r-xl bg-white px-4 py-5"><span className="inline-flex rounded-full bg-[#e5e2dd] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#58423c]">{row.state}</span></td></tr>)}</tbody></table></div></div><aside className="flex w-96 flex-col border-l border-[#1c1c19]/5 bg-white"><div className="flex items-center justify-between border-b border-[#dfc0b8]/20 bg-[#f6f3ee]/20 p-6"><h3 className="font-['Newsreader'] text-lg font-bold">Note Inspector</h3></div><div className="flex-1 space-y-8 overflow-y-auto p-6">{selectedRow ? <><div className="space-y-4"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Preview</div><div className="space-y-4 rounded-xl border border-[#dfc0b8]/20 bg-[#fcf9f4] p-5 shadow-sm"><div><div className="text-[10px] font-bold uppercase text-[#58423c]/40">Front</div><div className="font-['Newsreader'] leading-relaxed text-[#1c1c19]">{selectedRow.prompt}</div></div><div className="space-y-1 border-t border-dashed border-[#dfc0b8]/30 pt-4"><div className="text-[10px] font-bold uppercase text-[#58423c]/40">Back</div><div className="text-[#4d6356]">{selectedRow.answer}</div></div></div></div><div className="space-y-4"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Metadata & Stats</div><div className="grid grid-cols-2 gap-4"><div className="rounded-lg bg-[#f6f3ee] p-3"><div className="text-[9px] font-bold uppercase text-[#58423c]/50">Deck</div><div className="text-sm font-medium">{selectedRow.deckName}</div></div><div className="rounded-lg bg-[#f6f3ee] p-3"><div className="text-[9px] font-bold uppercase text-[#58423c]/50">State</div><div className="text-sm font-medium">{selectedRow.state}</div></div><div className="rounded-lg bg-[#f6f3ee] p-3"><div className="text-[9px] font-bold uppercase text-[#58423c]/50">Due</div><div className="text-sm font-medium">{selectedRow.due_at ? selectedRow.due_at.slice(0, 10) : 'None'}</div></div><div className="rounded-lg bg-[#f6f3ee] p-3"><div className="text-[9px] font-bold uppercase text-[#58423c]/50">Flagged</div><div className="text-sm font-medium">{selectedRow.note?.flagged ? 'Yes' : 'No'}</div></div></div></div></> : <p className="text-sm text-[#58423c]">Select a note.</p>}{status && <p className="text-sm text-[#a33818]">{status}</p>}</div>{selectedRow && <div className="grid grid-cols-2 gap-3 border-t border-[#dfc0b8]/20 bg-[#f6f3ee] p-6"><button type="button" onClick={() => void patchRow({ flagged: !Boolean(selectedRow.note?.flagged) })} className="rounded-full bg-[#cde6d5] px-4 py-2.5 text-xs font-bold text-[#0b1f15]">{selectedRow.note?.flagged ? 'Unflag' : 'Flag'}</button><button type="button" onClick={() => void patchRow({ suspended: !Boolean(selectedRow.note?.suspended) })} className="rounded-full bg-[#1c1c19] px-4 py-2.5 text-xs font-bold text-white">{selectedRow.note?.suspended ? 'Unsuspend' : 'Suspend'}</button><button type="button" onClick={() => void patchRow({ prompt: selectedRow.prompt, answer: selectedRow.answer })} className="col-span-2 rounded-full border border-[#ba1a1a]/30 px-4 py-2.5 text-xs font-bold text-[#ba1a1a]">Save Current Text</button></div>}</aside></main>
      </div>
    </main>
  );
}
