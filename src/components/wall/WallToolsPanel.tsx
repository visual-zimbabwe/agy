"use client";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import { panelCloseBtn, wallPanelSurface } from "@/components/wall/wallChromeClasses";
import type { LinkType, ZoneKind } from "@/features/wall/types";

type LinkTypeOption = {
  value: LinkType;
  label: string;
};

type WallToolsPanelProps = {
  leftPanelOpen: boolean;
  isTimeLocked: boolean;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  linkTypeOptions: readonly LinkTypeOption[];
  showClusters: boolean;
  toolbarBtn: string;
  toolbarBtnPrimary: string;
  toolbarBtnActive: string;
  toolbarSelect: string;
  onClose: () => void;
  onCreateNote: () => void;
  onCreateCanonNote: () => void;
  onCreateJournalNote: () => void;
  onCreateQuoteNote: () => void;
  onCreateEisenhowerNote: () => void;
  onCreateWordNote: () => void;
  onCreateZone: (kind?: ZoneKind) => void;
  onToggleBoxSelect: () => void;
  boxSelectMode: boolean;
  onStartLinking: () => void;
  onLinkTypeChange: (value: LinkType) => void;
  onToggleClusters: () => void;
  showDotMatrix: boolean;
  snapToGuides: boolean;
  snapToGrid: boolean;
  onToggleDotMatrix: () => void;
  onToggleSnapToGuides: () => void;
  onToggleSnapToGrid: () => void;
  controlsMode: "basic" | "advanced";
  onOpenFileConversion: (mode: "pdf_to_word" | "word_to_pdf") => void;
};

export const WallToolsPanel = ({
  leftPanelOpen,
  isTimeLocked,
  selectedNoteId,
  linkingFromNoteId,
  linkType,
  linkTypeOptions,
  showClusters,
  toolbarBtn,
  toolbarBtnPrimary,
  toolbarBtnActive,
  toolbarSelect,
  onClose,
  onCreateNote,
  onCreateCanonNote,
  onCreateJournalNote,
  onCreateQuoteNote,
  onCreateEisenhowerNote,
  onCreateWordNote,
  onCreateZone,
  onToggleBoxSelect,
  boxSelectMode,
  onStartLinking,
  onLinkTypeChange,
  onToggleClusters,
  showDotMatrix,
  snapToGuides,
  snapToGrid,
  onToggleDotMatrix,
  onToggleSnapToGuides,
  onToggleSnapToGrid,
  controlsMode,
  onOpenFileConversion,
}: WallToolsPanelProps) => {
  const advancedMode = controlsMode === "advanced";

  return (
    <aside
      className={`${wallPanelSurface} left-4 top-10 w-48 p-3 ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Tools</p>
        <button type="button" onClick={onClose} className={panelCloseBtn}>
          Close
        </button>
      </div>
      <div className="space-y-1.5">
        <ControlTooltip label="Create note at viewport center" shortcut="N or Ctrl/Cmd + N" className="relative block" side="right">
          <button type="button" onClick={onCreateNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtnPrimary}`} title="Create note (N or Ctrl/Cmd + N)">
            <Icon name="note" />
            <span>New Note</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create vocabulary word note" className="relative block" side="right">
          <button type="button" onClick={onCreateWordNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create vocabulary word note">
            <Icon name="note" />
            <span>New Word</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create journal note with notebook styling" className="relative block" side="right">
          <button type="button" onClick={onCreateJournalNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create journal note">
            <Icon name="note" />
            <span>New Journal</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create quote note with attribution fields" className="relative block" side="right">
          <button type="button" onClick={onCreateQuoteNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create quote note">
            <Icon name="note" />
            <span>New Quote</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create an Eisenhower Matrix note" className="relative block" side="right">
          <button type="button" onClick={onCreateEisenhowerNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create Eisenhower Matrix note">
            <Icon name="layout" />
            <span>Eisenhower Matrix</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create canon note for laws/rules/theorems" className="relative block" side="right">
          <button type="button" onClick={onCreateCanonNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create canon note">
            <Icon name="note" />
            <span>New Canon</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create zone at viewport center" className="relative block" side="right">
          <button type="button" onClick={() => onCreateZone("frame")} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create frame at viewport center">
            <Icon name="zone" />
            <span>New Frame</span>
          </button>
        </ControlTooltip>
        {advancedMode && (
          <ControlTooltip label="Create suggested column area" className="relative block" side="right">
            <button type="button" onClick={() => onCreateZone("column")} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create column at viewport center">
              <Icon name="zone" />
              <span>New Column</span>
            </button>
          </ControlTooltip>
        )}
        {advancedMode && (
          <ControlTooltip label="Create suggested swimlane area" className="relative block" side="right">
            <button type="button" onClick={() => onCreateZone("swimlane")} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create swimlane at viewport center">
              <Icon name="zone" />
              <span>New Swimlane</span>
            </button>
          </ControlTooltip>
        )}
        <ControlTooltip label="Toggle box selection mode" className="relative block" side="right">
          <button
            type="button"
            onClick={onToggleBoxSelect}
            className={`w-full justify-start ${boxSelectMode ? toolbarBtnActive : toolbarBtn}`}
            title="Toggle box selection mode"
          >
            <Icon name="box" />
            <span>Box Select</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Start linking from selected note" shortcut="Ctrl/Cmd + L" className="relative block" side="right">
          <button
            type="button"
            onClick={onStartLinking}
            disabled={!selectedNoteId || isTimeLocked}
            className={`w-full justify-start ${linkingFromNoteId ? toolbarBtnActive : toolbarBtn}`}
            title="Start linking (Ctrl/Cmd + L)"
          >
            <Icon name="link" />
            <span>{linkingFromNoteId ? "Pick Link Target" : "Start Link"}</span>
          </button>
        </ControlTooltip>
        {advancedMode && (
          <ControlTooltip label="Pick link type" className="relative block" side="right">
            <select value={linkType} onChange={(event) => onLinkTypeChange(event.target.value as LinkType)} className={`w-full ${toolbarSelect}`} title="Pick link type">
              {linkTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ControlTooltip>
        )}
        {advancedMode && (
          <ControlTooltip label="Toggle automatic cluster outlines" className="relative block" side="right">
            <button
              type="button"
              onClick={onToggleClusters}
              className={`w-full justify-start ${showClusters ? toolbarBtnActive : toolbarBtn}`}
              title="Toggle cluster outlines"
            >
              <Icon name="cluster" />
              <span>Detect Clusters</span>
            </button>
          </ControlTooltip>
        )}
        <div className="my-2 border-t border-[var(--color-border)]/70" />
        <ControlTooltip label="Convert PDF files to Word documents" className="relative block" side="right">
          <button
            type="button"
            onClick={() => onOpenFileConversion("pdf_to_word")}
            className={`w-full justify-start ${toolbarBtn}`}
            title="Open PDF to Word converter"
          >
            <Icon name="export" />
            <span>PDF to Word</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Convert Word documents to PDF files" className="relative block" side="right">
          <button
            type="button"
            onClick={() => onOpenFileConversion("word_to_pdf")}
            className={`w-full justify-start ${toolbarBtn}`}
            title="Open Word to PDF converter"
          >
            <Icon name="export" />
            <span>Word to PDF</span>
          </button>
        </ControlTooltip>
        {advancedMode && (
          <ControlTooltip label="Toggle subtle dot matrix helper" className="relative block" side="right">
            <button
              type="button"
              onClick={onToggleDotMatrix}
              className={`w-full justify-start ${showDotMatrix ? toolbarBtnActive : toolbarBtn}`}
              title="Toggle subtle dot matrix helper"
            >
              <Icon name="layout" />
              <span>Dot Matrix</span>
            </button>
          </ControlTooltip>
        )}
        {advancedMode && (
          <ControlTooltip label="Toggle drag-time guide snapping" className="relative block" side="right">
            <button
              type="button"
              onClick={onToggleSnapToGuides}
              className={`w-full justify-start ${snapToGuides ? toolbarBtnActive : toolbarBtn}`}
              title="Toggle drag-time guide snapping"
            >
              <Icon name="layout" />
              <span>Snap Guides</span>
            </button>
          </ControlTooltip>
        )}
        {advancedMode && (
          <ControlTooltip label="Toggle drag-time grid snapping" className="relative block" side="right">
            <button
              type="button"
              onClick={onToggleSnapToGrid}
              className={`w-full justify-start ${snapToGrid ? toolbarBtnActive : toolbarBtn}`}
              title="Toggle drag-time grid snapping"
            >
              <Icon name="layout" />
              <span>Snap Grid</span>
            </button>
          </ControlTooltip>
        )}
      </div>
    </aside>
  );
};


