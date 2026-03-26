"use client";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import type { LinkType, ZoneKind } from "@/features/wall/types";

type LinkTypeOption = {
  value: LinkType;
  label: string;
};

type WallToolsPanelProps = {
  leftPanelOpen: boolean;
  isTimeLocked: boolean;
  hasJokerNote: boolean;
  hasThroneNote: boolean;
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
  onCreateCodeNote: () => void;
  onCreateWebBookmarkNote: () => void;
  onCreateFileNote: () => void;
  onCreateApodNote: () => void;
  onCreatePoetryNote: () => void;
  onCreateEconomistNote: () => void;
  onCreateEisenhowerNote: () => void;
  onCreateOrRefreshJokerNote: () => void;
  onCreateOrRefreshThroneNote: () => void;
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

const sectionLabelClassName = "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8277]";
const toolButtonClassName =
  "flex w-full items-center gap-2 rounded-[16px] px-3 py-2.5 text-left text-[13px] text-[#3d433d] transition hover:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30 disabled:cursor-not-allowed disabled:opacity-45";
const activeToolButtonClassName = `${toolButtonClassName} bg-[#f6ede4] text-[#a33818] shadow-[inset_0_0_0_1px_rgba(163,56,24,0.1)]`;
const primaryToolButtonClassName = `${toolButtonClassName} bg-[#a33818] text-white shadow-[0_10px_24px_rgba(163,56,24,0.18)] hover:bg-[#8d2f13]`;
const selectClassName =
  "w-full rounded-[14px] border border-[#eadfd2] bg-white/90 px-3 py-2 text-sm text-[#3d433d] outline-none focus:border-[#a33818]/40 focus-visible:ring-2 focus-visible:ring-[#a33818]/20";

export const WallToolsPanel = ({
  leftPanelOpen,
  isTimeLocked,
  hasJokerNote,
  hasThroneNote,
  selectedNoteId,
  linkingFromNoteId,
  linkType,
  linkTypeOptions,
  showClusters,
  onClose,
  onCreateNote,
  onCreateCanonNote,
  onCreateJournalNote,
  onCreateQuoteNote,
  onCreateCodeNote,
  onCreateWebBookmarkNote,
  onCreateFileNote,
  onCreateApodNote,
  onCreatePoetryNote,
  onCreateEconomistNote,
  onCreateEisenhowerNote,
  onCreateOrRefreshJokerNote,
  onCreateOrRefreshThroneNote,
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
      className={`pointer-events-auto absolute left-5 top-24 z-[33] w-[19rem] rounded-[28px] border border-[#efe4d8] bg-[rgba(252,249,244,0.9)] p-4 shadow-[0_24px_60px_rgba(28,28,25,0.08)] backdrop-blur-2xl transition-all duration-300 ${leftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className={sectionLabelClassName}>Tools</p>
          <p className="mt-1 font-[Newsreader] text-[1.55rem] italic leading-none text-[#1c1c19]">The Atelier</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7468] transition hover:bg-[#1c1c19]/[0.05] hover:text-[#1c1c19]">
          Close
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto pr-1 max-h-[calc(100vh-10rem)]">
        <section>
          <p className={sectionLabelClassName}>Create</p>
          <div className="mt-2 grid gap-1.5">
            <ControlTooltip label="Create note at viewport center" shortcut="N or Ctrl/Cmd + N" className="relative block" side="right">
              <button type="button" onClick={onCreateNote} disabled={isTimeLocked} className={primaryToolButtonClassName}>
                <Icon name="note" />
                <span>New Note</span>
              </button>
            </ControlTooltip>
            <button type="button" onClick={onCreateJournalNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Journal</span></button>
            <button type="button" onClick={onCreateQuoteNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Quote</span></button>
            <button type="button" onClick={onCreateCodeNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Code</span></button>
            <button type="button" onClick={onCreateCanonNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Canon</span></button>
            <button type="button" onClick={onCreateWordNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Word</span></button>
            <button type="button" onClick={onCreateWebBookmarkNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="link" /><span>New Bookmark</span></button>
            <button type="button" onClick={onCreateFileNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New File</span></button>
            <button type="button" onClick={onCreateApodNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New APOD</span></button>
            <button type="button" onClick={onCreatePoetryNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>New Poetry</span></button>
            <button type="button" onClick={onCreateEconomistNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>Magazine Covers</span></button>
            <button type="button" onClick={onCreateEisenhowerNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="layout" /><span>Eisenhower Matrix</span></button>
            <button type="button" onClick={() => onCreateZone("frame")} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="zone" /><span>New Frame</span></button>
            {advancedMode ? <button type="button" onClick={() => onCreateZone("column")} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="zone" /><span>New Column</span></button> : null}
            {advancedMode ? <button type="button" onClick={() => onCreateZone("swimlane")} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="zone" /><span>New Swimlane</span></button> : null}
            <button type="button" onClick={onCreateOrRefreshJokerNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>{hasJokerNote ? "Refresh Joker" : "New Joker"}</span></button>
            <button type="button" onClick={onCreateOrRefreshThroneNote} disabled={isTimeLocked} className={toolButtonClassName}><Icon name="note" /><span>{hasThroneNote ? "Refresh Throne" : "New Throne"}</span></button>
          </div>
        </section>

        <section>
          <p className={sectionLabelClassName}>Organize</p>
          <div className="mt-2 grid gap-1.5">
            <button type="button" onClick={onToggleBoxSelect} className={boxSelectMode ? activeToolButtonClassName : toolButtonClassName}><Icon name="box" /><span>Box Select</span></button>
            <button type="button" onClick={onStartLinking} disabled={!selectedNoteId || isTimeLocked} className={linkingFromNoteId ? activeToolButtonClassName : toolButtonClassName}><Icon name="link" /><span>{linkingFromNoteId ? "Pick Link Target" : "Start Link"}</span></button>
            {advancedMode ? (
              <select value={linkType} onChange={(event) => onLinkTypeChange(event.target.value as LinkType)} className={selectClassName}>
                {linkTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : null}
            {advancedMode ? <button type="button" onClick={onToggleClusters} className={showClusters ? activeToolButtonClassName : toolButtonClassName}><Icon name="cluster" /><span>Detect Clusters</span></button> : null}
          </div>
        </section>

        <section>
          <p className={sectionLabelClassName}>Utilities</p>
          <div className="mt-2 grid gap-1.5">
            <button type="button" onClick={() => onOpenFileConversion("pdf_to_word")} className={toolButtonClassName}><Icon name="export" /><span>PDF to Word</span></button>
            <button type="button" onClick={() => onOpenFileConversion("word_to_pdf")} className={toolButtonClassName}><Icon name="export" /><span>Word to PDF</span></button>
            {advancedMode ? <button type="button" onClick={onToggleDotMatrix} className={showDotMatrix ? activeToolButtonClassName : toolButtonClassName}><Icon name="layout" /><span>Dot Matrix</span></button> : null}
            {advancedMode ? <button type="button" onClick={onToggleSnapToGuides} className={snapToGuides ? activeToolButtonClassName : toolButtonClassName}><Icon name="layout" /><span>Snap Guides</span></button> : null}
            {advancedMode ? <button type="button" onClick={onToggleSnapToGrid} className={snapToGrid ? activeToolButtonClassName : toolButtonClassName}><Icon name="layout" /><span>Snap Grid</span></button> : null}
          </div>
        </section>
      </div>
    </aside>
  );
};





