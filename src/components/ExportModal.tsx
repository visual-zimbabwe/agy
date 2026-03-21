"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, SelectField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

export type ExportScope = "whole" | "view" | "zone" | "selection";

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  onExportPng: (scope: ExportScope, pixelRatio: number) => void;
  onExportPdf: (scope: ExportScope) => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onPublishSnapshot: () => void;
  backupReminderCadence: "off" | "daily" | "weekly";
  onBackupReminderCadenceChange: (cadence: "off" | "daily" | "weekly") => void;
};

export const ExportModal = ({
  open,
  onClose,
  onExportPng,
  onExportPdf,
  onExportMarkdown,
  onExportJson,
  onImportJson,
  onPublishSnapshot,
  backupReminderCadence,
  onBackupReminderCadenceChange,
}: ExportModalProps) => {
  const [scope, setScope] = useState<ExportScope>("view");
  const [pixelRatio, setPixelRatio] = useState(2);

  const runPrimaryExport = () => {
    onExportPng(scope, pixelRatio);
  };

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Export"
      description="Create exports and encrypted wall backups."
      maxWidthClassName="max-w-2xl"
    >
      <div
        className="space-y-3"
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            runPrimaryExport();
          }
        }}
      >
        <FieldLabel>PNG Scope</FieldLabel>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="radiogroup" aria-label="PNG scope">
            {[
              { value: "whole", label: "Whole wall" },
              { value: "view", label: "Current view" },
              { value: "zone", label: "Selected zone" },
              { value: "selection", label: "Selected notes" },
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => setScope(option.value as ExportScope)}
                role="radio"
                aria-checked={scope === option.value}
                variant={scope === option.value ? "primary" : "secondary"}
                size="md"
              >
                {option.label}
              </Button>
            ))}
        </div>

        <FieldLabel>Pixel Ratio</FieldLabel>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={pixelRatio}
          onChange={(event) => setPixelRatio(Number(event.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <p className="text-xs text-[var(--color-text-muted)]">Current: {pixelRatio}x</p>

        <FieldLabel className="mt-2">Backup Reminder</FieldLabel>
        <SelectField
          value={backupReminderCadence}
          onChange={(event) => onBackupReminderCadenceChange(event.target.value as "off" | "daily" | "weekly")}
        >
          <option value="off">Off</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </SelectField>
        <p className="text-xs text-[var(--color-text-muted)]">Optional reminder to download a full JSON backup.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" onClick={runPrimaryExport}>
          Export PNG
        </Button>
        <Button onClick={() => onExportPdf(scope)}>Export PDF</Button>
        <Button onClick={onExportMarkdown}>Export Markdown</Button>
        <Button onClick={onExportJson}>Export Encrypted Backup</Button>
        <label className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]">
            Import Backup
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImportJson(file);
                }
                event.currentTarget.value = "";
              }}
            />
        </label>
        <Button onClick={onPublishSnapshot}>Public Sharing Disabled</Button>
        <Button className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">Tip: Press Ctrl/Cmd + Enter to export PNG with current settings.</p>
    </ModalShell>
  );
};

