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
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-zinc-300 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <button type="button" onClick={onPrev} className="rounded border border-zinc-300 px-2 py-1 text-xs">
        Prev
      </button>
      <span className="text-xs text-zinc-700">
        {Math.min(presentationIndex + 1, Math.max(1, presentationNotesLength))} / {Math.max(1, presentationNotesLength)}
      </span>
      <button type="button" onClick={onNext} className="rounded border border-zinc-300 px-2 py-1 text-xs">
        Next
      </button>
      <button type="button" onClick={onExit} className="rounded border border-zinc-300 px-2 py-1 text-xs">
        Exit
      </button>
    </div>
  );
};
