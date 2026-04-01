"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };
type Deck = { id: string; name: string; parent_id: string | null; counts: DeckCounts };
type StudyCard = { id: string; prompt: string; answer: string };
type StudyLimits = {
  effectiveNewLimit: number;
  effectiveReviewLimit: number;
  remainingNew: number;
  remainingReview: number;
};

export function DecksStudyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [card, setCard] = useState<StudyCard | null>(null);
  const [counts, setCounts] = useState<DeckCounts>({ newCount: 0, learningCount: 0, reviewCount: 0 });
  const [limits, setLimits] = useState<StudyLimits | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [status, setStatus] = useState("");

  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === deckId) ?? null, [decks, deckId]);
  const totalQueue = counts.newCount + counts.learningCount + counts.reviewCount;
  const progressPct = totalQueue === 0 ? 0 : Math.min(100, Math.round(((counts.learningCount + counts.reviewCount) / totalQueue) * 100));

  const fetchDecks = async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load decks.");
    return payload.decks ?? [];
  };

  const fetchStudy = async (nextDeckId: string) => {
    if (!nextDeckId) return;
    const params = new URLSearchParams({ deckId: nextDeckId, includeChildren: "1", excludedDeckIds: "" });
    const response = await fetch(`/api/decks/study?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load study session.");
    return {
      card: payload.card ?? null,
      counts: payload.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 },
      limits: payload.limits ?? null,
    };
  };

  useEffect(() => {
    let cancelled = false;

    const loadDecks = async () => {
      try {
        const nextDecks = await fetchDecks();
        if (cancelled) {
          return;
        }
        setDecks(nextDecks);
        const requested = searchParams.get("deckId") ?? "";
        const nextDeck =
          nextDecks.find((deck: Deck) => deck.id === requested) ??
          nextDecks.find((deck: Deck) => deck.parent_id !== null) ??
          nextDecks[0] ??
          null;
        if (nextDeck) {
          setDeckId((current) => current || nextDeck.id);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Failed to load study.");
        }
      }
    };

    void loadDecks();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!deckId) {
      return;
    }

    let cancelled = false;

    const loadStudy = async () => {
      try {
        const payload = await fetchStudy(deckId);
        if (cancelled || !payload) {
          return;
        }
        setCard(payload.card);
        setCounts(payload.counts);
        setLimits(payload.limits);
        setShowAnswer(false);
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Failed to load study.");
        }
      }
    };

    void loadStudy();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const chooseDeck = (nextDeckId: string) => {
    setDeckId(nextDeckId);
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/study?${params.toString()}`);
  };

  const rateCard = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!card || !deckId) return;
    const response = await fetch("/api/decks/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, rating, studyDeckId: deckId, sessionType: "default" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to rate card.");
      return;
    }
    const [nextDecks, studyPayload] = await Promise.all([fetchDecks(), fetchStudy(deckId)]);
    setDecks(nextDecks);
    setCard(studyPayload?.card ?? null);
    setCounts(studyPayload?.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 });
    setLimits(studyPayload?.limits ?? null);
    setShowAnswer(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcf9f4] font-[Manrope] text-[#1c1c19] selection:bg-[#ffdbd1] selection:text-[#3b0900]">
      <div className="fixed inset-0 z-[60] opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E)" }} />
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1c1c19]/10 bg-[#fcf9f4]/80 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button type="button" onClick={() => router.push('/decks/decks')} className="text-[#a33818]">x</button>
          <span className="font-['Newsreader'] text-xl font-bold text-[#a33818]">{selectedDeck?.name ?? 'Study'}</span>
          <div className="hidden w-64 items-center gap-3 md:flex"><div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0ede8]"><div className="h-full rounded-full bg-[#755717]" style={{ width: `${progressPct}%` }} /></div><span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#58423c]">{progressPct}%</span></div>
        </div>
        <nav className="hidden items-center gap-4 md:flex"><button type="button" className="border-b-2 border-[#a33818] pb-1 font-bold text-[#a33818]">Study</button><button type="button" onClick={() => router.push(`/decks/stats?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Stats</button><button type="button" onClick={() => router.push(`/decks/browse?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Browse</button><button type="button" onClick={() => router.push(`/decks/decks?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">Decks</button><span className="h-4 w-px bg-[#1c1c19]/10" aria-hidden="true" /><Link href="/wall" className="text-[#1c1c19]/60 hover:text-[#a33818]">Wall</Link><Link href="/page" className="text-[#1c1c19]/60 hover:text-[#a33818]">Page</Link><Link href="/media" className="text-[#1c1c19]/60 hover:text-[#a33818]">Media</Link></nav>
        <select value={deckId} onChange={(event) => chooseDeck(event.target.value)} className="rounded-full bg-[#f0ede8] px-4 py-2 text-sm outline-none">{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select>
      </header>
      <main className="relative flex h-screen items-center justify-center px-6 pb-32 pt-16">
        <div className="absolute inset-0 bg-[#a63a1a] opacity-[0.03]" />
        <div className="w-full max-w-2xl">
          <div className="w-full aspect-[4/3] max-h-[500px]"><div className="relative flex h-full w-full flex-col items-center justify-center rounded-xl border border-[#dfc0b8]/30 bg-white p-12 text-center shadow-[0_10px_30px_rgba(28,28,25,0.06)]"><div className="max-w-md space-y-8"><header><span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2rem] text-[#755717]">Question</span><h1 className="font-['Newsreader'] text-3xl italic leading-tight tracking-tight text-[#1c1c19] md:text-4xl">{card?.prompt ?? 'No due card available.'}</h1></header><div className="mx-auto h-px w-12 bg-[#dfc0b8]/40" />{showAnswer ? <div><span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2rem] text-[#4d6356]">Answer</span><p className="text-lg leading-relaxed text-[#58423c] md:text-xl">{card?.answer ?? 'Nothing to reveal.'}</p></div> : <button type="button" onClick={() => setShowAnswer(true)} className="rounded-full bg-[#a33818] px-6 py-3 text-sm font-bold text-white">Reveal Answer</button>}</div></div></div>
          <div className="mt-8 flex items-center gap-8 rounded-full bg-[#f6f3ee] px-6 py-2"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /><span className="text-[11px] font-bold text-[#58423c]">{counts.newCount} NEW</span></div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a33818]" /><span className="text-[11px] font-bold text-[#58423c]">{counts.learningCount} LEARN</span></div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4d6356]" /><span className="text-[11px] font-bold text-[#58423c]">{counts.reviewCount} DUE</span></div></div>
          {limits && <p className="mt-4 text-center text-xs text-[#58423c]">Today limits: New {limits.remainingNew}/{limits.effectiveNewLimit}, Review {limits.remainingReview}/{limits.effectiveReviewLimit}.</p>}
          {status && <p className="mt-4 text-center text-sm text-[#a33818]">{status}</p>}
        </div>
      </main>
      <nav className="fixed bottom-0 left-1/2 z-50 mb-6 flex w-full max-w-2xl -translate-x-1/2 justify-around rounded-full bg-[#fcf9f4]/90 px-12 py-4 shadow-[0_-10px_30px_rgba(28,28,25,0.06)] backdrop-blur-md">{([['again','Again','10M'],['hard','Hard','2D'],['good','Good','4D'],['easy','Easy','7D']] as const).map(([value, label, eta]) => <button key={value} type="button" onClick={() => rateCard(value)} className={`flex flex-col items-center rounded-full px-4 py-2 transition-all active:scale-95 ${value === 'good' ? 'bg-[#a33818]/5 text-[#a33818]' : 'text-[#1c1c19]/50 hover:bg-[#1c1c19]/5'}`}><span className="mb-1 text-2xl">{label[0]}</span><span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span><span className="mt-0.5 text-[9px] font-bold">{eta}</span></button>)}</nav>
    </main>
  );
}
