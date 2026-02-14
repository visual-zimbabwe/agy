"use client";

type WallPresentationDockProps = {
  mode: "notes" | "narrative";
  presentationIndex: number;
  presentationLength: number;
  narrativePaths: Array<{ id: string; title: string; stepsCount: number }>;
  activeNarrativePathId: string;
  activeStepTalkingPoints: string;
  onPrev: () => void;
  onNext: () => void;
  onCreateNarrativePath: () => void;
  onPathChange: (pathId: string) => void;
  onAddStep: () => void;
  onDeleteStep: () => void;
  onUpdateTalkingPoints: (value: string) => void;
  onCaptureStepCamera: () => void;
  onExit: () => void;
};

export const WallPresentationDock = ({
  mode,
  presentationIndex,
  presentationLength,
  narrativePaths,
  activeNarrativePathId,
  activeStepTalkingPoints,
  onPrev,
  onNext,
  onCreateNarrativePath,
  onPathChange,
  onAddStep,
  onDeleteStep,
  onUpdateTalkingPoints,
  onCaptureStepCamera,
  onExit,
}: WallPresentationDockProps) => {
  const dockButtonClass =
    "rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-muted)] transition-[background-color,border-color,color] duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]";
  const canNavigate = presentationLength > 1;
  const hasActivePath = activeNarrativePathId.length > 0;

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(42rem,calc(100%-1rem))] -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)] motion-panel-enter">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={activeNarrativePathId}
          onChange={(event) => onPathChange(event.target.value)}
          className="min-w-[10rem] flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          aria-label="Narrative path selector"
        >
          <option value="">Notes order</option>
          {narrativePaths.map((path) => (
            <option key={path.id} value={path.id}>
              {path.title} ({path.stepsCount})
            </option>
          ))}
        </select>
        <button type="button" onClick={onCreateNarrativePath} className={dockButtonClass}>
          New Path
        </button>
        <button type="button" onClick={onAddStep} className={dockButtonClass}>
          Add Step
        </button>
        {hasActivePath && (
          <button type="button" onClick={onCaptureStepCamera} className={dockButtonClass}>
            Update View
          </button>
        )}
      </div>

      {mode === "narrative" && (
        <textarea
          value={activeStepTalkingPoints}
          onChange={(event) => onUpdateTalkingPoints(event.target.value)}
          placeholder="Talking points for this step..."
          className="mt-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)]"
          rows={3}
        />
      )}

      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={onPrev} disabled={!canNavigate} className={`${dockButtonClass} disabled:opacity-45`}>
          Prev
        </button>
        <span className="text-xs text-[var(--color-text)]">
          {Math.min(presentationIndex + 1, Math.max(1, presentationLength))} / {Math.max(1, presentationLength)}
        </span>
        <button type="button" onClick={onNext} disabled={!canNavigate} className={`${dockButtonClass} disabled:opacity-45`}>
          Next
        </button>
        {mode === "narrative" && (
          <button type="button" onClick={onDeleteStep} disabled={presentationLength === 0} className={`${dockButtonClass} disabled:opacity-45`}>
            Delete Step
          </button>
        )}
        <button type="button" onClick={onExit} className={dockButtonClass}>
          Exit
        </button>
      </div>
    </div>
  );
};
