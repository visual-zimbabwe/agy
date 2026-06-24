"use client";

import type { ReactNode } from "react";

import { DecksAppHeader } from "./DecksAppHeader";
import { DecksChromeProvider } from "./decks-context";
import { DecksSettingsHelpModals } from "./DecksSettingsHelpModals";
import { DecksViewTabs } from "./DecksViewTabs";
import type { AppUserProfile } from "@/lib/profile";

type DecksChromeProps = {
  userEmail: string;
  userProfile?: AppUserProfile;
  children: ReactNode;
};

export const DecksChrome = ({ userEmail, userProfile, children }: DecksChromeProps) => (
  <DecksChromeProvider userEmail={userEmail} userProfile={userProfile}>
    <div className="decks-app-shell min-h-screen bg-[var(--background)] text-[var(--color-text)]">
      <DecksAppHeader />
      <DecksViewTabs />
      {children}
      <DecksSettingsHelpModals />
    </div>
  </DecksChromeProvider>
);
