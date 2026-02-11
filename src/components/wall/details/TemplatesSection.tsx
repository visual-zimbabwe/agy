"use client";

import type { TemplateType } from "@/features/wall/types";

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type TemplatesSectionProps = {
  templateType: TemplateType;
  templateOptions: TemplateOption[];
  isTimeLocked: boolean;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
};

export const TemplatesSection = ({
  templateType,
  templateOptions,
  isTimeLocked,
  onTemplateTypeChange,
  onApplyTemplate,
}: TemplatesSectionProps) => {
  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">Templates</p>
      <div className="mt-2 flex items-center gap-2">
        <select
          value={templateType}
          onChange={(event) => onTemplateTypeChange(event.target.value as TemplateType)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs"
        >
          {templateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onApplyTemplate} disabled={isTimeLocked} className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs disabled:opacity-45">
          Apply
        </button>
      </div>
    </div>
  );
};
