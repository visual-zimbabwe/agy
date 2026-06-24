"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

import { useDecksChrome } from "./decks-context";
import { toStringArray } from "./decks-types";

type DecksAddNoteModalProps = {
  open: boolean;
  onClose: () => void;
};

export const DecksAddNoteModal = ({ open, onClose }: DecksAddNoteModalProps) => {
  const { decks, noteTypes, selectedDeckId, reloadDecks, setStatusMessage } = useDecksChrome();
  const [addDeckId, setAddDeckId] = useState("");
  const [addNoteTypeId, setAddNoteTypeId] = useState("");
  const [addFields, setAddFields] = useState<Record<string, string>>({});
  const [addTags, setAddTags] = useState("");

  const effectiveDeckId = addDeckId || selectedDeckId || decks[0]?.id || "";
  const effectiveNoteTypeId = addNoteTypeId || noteTypes[0]?.id || "";

  const selectedNoteType = useMemo(
    () => noteTypes.find((entry) => entry.id === effectiveNoteTypeId) ?? null,
    [effectiveNoteTypeId, noteTypes],
  );
  const addNoteFields = useMemo(() => toStringArray(selectedNoteType?.fields), [selectedNoteType]);

  const handleCreateNote = async () => {
    const response = await fetch("/api/decks/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: effectiveDeckId,
        noteTypeId: effectiveNoteTypeId,
        fields: addFields,
        tags: addTags
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to create note.");
      return;
    }
    onClose();
    setAddFields({});
    setAddTags("");
    await reloadDecks();
    setStatusMessage("Note created.");
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Add Note"
      description="Create a deck note from a note type template."
      maxWidthClassName="max-w-4xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Deck</FieldLabel>
              <SelectField value={effectiveDeckId} onChange={(event) => setAddDeckId(event.target.value)}>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Note type</FieldLabel>
              <SelectField value={effectiveNoteTypeId} onChange={(event) => setAddNoteTypeId(event.target.value)}>
                {noteTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          {addNoteFields.map((field) => (
            <div key={field}>
              <FieldLabel>{field}</FieldLabel>
              <TextAreaField
                value={addFields[field] ?? ""}
                onChange={(event) => setAddFields((previous) => ({ ...previous, [field]: event.target.value }))}
                rows={field.length > 16 ? 4 : 3}
              />
            </div>
          ))}
          <div>
            <FieldLabel>Tags (comma-separated)</FieldLabel>
            <TextField
              value={addTags}
              onChange={(event) => setAddTags(event.target.value)}
              placeholder="biology, exam1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateNote()} disabled={!effectiveDeckId || !effectiveNoteTypeId}>
              Create note
            </Button>
          </div>
        </div>
        <aside className="rounded-[var(--radius-lg)] border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Preview</p>
          <h3 className="mt-2 font-[Newsreader] text-xl text-[var(--color-text)]">
            {selectedNoteType?.name ?? "Study note"}
          </h3>
          <div className="mt-4 space-y-3">
            {addNoteFields.map((field) => (
              <article
                key={field}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  {field}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text)]">{addFields[field]?.trim() || "Empty"}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </ModalShell>
  );
};
