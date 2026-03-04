"use client";

export type WorkspaceRole = "wall" | "decks";

export type WorkspaceEvent =
  | { type: "presence" }
  | { type: "open_window"; target: WorkspaceRole }
  | { type: "deck_selection"; deckId: string; deckName: string }
  | { type: "deck_selection_cleared" }
  | { type: "decks_changed" }
  | { type: "decks_closed" };

export type WorkspaceEnvelope = {
  sourceId: string;
  sourceRole: WorkspaceRole;
  sentAt: number;
  event: WorkspaceEvent;
};

export const workspaceChannelName = "idea-wall-workspace-v1";
export const workspaceLinkedStorageKey = "idea-wall-workspace-linked";

export const createWorkspaceWindowId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `workspace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const parseWorkspaceLinked = (raw: string | null) => raw !== "0";
