"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { DecksViewName } from "./decks-types";
import { useDecksChrome } from "./decks-context";

const viewTabs: Array<{ id: DecksViewName; label: string; href: (deckId: string) => string }> = [
  { id: "decks", label: "Decks", href: (deckId) => `/decks/decks${deckId ? `?deckId=${deckId}` : ""}` },
  { id: "browse", label: "Browse", href: (deckId) => `/decks/browse${deckId ? `?deckId=${deckId}` : ""}` },
  { id: "stats", label: "Stats", href: (deckId) => `/decks/stats${deckId ? `?deckId=${deckId}` : ""}` },
  { id: "study", label: "Study", href: (deckId) => `/decks/study${deckId ? `?deckId=${deckId}` : ""}` },
];

const resolveActiveView = (pathname: string): DecksViewName => {
  if (pathname.includes("/decks/browse")) return "browse";
  if (pathname.includes("/decks/stats")) return "stats";
  if (pathname.includes("/decks/study")) return "study";
  return "decks";
};

export const DecksViewTabs = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedDeckId } = useDecksChrome();
  const activeView = resolveActiveView(pathname);
  const deckId = searchParams.get("deckId") ?? selectedDeckId;

  return (
    <nav
      aria-label="Decks views"
      className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-muted)] px-4 py-3 sm:px-6"
    >
      {viewTabs.map((tab) => {
        const active = activeView === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href(deckId)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[#a33818]/10 text-[#a33818]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <div className="ml-auto hidden items-center gap-2 md:flex">
        <DecksToolbarActions />
      </div>
    </nav>
  );
};

const DecksToolbarActions = () => {
  const { setAddNoteOpen, setImportOpen } = useDecksChrome();
  return (
    <>
      <button
        type="button"
        onClick={() => setAddNoteOpen(true)}
        className="rounded-full bg-[#a33818] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8c2f14]"
      >
        Add Note
      </button>
      <button
        type="button"
        onClick={() => setImportOpen(true)}
        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
      >
        Import
      </button>
    </>
  );
};
