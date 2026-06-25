"use client";

import Link from "next/link";

import { ProfileMenu } from "@/components/ProfileMenu";
import { SyncStatus } from "@/components/wall/SyncStatus";
import type { Note } from "@/features/wall/types";
import type { AppUserProfile } from "@/lib/profile";

type LayoutPrefs = {
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type WallHeaderBarProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  timelineViewActive: boolean;
  layoutPrefs: LayoutPrefs;
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
          <button type="button" onClick={onToggleTimelineView} className={`${navLinkClassName} ${timelineViewActive ? "text-[#a33818]" : ""}`}>
            Timeline
            {timelineViewActive ? <span className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#a33818]" /> : null}
          </button>
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
