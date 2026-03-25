"use client";

type WallSearchDockProps = {
  onOpenSearch: () => void;
  onToggleTools: () => void;
  onToggleDetails: () => void;
  toolsOpen: boolean;
  detailsOpen: boolean;
  hidden?: boolean;
};

const actionButtonClassName =
  "inline-flex items-center justify-center rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f675f] transition hover:bg-[#1c1c19]/[0.06] hover:text-[#1c1c19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

export const WallSearchDock = ({
  onOpenSearch,
  onToggleTools,
  onToggleDetails,
  toolsOpen,
  detailsOpen,
  hidden = false,
}: WallSearchDockProps) => {
  if (hidden) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-[34] w-[min(92vw,44rem)] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-[20px] border border-[#efe6db] bg-[rgba(252,249,244,0.92)] px-3 py-2 shadow-[0_18px_50px_rgba(28,28,25,0.08)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-full bg-white/78 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(223,192,184,0.42)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30"
          aria-label="Open search"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4ede3] text-[#7f7369]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-[#72675e] transition group-hover:text-[#1c1c19]">
            Search tools, notes, or actions...
          </span>
          <span className="hidden rounded-full bg-[#f3eee7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7c6f] md:inline-flex">
            Ctrl/Cmd + K
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTools}
          className={`${actionButtonClassName} ${toolsOpen ? "bg-[#a33818] text-white hover:bg-[#8d2f13] hover:text-white" : ""}`}
        >
          Tools
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          className={`${actionButtonClassName} ${detailsOpen ? "bg-[#4d6356] text-white hover:bg-[#425649] hover:text-white" : ""}`}
        >
          Details
        </button>
      </div>
    </div>
  );
};
