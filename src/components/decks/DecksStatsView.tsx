"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DeckCounts = { newCount: number; learningCount: number; reviewCount: number };
type Deck = { id: string; name: string; parent_id: string | null; counts: DeckCounts };
type StatsPayload = {
  summary: { totalCards: number; totalReviews: number; retentionRate: number; dueTomorrow: number };
  forecast: Array<{ day: string; due: number }>;
  forecastMode: "daily" | "weekly";
  intervals: { under1: number; d1to6: number; d7to20: number; d21to90: number; over90: number };
  retention: { month: number; year: number };
};

const fmt = new Intl.NumberFormat();

export function DecksStatsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [range, setRange] = useState("30d");
  const [status, setStatus] = useState("");

  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === deckId) ?? null, [decks, deckId]);
  const forecastMax = useMemo(() => Math.max(1, ...(stats?.forecast ?? []).map((entry) => entry.due)), [stats]);
  const maturity = useMemo(
    () => [
      { label: "Learning (0-2d)", value: stats?.intervals.under1 ?? 0, color: "#a33818" },
      { label: "Young (2d-21d)", value: (stats?.intervals.d1to6 ?? 0) + (stats?.intervals.d7to20 ?? 0), color: "#4d6356" },
      { label: "Mature (>21d)", value: (stats?.intervals.d21to90 ?? 0) + (stats?.intervals.over90 ?? 0), color: "#755717" },
    ],
    [stats],
  );
  const maturityMax = useMemo(() => Math.max(1, ...maturity.map((item) => item.value)), [maturity]);

  const loadDecks = async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load decks.");
    const nextDecks = payload.decks ?? [];
    setDecks(nextDecks);
    const requested = searchParams.get("deckId") ?? "";
    const nextDeck =
      nextDecks.find((deck: Deck) => deck.id === requested) ??
      nextDecks.find((deck: Deck) => deck.parent_id !== null) ??
      nextDecks[0] ??
      null;
    if (nextDeck) setDeckId((current) => current || nextDeck.id);
  };

  const loadStats = async (nextDeckId: string, nextRange: string) => {
    if (!nextDeckId) return;
    const params = new URLSearchParams({ deckId: nextDeckId, includeChildren: "1", range: nextRange });
    const response = await fetch(`/api/decks/stats?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load stats.");
    setStats(payload);
  };

  useEffect(() => {
    void loadDecks().catch((error) => setStatus(error instanceof Error ? error.message : "Failed to load stats."));
  }, [searchParams]);

  useEffect(() => {
    if (!deckId) return;
    void loadStats(deckId, range).catch((error) => setStatus(error instanceof Error ? error.message : "Failed to load stats."));
  }, [deckId, range]);

  const updateDeck = (nextDeckId: string) => {
    setDeckId(nextDeckId);
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/stats?${params.toString()}`);
  };

  const heatCells = Array.from({ length: 91 }, (_, index) => [0.12, 0.24, 0.42, 0.7][(index * 7 + 3) % 4]);

  return (
    <main className="min-h-screen bg-[#fcf9f4] font-[Manrope] text-[#1c1c19]">
      <div
        className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E)",
        }}
      />
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1c1c19]/10 bg-[#fcf9f4]/80 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <span className="font-['Newsreader'] text-2xl font-bold tracking-tight text-[#a33818]">Agy Decks</span>
          <nav className="hidden items-center gap-6 md:flex">
            <button type="button" onClick={() => router.push(`/decks/decks?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">
              Decks
            </button>
            <button type="button" onClick={() => router.push(`/decks/browse?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">
              Browse
            </button>
            <button type="button" className="border-b-2 border-[#a33818] pb-1 font-bold text-[#a33818]">
              Stats
            </button>
            <button type="button" onClick={() => router.push(`/decks/study?deckId=${deckId}`)} className="text-[#1c1c19]/60 hover:text-[#a33818]">
              Study
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <select value={deckId} onChange={(event) => updateDeck(event.target.value)} className="rounded-full bg-[#f0ede8] px-4 py-2 text-sm outline-none">
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
          <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-full bg-[#f0ede8] px-4 py-2 text-sm outline-none">
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="1y">1 year</option>
            <option value="deck_life">Deck life</option>
          </select>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <aside className="hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-[#1c1c19]/5 bg-[#fcf9f4] px-6 py-8 lg:flex">
          <div className="mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Library</h2>
            <p className="font-['Newsreader'] text-xl text-[#1c1c19]">The Workspace</p>
          </div>
          <nav className="flex-1 space-y-1">
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">My Decks</div>
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">Shared Decks</div>
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">Archive</div>
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">Trash</div>
          </nav>
          <button type="button" className="mb-6 w-full rounded-full bg-[#a33818] py-3 text-sm font-bold text-white">
            Create New Deck
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">Settings</div>
            <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#1c1c19]/70">Help</div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 pb-32 pt-8 lg:ml-0">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12">
              <h1 className="font-['Newsreader'] text-5xl italic text-[#1c1c19]">Knowledge Velocity</h1>
              <p className="mt-2 max-w-xl text-[#58423c]">
                {selectedDeck ? `Deep analytics and workload forecasting for ${selectedDeck.name}.` : "Deep analytics and workload forecasting for your intellectual inventory."}
              </p>
            </div>

            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: "Total Cards", value: fmt.format(stats?.summary.totalCards ?? 0), hint: `${selectedDeck?.name ?? "All decks"}` },
                { label: "Retention Rate", value: `${stats?.summary.retentionRate ?? 0}%`, hint: "Peak mastery" },
                { label: "Total Reviews", value: fmt.format(stats?.summary.totalReviews ?? 0), hint: "Lifetime" },
              ].map((item) => (
                <article key={item.label} className="flex h-40 flex-col justify-between rounded-xl bg-white p-7 shadow-[0_10px_30px_rgba(28,28,25,0.06)]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">{item.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-['Newsreader'] text-5xl ${item.label === "Retention Rate" ? "text-[#a33818]" : ""}`}>{item.value}</span>
                    <span className="text-xs font-bold text-[#58423c]">{item.hint}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <section className="rounded-xl bg-[#f6f3ee] p-8 lg:col-span-2">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="font-['Newsreader'] text-2xl">Workload Forecast</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">
                      Projected Reviews · Next {stats?.forecastMode === "weekly" ? "52 weeks" : "30 days"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-[0.16em]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#4d6356]" />
                      Stable
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#755717]" />
                      New
                    </div>
                  </div>
                </div>
                <div className="relative h-64">
                  <div className="absolute inset-0 flex items-end gap-2">
                    {(stats?.forecast ?? []).slice(0, 30).map((entry) => (
                      <div key={entry.day} className="flex min-w-0 flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t-full bg-gradient-to-t from-[#4d6356] to-[#cde6d5]"
                          style={{ height: `${Math.max(8, Math.round((entry.due / forecastMax) * 220))}px`, opacity: entry.due === 0 ? 0.18 : 1 }}
                        />
                        <span className="mt-3 truncate text-center text-[9px] font-bold uppercase tracking-[0.12em] text-[#58423c]">
                          {entry.day.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute inset-0">
                    {[25, 50, 75].map((line) => (
                      <div key={line} className="absolute left-0 right-0 border-t border-[#1c1c19]/5" style={{ top: `${100 - line}%` }} />
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-[#f6f3ee] p-8">
                <h3 className="font-['Newsreader'] text-2xl">Maturity</h3>
                <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Interval Distribution</p>
                <div className="space-y-6">
                  {maturity.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em]">
                        <span>{item.label}</span>
                        <span>{fmt.format(item.value)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e2dd]">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(8, Math.round((item.value / maturityMax) * 100))}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-12 rounded-lg bg-white p-5">
                  <p className="text-xs italic text-[#58423c]">
                    Month retention {stats?.retention.month ?? 0}% · Year retention {stats?.retention.year ?? 0}%.
                  </p>
                </div>
              </section>
            </div>

            <section className="rounded-xl bg-[#f0ede8] p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="font-['Newsreader'] text-2xl">Consistency Lattice</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4d6356]">Activity over the last 6 months</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#58423c]">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-sm bg-[#e5e2dd]" />
                    <span className="h-3 w-3 rounded-sm bg-[#4d6356]/30" />
                    <span className="h-3 w-3 rounded-sm bg-[#4d6356]/60" />
                    <span className="h-3 w-3 rounded-sm bg-[#4d6356]" />
                  </div>
                  <span>More</span>
                </div>
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
                {heatCells.map((opacity, index) => (
                  <div key={index} className="h-3 w-3 rounded-sm bg-[#4d6356]" style={{ opacity }} />
                ))}
              </div>
            </section>

            {status && <p className="mt-6 text-sm text-[#a33818]">{status}</p>}
          </div>
        </main>
      </div>
    </main>
  );
}
