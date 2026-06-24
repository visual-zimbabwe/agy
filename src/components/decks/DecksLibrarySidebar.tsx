"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";

import { useDecksChrome } from "./decks-context";

type DecksLibrarySidebarProps = {
  onDeckSelect?: (deckId: string) => void;
};

export const DecksLibrarySidebar = ({ onDeckSelect }: DecksLibrarySidebarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { decks, selectedDeckId, setSelectedDeckId, reloadDecks, setStatusMessage } = useDecksChrome();
  const [deckName, setDeckName] = useState("");
  const [parentId, setParentId] = useState("");

  const rootDecks = useMemo(() => decks.filter((deck) => deck.parent_id === null), [decks]);
  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? null,
    [decks, selectedDeckId],
  );
  const selectedParentDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeck?.parent_id) ?? null,
    [decks, selectedDeck],
  );

  const chooseDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    onDeckSelect?.(deckId);
    const next = new URLSearchParams(searchParams.toString());
    next.set("deckId", deckId);
    const pathname = window.location.pathname;
    router.replace(`${pathname}?${next.toString()}`);
  };

  const createDeck = async () => {
    const nextName = deckName.trim();
    if (!nextName) {
      return;
    }
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName, parentId: parentId || null }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to create deck.");
      return;
    }
    setDeckName("");
    setParentId("");
    await reloadDecks();
    setStatusMessage("Deck created.");
  };

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
      <Panel className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Library</p>
        <h2 className="mt-1 font-[Newsreader] text-2xl text-[var(--color-text)]">Decks</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {rootDecks.length} root · {decks.length} total
        </p>
      </Panel>

      <Panel className="min-h-0 flex-1 overflow-hidden p-3">
        <div className="max-h-[min(52vh,28rem)] space-y-1 overflow-y-auto pr-1">
          {rootDecks.map((rootDeck) => {
            const childDecks = decks.filter((deck) => deck.parent_id === rootDeck.id);
            const expanded =
              selectedDeck?.id === rootDeck.id || selectedParentDeck?.id === rootDeck.id;
            return (
              <div key={rootDeck.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => chooseDeck(childDecks[0]?.id ?? rootDeck.id)}
                  className={`w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition ${
                    expanded
                      ? "bg-[#a33818]/10 font-semibold text-[#a33818]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  {rootDeck.name}
                </button>
                {expanded && childDecks.length > 0 && (
                  <div className="space-y-1 pl-3">
                    {childDecks.map((deck) => {
                      const active = selectedDeckId === deck.id;
                      return (
                        <button
                          key={deck.id}
                          type="button"
                          onClick={() => chooseDeck(deck.id)}
                          className={`flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition ${
                            active
                              ? "bg-[#a33818]/10 font-semibold text-[#a33818]"
                              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                          }`}
                        >
                          <span>{deck.name}</span>
                          <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold">
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
          {decks.length === 0 && (
            <p className="px-3 py-4 text-sm text-[var(--color-text-muted)]">No decks yet.</p>
          )}
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <FieldLabel htmlFor="new-deck-name">Create deck</FieldLabel>
        <TextField
          id="new-deck-name"
          value={deckName}
          onChange={(event) => setDeckName(event.target.value)}
          placeholder="Deck name"
        />
        <SelectField value={parentId} onChange={(event) => setParentId(event.target.value)}>
          <option value="">No parent (root deck)</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </SelectField>
        <Button onClick={() => void createDeck()} disabled={!deckName.trim()} className="w-full">
          Create deck
        </Button>
      </Panel>
    </aside>
  );
};
