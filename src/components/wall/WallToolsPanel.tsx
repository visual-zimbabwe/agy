"use client";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import type { LinkType } from "@/features/wall/types";

type LinkTypeOption = {
  value: LinkType;
  label: string;
};

type WallToolsPanelProps = {
  isCompactLayout: boolean;
  leftPanelOpen: boolean;
  isTimeLocked: boolean;
  selectedNoteId?: string;
  linkingFromNoteId?: string;
  linkType: LinkType;
  linkTypeOptions: LinkTypeOption[];
  showClusters: boolean;
  toolbarBtn: string;
  toolbarBtnPrimary: string;
  toolbarBtnActive: string;
  toolbarSelect: string;
  onClose: () => void;
  onCreateNote: () => void;
  onCreateZone: () => void;
  onToggleBoxSelect: () => void;
  boxSelectMode: boolean;
  onStartLinking: () => void;
  onLinkTypeChange: (value: LinkType) => void;
  onToggleClusters: () => void;
};

export const WallToolsPanel = ({
  isCompactLayout,
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
  onCreateZone,
  onToggleBoxSelect,
  boxSelectMode,
  onStartLinking,
  onLinkTypeChange,
  onToggleClusters,
}: WallToolsPanelProps) => {
  return (
    <aside
      className={`pointer-events-auto absolute z-40 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-sm transition ${
        isCompactLayout
          ? `left-2 top-7 w-[min(18rem,calc(100%-1rem))] ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"}`
          : `left-3 top-8 w-44 ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none"}`
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Tools</p>
        {isCompactLayout && (
          <button type="button" onClick={onClose} className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] text-zinc-600">
            Close
          </button>
        )}
      </div>
      <div className="space-y-1">
        <ControlTooltip label="Create note at viewport center" shortcut="N or Ctrl/Cmd+N" className="relative block">
          <button type="button" onClick={onCreateNote} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtnPrimary}`} title="Create note (N or Ctrl/Cmd+N)">
            <Icon name="note" />
            <span>New Note</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Create zone at viewport center" className="relative block">
          <button type="button" onClick={onCreateZone} disabled={isTimeLocked} className={`w-full justify-start ${toolbarBtn}`} title="Create zone at viewport center">
            <Icon name="zone" />
            <span>New Zone</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Toggle box selection mode" className="relative block">
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
        <ControlTooltip label="Start linking from selected note" shortcut="Ctrl/Cmd+L" className="relative block">
          <button
            type="button"
            onClick={onStartLinking}
            disabled={!selectedNoteId || isTimeLocked}
            className={`w-full justify-start ${linkingFromNoteId ? toolbarBtnActive : toolbarBtn}`}
            title="Start linking (Ctrl/Cmd+L)"
          >
            <Icon name="link" />
            <span>{linkingFromNoteId ? "Pick Link Target" : "Start Link"}</span>
          </button>
        </ControlTooltip>
        <ControlTooltip label="Pick link type" className="relative block">
          <select value={linkType} onChange={(event) => onLinkTypeChange(event.target.value as LinkType)} className={`w-full ${toolbarSelect}`} title="Pick link type">
            {linkTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ControlTooltip>
        <ControlTooltip label="Toggle automatic cluster outlines" className="relative block">
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
      </div>
    </aside>
  );
};
