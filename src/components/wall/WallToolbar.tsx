"use client";

import { useEffect, useRef, useState } from "react";

import { ControlTooltip, Icon } from "@/components/wall/WallControls";
import {
  toolbarBtn,
  toolbarBtnActive,
} from "@/components/wall/wallChromeClasses";
import {
  createWorkspaceWindowId,
  workspaceChannelName,
  type WorkspaceEnvelope,
} from "@/lib/workspace-sync";

type LayoutPreferenceKey = "showToolsPanel" | "showDetailsPanel" | "showContextBar" | "showNoteTags";
type LayoutPreferences = Record<LayoutPreferenceKey, boolean>;

type WallToolbarProps = {
  presentationMode: boolean;
  publishedReadOnly: boolean;
  timelineViewActive: boolean;
  layoutPrefs: LayoutPreferences;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  quickCaptureOpen: boolean;
  isTimeLocked: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onToggleQuickCapture: () => void;
  onToggleTimelineView: () => void;
  onTogglePresentationMode: () => void;
};

export const WallToolbar = ({
  presentationMode,
  publishedReadOnly,
  timelineViewActive,
  layoutPrefs,
  leftPanelOpen,
  rightPanelOpen,
  quickCaptureOpen,
  isTimeLocked,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onToggleQuickCapture,
  onToggleTimelineView,
  onTogglePresentationMode,
}: WallToolbarProps) => {
  const [activeDeckId, setActiveDeckId] = useState("");
  const [activeDeckName, setActiveDeckName] = useState("");
  const [isDecksOnline, setIsDecksOnline] = useState(false);
  const [hasLiveDeckSelection, setHasLiveDeckSelection] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const windowIdRef = useRef<string>(createWorkspaceWindowId());
  const decksSeenAtRef = useRef<number>(0);
  const activeDeckNameRef = useRef("");
  const isDecksOnlineRef = useRef(false);
  const hasLiveDeckSelectionRef = useRef(false);
  const showSecondaryActions = !presentationMode;
  const toolsAction = !publishedReadOnly && !presentationMode && layoutPrefs.showToolsPanel;
  const detailsAction = !presentationMode && layoutPrefs.showDetailsPanel;

  useEffect(() => {
    activeDeckNameRef.current = activeDeckName;
  }, [activeDeckName]);

  useEffect(() => {
    isDecksOnlineRef.current = isDecksOnline;
  }, [isDecksOnline]);

  useEffect(() => {
    hasLiveDeckSelectionRef.current = hasLiveDeckSelection;
  }, [hasLiveDeckSelection]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return;
    }
    const channel = new BroadcastChannel(workspaceChannelName);
    channelRef.current = channel;

    const emit = (event: WorkspaceEnvelope["event"]) => {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "wall",
        sentAt: Date.now(),
        event,
      };
      channel.postMessage(payload);
    };

    const heartbeat = () => emit({ type: "presence" });
    heartbeat();
    const timer = window.setInterval(heartbeat, 12_000);
    const decksStatusTick = window.setInterval(() => {
      if (Date.now() - decksSeenAtRef.current <= 20_000) {
        return;
      }
      if (isDecksOnlineRef.current || hasLiveDeckSelectionRef.current || activeDeckNameRef.current) {
        setIsDecksOnline(false);
        setHasLiveDeckSelection(false);
        setActiveDeckId("");
        setActiveDeckName("");
      }
    }, 2_000);

    channel.onmessage = (message: MessageEvent<WorkspaceEnvelope>) => {
      const payload = message.data;
      if (!payload || payload.sourceId === windowIdRef.current) {
        return;
      }
      if (payload.sourceRole === "decks" && payload.event.type === "presence") {
        decksSeenAtRef.current = payload.sentAt;
        setIsDecksOnline(true);
        return;
      }
      if (payload.event.type === "open_window" && payload.event.target === "wall") {
        window.focus();
        return;
      }
      if (payload.event.type === "decks_closed") {
        setIsDecksOnline(false);
        setHasLiveDeckSelection(false);
        setActiveDeckId("");
        setActiveDeckName("");
        return;
      }
      if (payload.event.type === "deck_selection") {
        decksSeenAtRef.current = payload.sentAt;
        setIsDecksOnline(true);
        setHasLiveDeckSelection(true);
        setActiveDeckId(payload.event.deckId);
        setActiveDeckName(payload.event.deckName);
        return;
      }
      if (payload.event.type === "deck_selection_cleared") {
        setHasLiveDeckSelection(false);
        setActiveDeckId("");
        setActiveDeckName("");
      }
    };

    return () => {
      window.clearInterval(timer);
      window.clearInterval(decksStatusTick);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const showDeckBadge = isDecksOnline && hasLiveDeckSelection && Boolean(activeDeckName);

  const openDecksWindow = () => {
    const target = activeDeckId ? `/decks?deckId=${encodeURIComponent(activeDeckId)}` : "/decks";
    const isDesktop = Boolean(window.desktopMeta?.isDesktop || window.desktopApi);
    if (isDesktop) {
      window.open(target, "idea-wall-decks-window", "width=1320,height=920");
    } else {
      window.open(target, "_blank");
    }
    if (channelRef.current) {
      const payload: WorkspaceEnvelope = {
        sourceId: windowIdRef.current,
        sourceRole: "wall",
        sentAt: Date.now(),
        event: { type: "open_window", target: "decks" },
      };
      channelRef.current.postMessage(payload);
    }
  };

  return (
    <>
      <div className="relative flex w-full items-center justify-start">
        <div className="inline-flex items-center gap-1.5">
          <ControlTooltip label="Toggle quick capture" shortcut="Q or Ctrl/Cmd + J" side="bottom">
            <button
              type="button"
              onClick={onToggleQuickCapture}
              disabled={isTimeLocked}
              className={quickCaptureOpen ? toolbarBtnActive : toolbarBtn}
              title="Toggle quick capture (Q or Ctrl/Cmd + J)"
            >
              <Icon name="capture" />
              <span>Capture</span>
            </button>
          </ControlTooltip>
          <ControlTooltip label="Toggle presentation mode" shortcut="P" side="top">
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className={presentationMode ? toolbarBtnActive : toolbarBtn}
              title="Toggle presentation mode (P)"
            >
              <Icon name="present" />
              <span>Present</span>
            </button>
          </ControlTooltip>
          <ControlTooltip label="Toggle horizontal timeline view" shortcut="V" side="top">
            <button
              type="button"
              onClick={onToggleTimelineView}
              className={timelineViewActive ? toolbarBtnActive : toolbarBtn}
              title="Toggle horizontal timeline view (V)"
            >
              <Icon name="timeline" />
              <span>Timeline View</span>
            </button>
          </ControlTooltip>
          {showSecondaryActions && (
            <>
              <ControlTooltip label="Open decks" side="top">
                <button type="button" onClick={openDecksWindow} className={toolbarBtn} title="Open decks">
                  <Icon name="panel-right" />
                  <span>Decks</span>
                </button>
              </ControlTooltip>
              {showDeckBadge && (
                <span className="ml-1 hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-text-muted)] lg:inline-flex">
                  Deck: {activeDeckName}
                </span>
              )}
              {toolsAction && (
                <ControlTooltip label={leftPanelOpen ? "Hide tools panel" : "Show tools panel"} side="top">
                  <button
                    type="button"
                    onClick={onToggleLeftPanel}
                    className={leftPanelOpen ? toolbarBtnActive : toolbarBtn}
                    title={leftPanelOpen ? "Hide tools panel" : "Show tools panel"}
                  >
                    <Icon name="panel-left" />
                    <span>Tools</span>
                  </button>
                </ControlTooltip>
              )}
              {detailsAction && (
                <ControlTooltip label={rightPanelOpen ? "Hide details panel" : "Show details panel"} side="top">
                  <button
                    type="button"
                    onClick={onToggleRightPanel}
                    className={rightPanelOpen ? toolbarBtnActive : toolbarBtn}
                    title={rightPanelOpen ? "Hide details panel" : "Show details panel"}
                  >
                    <Icon name="panel-right" />
                    <span>Details</span>
                  </button>
                </ControlTooltip>
              )}
            </>
          )}
        </div>
        <ControlTooltip label="Command palette (Ctrl+K)" side="bottom">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="fixed left-1/2 top-3 z-[96] -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 md:top-4"
            title="Command palette (Ctrl+K)"
            aria-label="Open command palette"
          >
            <Icon name="search" className="h-3.5 w-3.5" />
            <span>Search...</span>
            <span className="rounded border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
              Ctrl K
            </span>
          </button>
        </ControlTooltip>
      </div>
    </>
  );
};
