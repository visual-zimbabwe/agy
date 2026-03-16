"use client";

export type NoteWikiLinkOption = {
  id: string;
  title: string;
  subtitle: string;
  mode: "existing" | "create";
};

type NoteWikiLinkMenuProps = {
  open: boolean;
  left: number;
  top: number;
  options: NoteWikiLinkOption[];
  activeIndex: number;
  onSelect: (option: NoteWikiLinkOption) => void;
  onHover: (index: number) => void;
};

export const NoteWikiLinkMenu = ({ open, left, top, options, activeIndex, onSelect, onHover }: NoteWikiLinkMenuProps) => {
  if (!open || options.length === 0) {
    return null;
  }

  return (
    <div data-note-edit-tools="true" className="pointer-events-auto fixed z-[120] w-[min(23rem,calc(100vw-1rem))] motion-toolbar-enter" style={{ left: `${left}px`, top: `${top}px` }}>
      <div className="overflow-hidden rounded-[22px] border border-slate-300 bg-[rgba(255,255,255,0.98)] shadow-[0_28px_64px_rgba(15,23,42,0.24)] ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-slate-200 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Wiki Links</div>
        <div className="max-h-[min(18rem,42vh)] overflow-y-auto p-1.5">
          {options.map((option, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={option.id}
                type="button"
                data-note-edit-tools="true"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHover(index)}
                onFocus={() => onHover(index)}
                onClick={() => onSelect(option)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
              >
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  option.mode === "create"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}>
                  {option.mode === "create" ? "+" : "[["}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{option.title}</span>
                  <span className="block text-[11px] leading-4 text-slate-500">{option.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-slate-200 px-3.5 py-2 text-[11px] text-slate-500">Use Up/Down and Enter. Press Esc to close.</div>
      </div>
    </div>
  );
};
