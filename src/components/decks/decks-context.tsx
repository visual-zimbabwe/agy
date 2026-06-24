"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import type { AppUserProfile } from "@/lib/profile";

import type { Deck, DecksPayload, NoteType } from "./decks-types";

type DecksChromeContextValue = {
  decks: Deck[];
  noteTypes: NoteType[];
  fsrsAvailable: boolean;
  loading: boolean;
  statusMessage: string;
  setStatusMessage: (message: string) => void;
  selectedDeckId: string;
  setSelectedDeckId: (deckId: string) => void;
  reloadDecks: () => Promise<void>;
  userEmail: string;
  userProfile?: AppUserProfile;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  addNoteOpen: boolean;
  setAddNoteOpen: (open: boolean) => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
};

const DecksChromeContext = createContext<DecksChromeContextValue | null>(null);

export const useDecksChrome = () => {
  const context = useContext(DecksChromeContext);
  if (!context) {
    throw new Error("useDecksChrome must be used within DecksChrome.");
  }
  return context;
};

type DecksChromeProviderProps = {
  userEmail: string;
  userProfile?: AppUserProfile;
  children: ReactNode;
};

export const DecksChromeProvider = ({ userEmail, userProfile, children }: DecksChromeProviderProps) => {
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [noteTypes, setNoteTypes] = useState<NoteType[]>([]);
  const [fsrsAvailable, setFsrsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const reloadDecks = useCallback(async () => {
    const response = await fetch("/api/decks", { cache: "no-store" });
    const payload = (await response.json()) as DecksPayload;
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load decks.");
    }
    const nextDecks = payload.decks ?? [];
    setDecks(nextDecks);
    setNoteTypes(payload.noteTypes ?? []);
    setFsrsAvailable(payload.fsrsAvailable !== false);
    setSelectedDeckId((current) => {
      if (current && nextDecks.some((deck) => deck.id === current)) {
        return current;
      }
      const requested = searchParams.get("deckId") ?? "";
      const requestedDeck = nextDecks.find((deck) => deck.id === requested);
      const fallback =
        nextDecks.find((deck) => deck.parent_id !== null) ?? nextDecks[0] ?? null;
      return requestedDeck?.id ?? fallback?.id ?? "";
    });
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        await reloadDecks();
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Failed to load decks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadDecks]);

  useEffect(() => {
    const requested = searchParams.get("deckId") ?? "";
    if (requested && decks.some((deck) => deck.id === requested)) {
      setSelectedDeckId(requested);
    }
  }, [decks, searchParams]);

  const value = useMemo(
    () => ({
      decks,
      noteTypes,
      fsrsAvailable,
      loading,
      statusMessage,
      setStatusMessage,
      selectedDeckId,
      setSelectedDeckId,
      reloadDecks,
      userEmail,
      userProfile,
      settingsOpen,
      setSettingsOpen,
      helpOpen,
      setHelpOpen,
      shortcutsOpen,
      setShortcutsOpen,
      addNoteOpen,
      setAddNoteOpen,
      importOpen,
      setImportOpen,
    }),
    [
      decks,
      noteTypes,
      fsrsAvailable,
      loading,
      statusMessage,
      selectedDeckId,
      reloadDecks,
      userEmail,
      userProfile,
      settingsOpen,
      helpOpen,
      shortcutsOpen,
      addNoteOpen,
      importOpen,
    ],
  );

  return <DecksChromeContext.Provider value={value}>{children}</DecksChromeContext.Provider>;
};
