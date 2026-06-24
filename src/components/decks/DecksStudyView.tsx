"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

import { DecksCustomStudyModal } from "./DecksCustomStudyModal";
import { DecksDeckOptionsModal } from "./DecksDeckOptionsModal";
import { useDecksChrome } from "./decks-context";
import { DecksLibrarySidebar } from "./DecksLibrarySidebar";
import type { CustomStudyMode, DeckCounts, StudyCard, StudyLimits } from "./decks-types";

type StudyStage = "overview" | "session";

export function DecksStudyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { decks, selectedDeckId, setSelectedDeckId, reloadDecks, statusMessage, setStatusMessage } = useDecksChrome();
  const [stage, setStage] = useState<StudyStage>("overview");
  const [card, setCard] = useState<StudyCard | null>(null);
  const [counts, setCounts] = useState<DeckCounts>({ newCount: 0, learningCount: 0, reviewCount: 0 });
  const [limits, setLimits] = useState<StudyLimits | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [customStudyOpen, setCustomStudyOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [customSession, setCustomSession] = useState<{
    mode: CustomStudyMode;
    reschedule: boolean;
    cards: StudyCard[];
  } | null>(null);

  const deckId = searchParams.get("deckId") ?? selectedDeckId;
  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === deckId) ?? null, [decks, deckId]);
  const totalQueue = counts.newCount + counts.learningCount + counts.reviewCount;
  const progressPct =
    totalQueue === 0 ? 0 : Math.min(100, Math.round(((counts.learningCount + counts.reviewCount) / totalQueue) * 100));
  const isCustomActive = customSession !== null;

  const fetchStudy = async (nextDeckId: string) => {
    if (!nextDeckId) return null;
    const params = new URLSearchParams({ deckId: nextDeckId, includeChildren: "1", excludedDeckIds: "" });
    const response = await fetch(`/api/decks/study?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load study session.");
    return {
      card: (payload.card ?? null) as StudyCard | null,
      counts: (payload.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 }) as DeckCounts,
      limits: (payload.limits ?? null) as StudyLimits | null,
    };
  };

  useEffect(() => {
    if (deckId) setSelectedDeckId(deckId);
  }, [deckId, setSelectedDeckId]);

  useEffect(() => {
    if (!deckId || stage !== "overview") return;
    let cancelled = false;

    const load = async () => {
      try {
        const payload = await fetchStudy(deckId);
        if (!cancelled && payload) {
          setCounts(payload.counts);
          setLimits(payload.limits);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Failed to load study.");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [deckId, stage, setStatusMessage]);

  const chooseDeck = (nextDeckId: string) => {
    setSelectedDeckId(nextDeckId);
    resetCustomSession();
    setStage("overview");
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/study?${params.toString()}`);
  };

  const resetCustomSession = () => {
    setCustomSession(null);
  };

  const startStudy = async () => {
    if (!deckId) return;
    resetCustomSession();
    setStage("session");
    try {
      const payload = await fetchStudy(deckId);
      if (payload) {
        setCard(payload.card);
        setCounts(payload.counts);
        setLimits(payload.limits);
        setShowAnswer(false);
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to start study.");
    }
  };

  const rateCard = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!card || !deckId) return;

    if (isCustomActive) {
      if (customSession?.reschedule) {
        const response = await fetch("/api/decks/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: card.id, rating, studyDeckId: deckId, sessionType: "custom" }),
        });
        const payload = await response.json();
        if (!response.ok) {
          setStatusMessage(payload.error ?? "Failed to rate card.");
          return;
        }
        await reloadDecks();
      }
      setCustomSession((previous) => {
        if (!previous) return previous;
        const nextCards = previous.cards.filter((entry) => entry.id !== card.id);
        setCard(nextCards[0] ?? null);
        setShowAnswer(false);
        return { ...previous, cards: nextCards };
      });
      return;
    }

    const response = await fetch("/api/decks/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, rating, studyDeckId: deckId, sessionType: "default" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to rate card.");
      return;
    }
    const [studyPayload] = await Promise.all([fetchStudy(deckId), reloadDecks()]);
    if (studyPayload) {
      setCard(studyPayload.card);
      setCounts(studyPayload.counts);
      setLimits(studyPayload.limits);
      setShowAnswer(false);
    }
  };

  if (stage === "session") {
    return (
      <div className="relative flex min-h-[calc(100vh-8rem)] flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border-muted)] px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Study session</p>
            <h1 className="font-[Newsreader] text-2xl text-[var(--color-text)]">{selectedDeck?.name ?? "Study"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden w-48 items-center gap-2 md:flex">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full rounded-full bg-[#755717]" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{progressPct}%</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setStage("overview")}>
              Exit
            </Button>
          </div>
        </div>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <Panel className="w-full max-w-2xl p-10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2rem] text-[#755717]">Question</span>
            <h2 className="mt-4 font-[Newsreader] text-3xl italic leading-tight text-[var(--color-text)] md:text-4xl">
              {card?.prompt ?? "No due card available."}
            </h2>
            <div className="mx-auto my-8 h-px w-12 bg-[var(--color-border)]" />
            {showAnswer ? (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2rem] text-[#4d6356]">Answer</span>
                <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-muted)] md:text-xl">
                  {card?.answer ?? "Nothing to reveal."}
                </p>
              </div>
            ) : (
              <Button onClick={() => setShowAnswer(true)} disabled={!card}>
                Reveal answer
              </Button>
            )}
          </Panel>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            <span>{counts.newCount} new</span>
            <span>{counts.learningCount} learn</span>
            <span>{counts.reviewCount} due</span>
          </div>
          {limits && (
            <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
              Today: New {limits.remainingNew}/{limits.effectiveNewLimit}, Review {limits.remainingReview}/
              {limits.effectiveReviewLimit}
            </p>
          )}
        </main>

        <nav className="sticky bottom-0 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-glass)] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl justify-around">
            {(
              [
                ["again", "Again"],
                ["hard", "Hard"],
                ["good", "Good"],
                ["easy", "Easy"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => void rateCard(value)}
                disabled={!card || !showAnswer}
                className={`flex flex-col items-center rounded-full px-4 py-2 transition ${
                  value === "good"
                    ? "text-[#a33818]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                } disabled:opacity-40`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {statusMessage && (
          <p className="px-6 pb-4 text-center text-sm text-[#a33818]">{statusMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
      <DecksLibrarySidebar onDeckSelect={chooseDeck} />

      <section className="min-w-0 flex-1 space-y-6">
        <Panel className="p-6 lg:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Selected deck</p>
          <h1 className="mt-2 font-[Newsreader] text-4xl text-[var(--color-text)] sm:text-5xl">
            {selectedDeck?.name ?? "Select a deck"}
          </h1>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "New", value: counts.newCount },
              { label: "Learning", value: counts.learningCount },
              { label: "To review", value: counts.reviewCount },
            ].map((metric) => (
              <article
                key={metric.label}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
              </article>
            ))}
          </div>

          {limits && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Today limits: New {limits.remainingNew}/{limits.effectiveNewLimit}, Review {limits.remainingReview}/
              {limits.effectiveReviewLimit}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void startStudy()} disabled={!deckId}>
              Study now
            </Button>
            <Button variant="secondary" onClick={() => setCustomStudyOpen(true)} disabled={!deckId}>
              Custom study
            </Button>
            <Button variant="ghost" onClick={() => setOptionsOpen(true)} disabled={!deckId}>
              Options
            </Button>
          </div>
        </Panel>

        {statusMessage && (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
            {statusMessage}
          </p>
        )}
      </section>

      <DecksCustomStudyModal
        open={customStudyOpen}
        onClose={() => setCustomStudyOpen(false)}
        deckId={deckId}
        onSessionReady={(session) => {
          setCustomSession({ mode: session.mode, reschedule: session.reschedule, cards: session.cards });
          setCard(session.cards[0] ?? null);
          setCounts(session.counts);
          setShowAnswer(false);
          setStage("session");
        }}
      />
      <DecksDeckOptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} deckId={deckId} />
    </div>
  );
}
