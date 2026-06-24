"use client";

import Link from "next/link";

import { ProfileMenu } from "@/components/ProfileMenu";

import { useDecksChrome } from "./decks-context";

const navLinkClassName =
  "relative inline-flex items-center justify-center px-1 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";
const roundButtonClassName =
  "inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-text)] transition hover:bg-[var(--color-text)]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09c-.61.25-1 .85-1 1.51Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const DecksAppHeader = () => {
  const { userEmail, userProfile, setSettingsOpen, setHelpOpen, setShortcutsOpen } = useDecksChrome();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-muted)] bg-[var(--color-surface-glass)] px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto grid max-w-[96rem] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center justify-start">
          <Link
            href="/wall"
            className="font-[Newsreader] text-[2rem] italic leading-none text-[var(--color-text)] no-underline"
          >
            Agy
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-6 md:flex">
          <Link href="/wall" className={navLinkClassName}>
            Wall
          </Link>
          <Link href="/decks" className={`${navLinkClassName} text-[#a33818]`}>
            Decks
            <span className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#a33818]" />
          </Link>
          <Link href="/wall?timeline=1" className={navLinkClassName}>
            Timeline
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={roundButtonClassName}
            aria-label="Open settings"
          >
            <SettingsIcon />
          </button>
          {userEmail ? (
            <ProfileMenu
              email={userEmail}
              initialProfile={userProfile}
              onOpenShortcuts={() => setShortcutsOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenHelp={() => setHelpOpen(true)}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
};
