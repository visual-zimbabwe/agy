"use client";

import Link from "next/link";

import { ProfileMenu } from "@/components/ProfileMenu";
import { SyncStatus } from "@/components/wall/SyncStatus";
import type { Note } from "@/features/wall/types";
import type { AppUserProfile } from "@/lib/profile";

type LayoutPrefs = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type WallHeaderBarProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  timelineViewActive: boolean;
  layoutPrefs: LayoutPrefs;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  hasContextActions: boolean;
  showContextColor: boolean;
  toolbarSurface: string;
  toolbarLabel: string;
  toolbarDivider: string;
  selectedNotes: Note[];
  selectedNote?: Note;
  uiLastColor: string;
  statusMessage: string;
  userEmail?: string;
  userProfile?: AppUserProfile;
  cloudWallId: string | null;
  isSyncing: boolean;
  localSaveState: "idle" | "saving" | "error";
  hasPendingSync: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onToggleTimelineView: () => void;
  onTogglePresentationMode: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onApplyColorToSelection: (color: string) => void;
  onSyncNow: () => void;
};

const navLinkClassName =
  "relative inline-flex items-center justify-center px-1 py-2 text-sm font-medium text-[#4d6356] transition hover:text-[#1c1c19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";
const roundButtonClassName =
  "inline-flex h-12 w-12 items-center justify-center rounded-full text-[#1c1c19] transition hover:bg-[#1c1c19]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33818]/30";

const HeaderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4.75L13.4 5.14L14.2 6.42L15.63 6.33L16.78 7.18L16.69 8.61L17.97 9.41L18.36 10.81L17.45 11.92L18.36 13.03L17.97 14.43L16.69 15.23L16.78 16.66L15.63 17.51L14.2 17.42L13.4 18.7L12 19.09L10.6 18.7L9.8 17.42L8.37 17.51L7.22 16.66L7.31 15.23L6.03 14.43L5.64 13.03L6.55 11.92L5.64 10.81L6.03 9.41L7.31 8.61L7.22 7.18L8.37 6.33L9.8 6.42L10.6 5.14L12 4.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="12" cy="11.92" r="2.6" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export const WallHeaderBar = ({
  presentationMode,
  publishedReadOnly,
  timelineViewActive,
  userEmail,
  userProfile,
  cloudWallId,
  isSyncing,
  localSaveState,
  hasPendingSync,
  lastSyncedAt,
  syncError,
  onToggleTimelineView,
  onOpenShortcuts,
  onOpenHelp,
  onOpenSettings,
  onSyncNow,
}: WallHeaderBarProps) => {
  if (presentationMode) {
    return null;
  }

  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-[40] px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto grid max-w-[96rem] grid-cols-[1fr_auto_1fr] items-center rounded-[28px] border border-[#f0e7dc] bg-[rgba(252,249,244,0.78)] px-5 py-3 shadow-[0_12px_38px_rgba(28,28,25,0.04)] backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-start">
          <Link href="/wall" className="font-[Newsreader] text-[2rem] italic leading-none text-[#1c1c19] no-underline">
            Agy
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-6 md:flex">
          <Link href="/wall" className={`${navLinkClassName} ${!timelineViewActive ? "text-[#a33818]" : ""}`}>
            Wall
            {!timelineViewActive ? <span className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#a33818]" /> : null}
          </Link>
          <Link href="/decks" className={navLinkClassName}>Decks</Link>
          <Link href="/page" className={navLinkClassName}>Page</Link>
          <button type="button" onClick={onToggleTimelineView} className={`${navLinkClassName} ${timelineViewActive ? "text-[#a33818]" : ""}`}>
            Timeline
            {timelineViewActive ? <span className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#a33818]" /> : null}
          </button>
          <Link href="/media" className={navLinkClassName}>Media</Link>
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {!publishedReadOnly && userEmail ? (
            <div className="mr-1">
              <SyncStatus
                hasCloudWall={Boolean(cloudWallId)}
                isSyncing={isSyncing}
                localSaveState={localSaveState}
                hasPendingSync={hasPendingSync}
                lastSyncedAt={lastSyncedAt}
                syncError={syncError}
                onSyncNow={onSyncNow}
              />
            </div>
          ) : null}
          <button type="button" onClick={onOpenSettings} className={roundButtonClassName} aria-label="Open settings">
            <HeaderIcon />
          </button>
          {userEmail ? (
            <ProfileMenu
              email={userEmail}
              initialProfile={userProfile}
              onOpenShortcuts={onOpenShortcuts}
              onOpenSettings={onOpenSettings}
              onOpenHelp={onOpenHelp}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
};
