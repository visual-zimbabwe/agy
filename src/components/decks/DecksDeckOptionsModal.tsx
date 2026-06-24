"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";

import { useDecksChrome } from "./decks-context";

type DecksDeckOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  deckId: string;
};

export const DecksDeckOptionsModal = ({ open, onClose, deckId }: DecksDeckOptionsModalProps) => {
  const { decks, fsrsAvailable, reloadDecks, setStatusMessage } = useDecksChrome();
  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === deckId) ?? null, [decks, deckId]);
  const [fsrsEnabled, setFsrsEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && selectedDeck) {
      setFsrsEnabled(selectedDeck.scheduler_mode === "fsrs");
    }
  }, [open, selectedDeck]);

  const toggleFsrs = async (enabled: boolean) => {
    if (!fsrsAvailable) {
      setStatusMessage("FSRS requires the latest deck migration.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedulerMode: enabled ? "fsrs" : "legacy" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update scheduler.");
      }
      setFsrsEnabled(enabled);
      await reloadDecks();
      setStatusMessage(enabled ? "FSRS enabled for this deck." : "FSRS disabled for this deck.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update scheduler.");
    } finally {
      setBusy(false);
    }
  };

  const optimizeFsrs = async () => {
    if (!fsrsAvailable) {
      setStatusMessage("FSRS requires the latest deck migration.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/fsrs/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to optimize FSRS.");
      }
      setFsrsEnabled(true);
      await reloadDecks();
      if (payload.optimization?.fallbackToDefaults) {
        setStatusMessage(payload.message ?? "Applied default FSRS parameters.");
      } else {
        setStatusMessage(`FSRS optimized using ${payload.optimization?.reviewsAnalyzed ?? 0} reviews.`);
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to optimize FSRS.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Deck options" description="Scheduler and study settings.">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fsrsEnabled}
            disabled={busy || !fsrsAvailable}
            onChange={(event) => void toggleFsrs(event.target.checked)}
          />
          Use FSRS scheduler
        </label>
        {!fsrsAvailable && (
          <p className="text-sm text-[var(--color-text-muted)]">
            FSRS is unavailable until deck migrations are applied.
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void optimizeFsrs()} disabled={busy || !fsrsAvailable}>
            Optimize FSRS
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};
