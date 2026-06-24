"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

import { parseImportText } from "./decks-import-utils";
import { useDecksChrome } from "./decks-context";
import type { ImportPreset } from "./decks-types";
import { toStringArray } from "./decks-types";

type DecksImportModalProps = {
  open: boolean;
  onClose: () => void;
};

export const DecksImportModal = ({ open, onClose }: DecksImportModalProps) => {
  const { decks, noteTypes, selectedDeckId, reloadDecks, setStatusMessage } = useDecksChrome();
  const [addDeckId, setAddDeckId] = useState("");
  const [addNoteTypeId, setAddNoteTypeId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFrontColumn, setImportFrontColumn] = useState("");
  const [importBackColumn, setImportBackColumn] = useState("");
  const [importTagsColumn, setImportTagsColumn] = useState("");
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importPresets, setImportPresets] = useState<ImportPreset[]>([]);
  const [importPresetName, setImportPresetName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, imported: 0 });

  const selectedNoteType = useMemo(
    () => noteTypes.find((entry) => entry.id === addNoteTypeId) ?? null,
    [addNoteTypeId, noteTypes],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAddDeckId(selectedDeckId || decks[0]?.id || "");
    setAddNoteTypeId((current) => current || noteTypes[0]?.id || "");
    void fetch("/api/decks/import-presets", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setImportPresets(Array.isArray(payload.presets) ? payload.presets : []))
      .catch(() => setImportPresets([]));
  }, [open, selectedDeckId, decks, noteTypes]);

  const handleFileChange = async (file: File | null) => {
    setImportFile(file);
    if (!file) {
      setImportColumns([]);
      return;
    }
    const raw = await file.text();
    const parsed = parseImportText(raw);
    setImportColumns(parsed.columns);
    setImportFrontColumn(parsed.columns[0] ?? "");
    setImportBackColumn(parsed.columns[1] ?? "");
    setImportTagsColumn(parsed.columns[2] ?? "");
  };

  const applyPreset = (preset: ImportPreset) => {
    setAddDeckId(preset.mapping.deckId);
    setAddNoteTypeId(preset.mapping.noteTypeId);
    setImportFrontColumn(preset.mapping.frontColumn);
    setImportBackColumn(preset.mapping.backColumn);
    setImportTagsColumn(preset.mapping.tagsColumn);
  };

  const handleSavePreset = async () => {
    const response = await fetch("/api/decks/import-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: importPresetName,
        mapping: {
          deckId: addDeckId,
          noteTypeId: addNoteTypeId,
          frontColumn: importFrontColumn,
          backColumn: importBackColumn,
          tagsColumn: importTagsColumn,
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusMessage(payload.error ?? "Failed to save preset.");
      return;
    }
    setImportPresetName("");
    const reload = await fetch("/api/decks/import-presets", { cache: "no-store" });
    const reloadPayload = await reload.json();
    setImportPresets(Array.isArray(reloadPayload.presets) ? reloadPayload.presets : []);
    setStatusMessage("Import preset saved.");
  };

  const handleImport = async () => {
    if (!importFile) {
      setStatusMessage("Choose a CSV or TXT file.");
      return;
    }
    const raw = await importFile.text();
    const parsed = parseImportText(raw);
    if (parsed.rows.length === 0) {
      setStatusMessage("Import file has no card rows.");
      return;
    }
    const frontIndex = parsed.columns.indexOf(importFrontColumn);
    const backIndex = parsed.columns.indexOf(importBackColumn);
    const tagsIndex = parsed.columns.indexOf(importTagsColumn);
    if (frontIndex < 0 || backIndex < 0) {
      setStatusMessage("Pick valid front and back columns.");
      return;
    }

    const rowsToImport = parsed.rows.filter((row) => {
      const front = row[frontIndex] ?? "";
      const back = row[backIndex] ?? "";
      return Boolean(front.trim() || back.trim());
    });

    setIsImporting(true);
    setImportProgress({ processed: 0, total: rowsToImport.length, imported: 0 });

    let imported = 0;
    try {
      const noteTypeFields = toStringArray(selectedNoteType?.fields);
      const fieldKeyA = noteTypeFields[0] ?? "Front";
      const fieldKeyB = noteTypeFields[1] ?? "Back";

      for (const [index, row] of rowsToImport.entries()) {
        const front = row[frontIndex] ?? "";
        const back = row[backIndex] ?? "";
        const tags =
          tagsIndex >= 0
            ? (row[tagsIndex] ?? "").split(";").map((entry) => entry.trim()).filter(Boolean)
            : [];
        const response = await fetch("/api/decks/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId: addDeckId,
            noteTypeId: addNoteTypeId,
            fields: { [fieldKeyA]: front, [fieldKeyB]: back },
            tags,
          }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Import failed.");
        }
        imported += 1;
        setImportProgress({ processed: index + 1, total: rowsToImport.length, imported });
      }
      onClose();
      setImportFile(null);
      await reloadDecks();
      setStatusMessage(`Import complete: ${imported} notes added.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Import cards"
      description="Import deck-native notes from CSV or tab-separated text."
      maxWidthClassName="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Deck</FieldLabel>
            <SelectField value={addDeckId} onChange={(event) => setAddDeckId(event.target.value)}>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div>
            <FieldLabel>Note type</FieldLabel>
            <SelectField value={addNoteTypeId} onChange={(event) => setAddNoteTypeId(event.target.value)}>
              {noteTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        <div>
          <FieldLabel>File</FieldLabel>
          <input
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>

        {importColumns.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Front column</FieldLabel>
              <SelectField value={importFrontColumn} onChange={(event) => setImportFrontColumn(event.target.value)}>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Back column</FieldLabel>
              <SelectField value={importBackColumn} onChange={(event) => setImportBackColumn(event.target.value)}>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
            <div>
              <FieldLabel>Tags column</FieldLabel>
              <SelectField value={importTagsColumn} onChange={(event) => setImportTagsColumn(event.target.value)}>
                <option value="">None</option>
                {importColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        )}

        {importPresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {importPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <TextField
            value={importPresetName}
            onChange={(event) => setImportPresetName(event.target.value)}
            placeholder="Preset name"
          />
          <Button variant="secondary" onClick={() => void handleSavePreset()} disabled={!importPresetName.trim()}>
            Save preset
          </Button>
        </div>

        {isImporting && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Importing {importProgress.imported}/{importProgress.total}...
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={() => void handleImport()} disabled={isImporting || !importFile}>
            Import
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};
