"use client";

type NoteSlashCommand = {
  id: string;
  label: string;
  description: string;
  glyph: string;
};

type NoteSlashCommandMenuProps = {
  open: boolean;
  left: number;
  top: number;
  commands: NoteSlashCommand[];
  activeIndex: number;
  onSelect: (command: NoteSlashCommand) => void;
  onHover: (index: number) => void;
};

export const NoteSlashCommandMenu = ({ open, left, top, commands, activeIndex, onSelect, onHover }: NoteSlashCommandMenuProps) => {
  if (!open || commands.length === 0) {
    return null;
  }

  return (
    <div data-note-edit-tools="true" className="pointer-events-auto fixed z-[119] w-[min(22rem,calc(100vw-1rem))] motion-toolbar-enter" style={{ left: `${left}px`, top: `${top}px` }}>
      <div className="overflow-hidden rounded-[22px] border border-zinc-300 bg-white shadow-[0_28px_64px_rgba(15,23,42,0.24)] ring-1 ring-black/5">
        <div className="border-b border-zinc-200 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Insert</div>
        <div className="max-h-[min(20rem,45vh)] overflow-y-auto p-1.5">
          {commands.map((command, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={command.id}
                type="button"
                data-note-edit-tools="true"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHover(index)}
                onFocus={() => onHover(index)}
                onClick={() => onSelect(command)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                  active ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
                  {command.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-zinc-900">{command.label}</span>
                  <span className="block text-[11px] leading-4 text-zinc-500">{command.description}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-zinc-200 px-3.5 py-2 text-[11px] text-zinc-500">Use Up/Down and Enter. Press Esc to close.</div>
      </div>
    </div>
  );
};