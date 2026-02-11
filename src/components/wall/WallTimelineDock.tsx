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
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(780px,95%)] -translate-x-1/2 rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onTogglePlay} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium">
          {isTimelinePlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onStart} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
          Start
        </button>
        <button type="button" onClick={onLatest} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs">
          Latest
        </button>
        <span className="ml-auto text-xs text-zinc-600">{new Date(currentTimestamp).toLocaleString()}</span>
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
