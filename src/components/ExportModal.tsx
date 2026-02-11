"use client";

import { useState } from "react";

export type ExportScope = "whole" | "view" | "zone" | "selection";

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  onExportPng: (scope: ExportScope, pixelRatio: number) => void;
  onExportMarkdown: () => void;
};

export const ExportModal = ({ open, onClose, onExportPng, onExportMarkdown }: ExportModalProps) => {
  const [scope, setScope] = useState<ExportScope>("view");
  const [pixelRatio, setPixelRatio] = useState(2);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-zinc-900">Export</h2>
        <p className="mt-1 text-sm text-zinc-600">Create PNG snapshots or a Markdown reflection file.</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-zinc-800">PNG Scope</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { value: "whole", label: "Whole wall" },
              { value: "view", label: "Current view" },
              { value: "zone", label: "Selected zone" },
              { value: "selection", label: "Selected notes" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value as ExportScope)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  scope === option.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-zinc-800">Pixel Ratio</label>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={pixelRatio}
            onChange={(event) => setPixelRatio(Number(event.target.value))}
            className="w-full"
          />
          <p className="text-xs text-zinc-500">Current: {pixelRatio}x</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onExportPng(scope, pixelRatio)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
