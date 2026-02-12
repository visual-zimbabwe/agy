"use client";

type WallZoomControlsProps = {
  zoomPercent: number;
  showHeatmap: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

export const WallZoomControls = ({
  zoomPercent,
  showHeatmap,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: WallZoomControlsProps) => {
  return (
    <div
      className="pointer-events-auto absolute right-3 z-[31] transition-[bottom] duration-[var(--motion-normal)]"
      style={{ bottom: showHeatmap ? "14rem" : "0.75rem" }}
    >
      <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]">
        <button
          type="button"
          onClick={onZoomIn}
          className="h-9 w-11 border-b border-[var(--color-border)] text-lg font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="h-8 w-11 border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          aria-label="Reset zoom to 100 percent"
          title="Reset zoom (100%)"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="h-9 w-11 text-lg font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          aria-label="Zoom out"
          title="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
};
