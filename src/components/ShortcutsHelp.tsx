"use client";

import { Badge } from "@/components/ui/Badge";
import { ModalShell } from "@/components/ui/ModalShell";
import { Panel } from "@/components/ui/Panel";

type ShortcutsHelpProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  ["N / Ctrl+N", "New note"],
  ["Q / Ctrl+J", "Toggle quick capture bar"],
  ["Ctrl/Cmd + Shift + V", "Start/stop quick-capture voice dictation"],
  ["P", "Toggle presentation mode"],
  ["Ctrl/Cmd + Enter", "Capture quick-capture lines as notes"],
  ["Enter", "Edit selected note text"],
  ["Ctrl+K", "Open search"],
  ["Ctrl+L", "Start link from selected note"],
  ["Ctrl/Cmd + A", "Select all visible notes"],
  ["T", "Toggle timeline mode"],
  ["H", "Toggle recently changed heatmap"],
  ["Ctrl/Cmd + Z", "Undo last change"],
  ["Ctrl/Cmd + Shift + Z", "Redo change"],
  ["Delete / Backspace", "Delete selected note, zone, link, or group"],
  ["Ctrl+D or Shift+D", "Duplicate selected note"],
  ["Alt + Drag", "Duplicate a note while dragging"],
  ["Shift + Drag", "Lock drag movement to one axis"],
  ["Space + Drag", "Pan wall"],
  ["Ctrl/Cmd + Wheel", "Zoom toward cursor"],
  ["Esc", "Clear selection and close overlays"],
  ["?", "Toggle this help"],
];

export const ShortcutsHelp = ({ open, onClose }: ShortcutsHelpProps) => {
  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-2">
        {shortcuts.map(([combo, label]) => (
          <Panel key={combo} tone="muted" className="rounded-[var(--radius-md)] px-3 py-2 shadow-none">
            <div className="flex items-center justify-between gap-3 text-sm">
              <Badge className="rounded-[var(--radius-sm)] font-mono text-[11px]">{combo}</Badge>
              <span className="text-[var(--color-text-muted)]">{label}</span>
            </div>
          </Panel>
        ))}
      </div>
    </ModalShell>
  );
};
