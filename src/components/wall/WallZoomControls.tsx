"use client";

type WallZoomControlsProps = {
  zoomPercent: number;
  showHeatmap: boolean;
  canZoomToSelection: boolean;
  detailsPanelOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
};

const railButtonClassName =
  "grid h-11 w-11 place-items-center rounded-full text-[#7c746a] transition hover:bg-[#a33818]/10 hover:text-[#a33818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#7c746a]";

export const WallZoomControls = ({
  zoomPercent,
  showHeatmap,
  canZoomToSelection,
  detailsPanelOpen,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToFit,
  onZoomToSelection,
}: WallZoomControlsProps) => {
  return (
    <div
      className="pointer-events-auto absolute z-[31] transition-[bottom,right] duration-[var(--motion-normal)]"
      style={{
        bottom: showHeatmap ? "14rem" : "1.25rem",
        right: detailsPanelOpen ? "min(calc(100vw - 5rem), 26rem)" : "1.25rem",
      }}
    >
      <div className="flex flex-col items-center gap-1 rounded-[24px] border border-[#ede3d7] bg-[rgba(252,249,244,0.92)] px-1.5 py-2 shadow-[0_18px_40px_rgba(28,28,25,0.08)] backdrop-blur-xl">
        <button type="button" onClick={onZoomIn} className={railButtonClassName} aria-label="Zoom in" title="Zoom in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="h-px w-6 bg-[#ebe2d8]" />
        <button type="button" onClick={onZoomOut} className={railButtonClassName} aria-label="Zoom out" title="Zoom out">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="h-px w-6 bg-[#ebe2d8]" />
        <button type="button" onClick={onZoomToFit} className={railButtonClassName} aria-label="Zoom to fit" title="Zoom to fit">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 3H3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 3H13V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 11V13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 13H3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="h-px w-6 bg-[#ebe2d8]" />
        <button type="button" onClick={onResetZoom} className="grid h-11 w-11 place-items-center rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] text-[#756b60] transition hover:bg-[#a33818]/10 hover:text-[#a33818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30" aria-label="Reset zoom to 100 percent" title="Reset zoom">
          {zoomPercent}%
        </button>
        <div className="h-px w-6 bg-[#ebe2d8]" />
        <button type="button" onClick={onZoomToSelection} disabled={!canZoomToSelection} className={railButtonClassName} aria-label="Zoom to selection" title={canZoomToSelection ? "Zoom to selection" : "Select a note first"}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};
