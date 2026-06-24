"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

import { useDecksChrome } from "./decks-context";
import { DecksLibrarySidebar } from "./DecksLibrarySidebar";

export function DecksDecksView() {
  const router = useRouter();
  const { decks, loading, statusMessage, selectedDeckId } = useDecksChrome();

  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? null,
    [decks, selectedDeckId],
  );
  const selectedParentDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeck?.parent_id) ?? null,
    [decks, selectedDeck],
  );
  const visibleChildDecks = useMemo(
    () => decks.filter((deck) => deck.parent_id === (selectedParentDeck?.id ?? selectedDeck?.id ?? "")),
    [decks, selectedDeck, selectedParentDeck],
  );
  const totalCards =
    (selectedDeck?.counts.newCount ?? 0) +
    (selectedDeck?.counts.learningCount ?? 0) +
    (selectedDeck?.counts.reviewCount ?? 0);

  const openView = (view: "study" | "browse" | "stats") => {
    const params = new URLSearchParams();
    if (selectedDeckId) {
      params.set("deckId", selectedDeckId);
    }
    router.push(`/decks/${view}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
      <DecksLibrarySidebar />

      <section className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          <span>{selectedParentDeck?.name ?? "Library"}</span>
          <span aria-hidden="true">›</span>
          <span className="text-[#a33818]">{selectedDeck?.name ?? "Select a deck"}</span>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-[Newsreader] text-4xl text-[var(--color-text)] sm:text-5xl">
              {selectedDeck?.name ?? "Select a deck"}
            </h1>
            <p className="mt-3 max-w-xl text-[var(--color-text-muted)]">
              {selectedDeck
                ? "Inspect live counts, launch study, or branch into browse and stats."
                : "Choose a deck from the library sidebar."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => openView("browse")}>
              Browse cards
            </Button>
            <Button onClick={() => openView("study")}>Start study</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "New", value: selectedDeck?.counts.newCount ?? 0, color: "#a33818" },
            { label: "Learning", value: selectedDeck?.counts.learningCount ?? 0, color: "#4d6356" },
            { label: "Due for review", value: selectedDeck?.counts.reviewCount ?? 0, color: "#755717" },
          ].map((metric) => (
            <Panel key={metric.label} className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: metric.color }}>
                {metric.label}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-[Newsreader] text-4xl text-[var(--color-text)]">{metric.value}</span>
                <span className="text-sm text-[var(--color-text-muted)]">cards</span>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(8, Math.round((metric.value / Math.max(1, totalCards)) * 100))}%`,
                    backgroundColor: metric.color,
                  }}
                />
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="overflow-hidden">
          <div className="border-b border-[var(--color-border-muted)] px-6 py-4">
            <h2 className="font-[Newsreader] text-2xl text-[var(--color-text)]">Sub-decks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-muted)] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  <th className="px-6 py-3">Deck</th>
                  <th className="px-6 py-3">New</th>
                  <th className="px-6 py-3">Learning</th>
                  <th className="px-6 py-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {visibleChildDecks.length > 0 ? (
                  visibleChildDecks.map((deck) => (
                    <tr key={deck.id} className="border-b border-[var(--color-border-muted)] last:border-0">
                      <td className="px-6 py-4 font-medium text-[var(--color-text)]">{deck.name}</td>
                      <td className="px-6 py-4 font-semibold text-[#a33818]">{deck.counts.newCount}</td>
                      <td className="px-6 py-4 font-semibold text-[#4d6356]">{deck.counts.learningCount}</td>
                      <td className="px-6 py-4 font-semibold text-[#755717]">{deck.counts.reviewCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-[var(--color-text-muted)]">
                      No child decks for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="flex flex-wrap gap-4 border-t border-[var(--color-border-muted)] pt-4">
          <button type="button" onClick={() => openView("study")} className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[#a33818]">
            Custom study
          </button>
          <button type="button" onClick={() => openView("stats")} className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[#a33818]">
            Deck stats
          </button>
          <button type="button" onClick={() => openView("browse")} className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[#a33818]">
            Browse cards
          </button>
        </div>

        {statusMessage && (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
            {statusMessage}
          </p>
        )}
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading decks...</p>}
      </section>
    </div>
  );
}
