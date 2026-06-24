"use client";

import { useEffect, useRef, useState } from "react";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import { TEMPLATE_TYPES } from "@/features/wall/constants";
import { LINK_TYPES } from "@/features/wall/constants";
import type { LinkType, TemplateType } from "@/features/wall/types";

type SpatialPreferences = {
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
};

export type WallStructureMenuProps = {
  isTimeLocked: boolean;
  publishedReadOnly: boolean;
  isChromeHidden: boolean;
  timelineViewActive: boolean;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  boxSelectMode: boolean;
  showClusters: boolean;
  spatialPrefs: SpatialPreferences;
  templateType: TemplateType;
  presentationMode: boolean;
  readingMode: boolean;
  showHeatmap: boolean;
  timelineMode: boolean;
  toolbarBtn: string;
  toolbarBtnActive: string;
  toolbarSelect: string;
  onCreateZone: () => void;
  onStartLinking: () => void;
  onLinkTypeChange: (value: LinkType) => void;
  onToggleBoxSelect: () => void;
  onToggleSnapToGrid: () => void;
  onToggleSnapToGuides: () => void;
  onToggleClusters: () => void;
  onToggleDotMatrix: () => void;
  onTemplateTypeChange: (value: TemplateType) => void;
  onApplyTemplate: () => void;
  onTogglePresentationMode: () => void;
  onToggleReadingMode: () => void;
  onToggleHeatmap: () => void;
  onToggleTimelineMode: () => void;
  onOpenFileConversion: (mode?: "pdf_to_word" | "word_to_pdf") => void;
};

const menuButtonClass =
  "flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-left text-[13px] text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-45";

const activeMenuButtonClass = `${menuButtonClass} bg-[var(--color-surface-muted)] text-[var(--color-accent-strong)]`;

export const WallStructureMenu = ({
  isTimeLocked,
  publishedReadOnly,
  isChromeHidden,
  timelineViewActive,
  selectedNoteId,
  linkingFromNoteId,
  linkType,
  boxSelectMode,
  showClusters,
  spatialPrefs,
  templateType,
  presentationMode,
  readingMode,
  showHeatmap,
  timelineMode,
  toolbarBtn,
  toolbarBtnActive,
  toolbarSelect,
  onCreateZone,
  onStartLinking,
  onLinkTypeChange,
  onToggleBoxSelect,
  onToggleSnapToGrid,
  onToggleSnapToGuides,
  onToggleClusters,
  onToggleDotMatrix,
  onTemplateTypeChange,
  onApplyTemplate,
  onTogglePresentationMode,
  onToggleReadingMode,
  onToggleHeatmap,
  onToggleTimelineMode,
  onOpenFileConversion,
}: WallStructureMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (publishedReadOnly || isChromeHidden || timelineViewActive) {
    return null;
  }

  return (
    <div ref={rootRef} className="pointer-events-auto absolute left-5 top-24 z-[33]">
      <ControlTooltip label="Structure and wall tools" side="right">
        <button
          type="button"
          data-tour-anchor="structure-menu"
          onClick={() => setOpen((value) => !value)}
          className={open ? toolbarBtnActive : toolbarBtn}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Icon name="layout" />
          <span>Structure</span>
        </button>
      </ControlTooltip>

      {open ? (
        <div
          role="menu"
          className="mt-2 w-[18rem] max-h-[calc(100vh-10rem)] overflow-y-auto rounded-[24px] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-surface-elevated)_92%,white_8%)] p-3 shadow-[var(--shadow-lg)] backdrop-blur-xl"
        >
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Structure</p>
          <div className="mt-2 grid gap-1">
            <button type="button" role="menuitem" disabled={isTimeLocked} onClick={onCreateZone} className={menuButtonClass}>
              <Icon name="zone" />
              <span>New zone</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!selectedNoteId || isTimeLocked}
              onClick={onStartLinking}
              className={linkingFromNoteId ? activeMenuButtonClass : menuButtonClass}
            >
              <Icon name="link" />
              <span>{linkingFromNoteId ? "Pick link target" : "Link notes"}</span>
            </button>
            <select
              value={linkType}
              onChange={(event) => onLinkTypeChange(event.target.value as LinkType)}
              className={`${toolbarSelect} mt-1`}
              aria-label="Link type"
            >
              {LINK_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" role="menuitem" onClick={onToggleBoxSelect} className={boxSelectMode ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="box" />
              <span>Box select</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onToggleSnapToGrid}
              className={spatialPrefs.snapToGrid ? activeMenuButtonClass : menuButtonClass}
            >
              <Icon name="layout" />
              <span>{spatialPrefs.snapToGrid ? "Snap to grid on" : "Snap to grid"}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onToggleSnapToGuides}
              className={spatialPrefs.snapToGuides ? activeMenuButtonClass : menuButtonClass}
            >
              <Icon name="layout" />
              <span>{spatialPrefs.snapToGuides ? "Snap to guides on" : "Snap to guides"}</span>
            </button>
            <button type="button" role="menuitem" onClick={onToggleClusters} className={showClusters ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="cluster" />
              <span>{showClusters ? "Hide clusters" : "Show clusters"}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onToggleDotMatrix}
              className={spatialPrefs.showDotMatrix ? activeMenuButtonClass : menuButtonClass}
            >
              <Icon name="layout" />
              <span>{spatialPrefs.showDotMatrix ? "Hide dot matrix" : "Dot matrix"}</span>
            </button>
          </div>

          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Template</p>
          <div className="mt-2 grid gap-1 px-1">
            <select
              value={templateType}
              onChange={(event) => onTemplateTypeChange(event.target.value as TemplateType)}
              className={toolbarSelect}
              aria-label="Template type"
              disabled={isTimeLocked}
            >
              {TEMPLATE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" role="menuitem" disabled={isTimeLocked} onClick={onApplyTemplate} className={menuButtonClass}>
              <Icon name="note" />
              <span>Apply template</span>
            </button>
          </div>

          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">View</p>
          <div className="mt-2 grid gap-1">
            <button type="button" role="menuitem" onClick={onTogglePresentationMode} className={presentationMode ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="present" />
              <span>{presentationMode ? "Exit presentation mode" : "Presentation mode"}</span>
            </button>
            <button type="button" role="menuitem" onClick={onToggleReadingMode} className={readingMode ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="note" />
              <span>{readingMode ? "Exit reading mode" : "Reading mode"}</span>
            </button>
            <button type="button" role="menuitem" onClick={onToggleHeatmap} className={showHeatmap ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="layout" />
              <span>{showHeatmap ? "Hide heatmap" : "Heatmap"}</span>
            </button>
            <button type="button" role="menuitem" onClick={onToggleTimelineMode} className={timelineMode ? activeMenuButtonClass : menuButtonClass}>
              <Icon name="timeline" />
              <span>{timelineMode ? "Exit wall history" : "Wall history replay"}</span>
            </button>
          </div>

          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Files</p>
          <div className="mt-2 grid gap-1">
            <button type="button" role="menuitem" onClick={() => onOpenFileConversion("pdf_to_word")} className={menuButtonClass}>
              <Icon name="export" />
              <span>PDF to Word</span>
            </button>
            <button type="button" role="menuitem" onClick={() => onOpenFileConversion("word_to_pdf")} className={menuButtonClass}>
              <Icon name="export" />
              <span>Word to PDF</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
