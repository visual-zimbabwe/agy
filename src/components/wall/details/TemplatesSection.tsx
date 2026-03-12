"use client";

import { detailButton, detailField, detailSectionCard, detailSectionTitle } from "@/components/wall/details/detailSectionStyles";
import type { TemplateType } from "@/features/wall/types";

type TemplateOption = {
  value: TemplateType;
  label: string;
};

type TemplatesSectionProps = {
  templateType: TemplateType;
  templateOptions: readonly TemplateOption[];
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
    <div className={detailSectionCard}>
      <p className={detailSectionTitle}>Templates</p>
      <div className="mt-2 flex items-center gap-2">
        <select
          value={templateType}
          onChange={(event) => onTemplateTypeChange(event.target.value as TemplateType)}
          className={`flex-1 ${detailField}`}
        >
          {templateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onApplyTemplate} disabled={isTimeLocked} className={detailButton}>
          Apply
        </button>
      </div>
    </div>
  );
};
