"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FieldLabel, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";

import { useDecksChrome } from "./decks-context";
import { DecksLibrarySidebar } from "./DecksLibrarySidebar";
import type { BrowseRow } from "./decks-types";

export function DecksBrowseView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedDeckId, setSelectedDeckId } = useDecksChrome();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<BrowseRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const deckId = searchParams.get("deckId") ?? selectedDeckId;
  const selectedRow = useMemo(() => rows.find((row) => row.id === selectedRowId) ?? null, [rows, selectedRowId]);

  const fetchBrowse = async (nextDeckId: string, nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextDeckId) params.set("deckId", nextDeckId);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    params.set("includeChildren", "1");
    const response = await fetch(`/api/decks/browse?${params.toString()}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Failed to load browser.");
    return payload.rows ?? [];
  };

  useEffect(() => {
    if (!deckId) return;
    setSelectedDeckId(deckId);
  }, [deckId, setSelectedDeckId]);

  useEffect(() => {
    if (!deckId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const nextRows = await fetchBrowse(deckId, query);
        if (!cancelled) {
          setRows(nextRows);
          setSelectedRowId(nextRows[0]?.id ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Failed to load browse.");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [deckId, query]);

  const updateDeck = (nextDeckId: string) => {
    setSelectedDeckId(nextDeckId);
    const params = new URLSearchParams();
    params.set("deckId", nextDeckId);
    router.replace(`/decks/browse?${params.toString()}`);
  };

  const search = async () => {
    if (!deckId) return;
    const nextRows = await fetchBrowse(deckId, query);
    setRows(nextRows);
    setSelectedRowId(nextRows[0]?.id ?? "");
  };

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
    const nextRows = await fetchBrowse(deckId, query);
    setRows(nextRows);
    setSelectedRowId(nextRows[0]?.id ?? "");
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
    const nextRows = await fetchBrowse(deckId, query);
    setRows(nextRows);
    setSelectedRowId(nextRows[0]?.id ?? "");
  };

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
      <DecksLibrarySidebar onDeckSelect={updateDeck} />

      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <Panel className="flex flex-wrap items-center gap-3 p-4">
          <FieldLabel className="sr-only" htmlFor="browse-search">
            Search cards
          </FieldLabel>
          <TextField
            id="browse-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void search();
            }}
            placeholder="Search cards..."
            className="max-w-md flex-1"
          />
          <Button variant="secondary" onClick={() => void search()}>
            Search
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void runBulk("suspend")}>
              Suspend
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void runBulk("unsuspend")}>
              Unsuspend
            </Button>
            <Button size="sm" variant="danger" onClick={() => void runBulk("delete")}>
              Delete
            </Button>
          </div>
        </Panel>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel className="overflow-hidden">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[var(--color-surface-elevated)]">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3">Prompt</th>
                    <th className="px-4 py-3">Deck</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`cursor-pointer border-t border-[var(--color-border-muted)] ${
                        selectedRowId === row.id ? "bg-[#a33818]/5" : "hover:bg-[var(--color-surface-muted)]"
                      }`}
                      onClick={() => setSelectedRowId(row.id)}
                    >
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(row.id)}
                          onChange={(event) =>
                            setSelectedRowIds((previous) =>
                              event.target.checked
                                ? [...previous, row.id]
                                : previous.filter((entry) => entry !== row.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-text)]">{row.prompt}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{row.noteTypeName}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.deckName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {row.due_at ? row.due_at.slice(0, 10) : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase">
                          {row.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="flex flex-col p-4">
            <h3 className="font-[Newsreader] text-xl text-[var(--color-text)]">Card inspector</h3>
            {selectedRow ? (
              <div className="mt-4 flex flex-1 flex-col gap-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Front</p>
                    <p className="mt-1">{selectedRow.prompt}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Back</p>
                    <p className="mt-1 text-[var(--color-text-muted)]">{selectedRow.answer}</p>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void patchRow({ flagged: !selectedRow.note?.flagged })}>
                    {selectedRow.note?.flagged ? "Unflag" : "Flag"}
                  </Button>
                  <Button size="sm" onClick={() => void patchRow({ suspended: !selectedRow.note?.suspended })}>
                    {selectedRow.note?.suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">Select a card.</p>
            )}
            {status && <p className="mt-4 text-sm text-[#a33818]">{status}</p>}
          </Panel>
        </div>
      </section>
    </div>
  );
}
