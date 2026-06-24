"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Panel } from "@/components/ui/Panel";

import { useDecksChrome } from "./decks-context";
import { DecksLibrarySidebar } from "./DecksLibrarySidebar";
import type { StatsPayload } from "./decks-types";

const fmt = new Intl.NumberFormat();

export function DecksStatsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { decks, selectedDeckId, setSelectedDeckId, statusMessage } = useDecksChrome();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [range, setRange] = useState("30d");
  const [status, setStatus] = useState("");

  const deckId = searchParams.get("deckId") ?? selectedDeckId;
  const deck = useMemo(() => decks.find((entry) => entry.id === deckId) ?? null, [decks, deckId]);

  const forecastMax = useMemo(() => Math.max(1, ...(stats?.forecast ?? []).map((entry) => entry.due)), [stats]);
  const maturity = useMemo(
    () => [
      { label: "Learning (0-2d)", value: stats?.intervals?.under1 ?? 0, color: "#a33818" },
      {
        label: "Young (2d-21d)",
        value: (stats?.intervals?.d1to6 ?? 0) + (stats?.intervals?.d7to20 ?? 0),
        color: "#4d6356",
      },
      {
        label: "Mature (>21d)",
        value: (stats?.intervals?.d21to90 ?? 0) + (stats?.intervals?.over90 ?? 0),
        color: "#755717",
      },
    ],
    [stats],
  );
  const maturityMax = useMemo(() => Math.max(1, ...maturity.map((item) => item.value)), [maturity]);
  const heatCells = Array.from({ length: 91 }, (_, index) => [0.12, 0.24, 0.42, 0.7][(index * 7 + 3) % 4]);

  const fetchStats = async (nextDeckId: string, nextRange: string) => {
    if (!nextDeckId) return null;
    const params = new URLSearchParams({ deckId: nextDeckId, includeChildren: "1", range: nextRange });
    const response = await fetch(`/api/decks/stats?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load stats.");
    return payload as StatsPayload;
  };

  useEffect(() => {
    if (deckId) setSelectedDeckId(deckId);
  }, [deckId, setSelectedDeckId]);

  useEffect(() => {
    if (!deckId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const nextStats = await fetchStats(deckId, range);
        if (!cancelled) setStats(nextStats);
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Failed to load stats.");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [deckId, range]);

  const updateDeck = (nextDeckId: string) => {
    setSelectedDeckId(nextDeckId);
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/stats?${params.toString()}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
      <DecksLibrarySidebar onDeckSelect={updateDeck} />

      <section className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Newsreader] text-4xl text-[var(--color-text)] sm:text-5xl">Deck stats</h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
              {deck ? `Analytics for ${deck.name}.` : "Select a deck to view analytics."}
            </p>
          </div>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm outline-none"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="1y">1 year</option>
            <option value="deck_life">Deck life</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Total cards", value: fmt.format(stats?.summary.totalCards ?? 0) },
            { label: "Retention rate", value: `${stats?.summary.retentionRate ?? 0}%` },
            { label: "Total reviews", value: fmt.format(stats?.summary.totalReviews ?? 0) },
          ].map((item) => (
            <Panel key={item.label} className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {item.label}
              </p>
              <p className="mt-3 font-[Newsreader] text-4xl text-[var(--color-text)]">{item.value}</p>
            </Panel>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel className="p-6 lg:col-span-2">
            <h2 className="font-[Newsreader] text-2xl text-[var(--color-text)]">Workload forecast</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Next {stats?.forecastMode === "weekly" ? "52 weeks" : "30 days"}
            </p>
            <div className="relative mt-8 h-56">
              <div className="absolute inset-0 flex items-end gap-1">
                {(stats?.forecast ?? []).slice(0, 30).map((entry) => (
                  <div key={entry.day} className="flex min-w-0 flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-full bg-gradient-to-t from-[#4d6356] to-[#cde6d5]"
                      style={{
                        height: `${Math.max(8, Math.round((entry.due / forecastMax) * 200))}px`,
                        opacity: entry.due === 0 ? 0.18 : 1,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-[Newsreader] text-2xl text-[var(--color-text)]">Maturity</h2>
            <div className="mt-6 space-y-5">
              {maturity.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em]">
                    <span>{item.label}</span>
                    <span>{fmt.format(item.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(8, Math.round((item.value / maturityMax) * 100))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-[var(--color-text-muted)]">
              Month retention {stats?.retention?.month ?? 0}% · Year retention {stats?.retention?.year ?? 0}%.
            </p>
          </Panel>
        </div>

        <Panel className="p-6">
          <h2 className="font-[Newsreader] text-2xl text-[var(--color-text)]">Activity lattice</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Last 6 months
          </p>
          <div className="mt-6 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
            {heatCells.map((opacity, index) => (
              <div key={index} className="h-3 w-3 rounded-sm bg-[#4d6356]" style={{ opacity }} />
            ))}
          </div>
        </Panel>

        {(status || statusMessage) && (
          <p className="text-sm text-[#a33818]">{status || statusMessage}</p>
        )}
      </section>
    </div>
  );
}
