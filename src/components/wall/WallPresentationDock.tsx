"use client";

type WallPresentationDockProps = {
  presentationIndex: number;
  presentationNotesLength: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
};

export const WallPresentationDock = ({
  presentationIndex,
  presentationNotesLength,
  onPrev,
  onNext,
  onExit,
}: WallPresentationDockProps) => {
  const dockButtonClass =
    "rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)] motion-panel-enter">
      <button type="button" onClick={onPrev} className={dockButtonClass}>
        Prev
      </button>
      <span className="text-xs text-[var(--color-text)]">
        {Math.min(presentationIndex + 1, Math.max(1, presentationNotesLength))} / {Math.max(1, presentationNotesLength)}
      </span>
      <button type="button" onClick={onNext} className={dockButtonClass}>
        Next
      </button>
      <button type="button" onClick={onExit} className={dockButtonClass}>
        Exit
      </button>
    </div>
  );
};
