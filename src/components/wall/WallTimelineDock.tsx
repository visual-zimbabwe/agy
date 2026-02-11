"use client";

type WallTimelineDockProps = {
  timelineEntriesLength: number;
  timelineIndex: number;
  isTimelinePlaying: boolean;
  currentTimestamp: number;
  onTogglePlay: () => void;
  onStart: () => void;
  onLatest: () => void;
  onSeek: (index: number) => void;
};

export const WallTimelineDock = ({
  timelineEntriesLength,
  timelineIndex,
  isTimelinePlaying,
  currentTimestamp,
  onTogglePlay,
  onStart,
  onLatest,
  onSeek,
}: WallTimelineDockProps) => {
  const dockButtonClass =
    "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(780px,95%)] -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)] motion-panel-enter">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onTogglePlay} className={dockButtonClass}>
          {isTimelinePlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onStart} className={dockButtonClass}>
          Start
        </button>
        <button type="button" onClick={onLatest} className={dockButtonClass}>
          Latest
        </button>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{new Date(currentTimestamp).toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, timelineEntriesLength - 1)}
        step={1}
        value={Math.min(timelineIndex, timelineEntriesLength - 1)}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="mt-3 w-full"
      />
    </div>
  );
};
