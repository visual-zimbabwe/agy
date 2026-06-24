"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

import { useDecksChrome } from "./decks-context";
import type { CustomStateFilter, CustomStudyMode, CustomStudySessionPayload, StudyCard } from "./decks-types";

type DecksCustomStudyModalProps = {
  open: boolean;
  onClose: () => void;
  deckId: string;
  onSessionReady: (session: {
    mode: CustomStudyMode;
    reschedule: boolean;
    cards: StudyCard[];
    counts: { newCount: number; learningCount: number; reviewCount: number };
  }) => void;
};

const studyModes: Array<{ value: CustomStudyMode; label: string }> = [
  { value: "increase_new", label: "Increase today's new limit" },
  { value: "increase_review", label: "Increase today's review limit" },
  { value: "forgotten", label: "Review forgotten cards" },
  { value: "ahead", label: "Review ahead" },
  { value: "preview_new", label: "Preview new cards" },
  { value: "state_tag", label: "Study by state or tag" },
];

const stateFilters: Array<{ value: CustomStateFilter; label: string }> = [
  { value: "new", label: "New cards" },
  { value: "due", label: "Due cards" },
  { value: "all_random", label: "All cards in random order" },
  { value: "all_added", label: "All cards in added order" },
];

export const DecksCustomStudyModal = ({
  open,
  onClose,
  deckId,
  onSessionReady,
}: DecksCustomStudyModalProps) => {
  const { setStatusMessage } = useDecksChrome();
  const [mode, setMode] = useState<CustomStudyMode>("increase_new");
  const [limit, setLimit] = useState(20);
  const [days, setDays] = useState(7);
  const [stateFilter, setStateFilter] = useState<CustomStateFilter>("all_random");
  const [reschedule, setReschedule] = useState(true);
  const [includedTags, setIncludedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);

  const loadTags = useCallback(async () => {
    if (!deckId) return;
    const params = new URLSearchParams({ deckId, includeChildren: "1", excludedDeckIds: "" });
    const response = await fetch(`/api/decks/tags?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setAvailableTags(Array.isArray(payload.tags) ? payload.tags.map((tag: unknown) => String(tag)) : []);
    }
  }, [deckId]);

  useEffect(() => {
    if (open) {
      void loadTags();
      setReschedule(mode !== "preview_new");
    }
  }, [open, loadTags, mode]);

  const cycleTag = (tag: string) => {
    if (includedTags.includes(tag)) {
      setIncludedTags((previous) => previous.filter((entry) => entry !== tag));
      setExcludedTags((previous) => [...previous, tag]);
      return;
    }
    if (excludedTags.includes(tag)) {
      setExcludedTags((previous) => previous.filter((entry) => entry !== tag));
      return;
    }
    setIncludedTags((previous) => [...previous, tag]);
  };

  const handleCreate = async () => {
    setBuilding(true);
    try {
      const response = await fetch("/api/decks/custom-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId,
          includeChildren: true,
          excludedDeckIds: [],
          mode,
          limit,
          days,
          stateFilter,
          tagsInclude: includedTags,
          tagsExclude: excludedTags,
          reschedule,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create custom study session.");
      }

      if (payload.override?.applied) {
        onClose();
        setStatusMessage(
          mode === "increase_new"
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

      onSessionReady({
        mode: session.mode,
        reschedule: session.reschedule,
        cards,
        counts: session.counts ?? { newCount: 0, learningCount: 0, reviewCount: 0 },
      });
      onClose();
      setStatusMessage(
        cards.length === 0
          ? "No cards matched this custom study selection."
          : `Custom study ready with ${cards.length} cards.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to create custom study.");
    } finally {
      setBuilding(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Custom study" description="Build a filtered study session.">
      <div className="space-y-4">
        <div>
          <FieldLabel>Mode</FieldLabel>
          <SelectField value={mode} onChange={(event) => setMode(event.target.value as CustomStudyMode)}>
            {studyModes.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </SelectField>
        </div>

        {(mode === "forgotten" || mode === "ahead" || mode === "state_tag") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Limit</FieldLabel>
              <TextField type="number" value={String(limit)} onChange={(event) => setLimit(Number(event.target.value))} />
            </div>
            {(mode === "forgotten" || mode === "ahead") && (
              <div>
                <FieldLabel>Days</FieldLabel>
                <TextField type="number" value={String(days)} onChange={(event) => setDays(Number(event.target.value))} />
              </div>
            )}
          </div>
        )}

        {mode === "state_tag" && (
          <div>
            <FieldLabel>State filter</FieldLabel>
            <SelectField
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value as CustomStateFilter)}
            >
              {stateFilters.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </SelectField>
          </div>
        )}

        {mode === "state_tag" && availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const included = includedTags.includes(tag);
              const excluded = excludedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => cycleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    included
                      ? "border-[#4d6356] bg-[#4d6356]/10 text-[#4d6356]"
                      : excluded
                        ? "border-[#ba1a1a] bg-[#ba1a1a]/10 text-[#ba1a1a]"
                        : "border-[var(--color-border)]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {mode !== "increase_new" && mode !== "increase_review" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reschedule} onChange={(event) => setReschedule(event.target.checked)} />
            Reschedule cards based on answers
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={building || !deckId}>
            Start custom study
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};
