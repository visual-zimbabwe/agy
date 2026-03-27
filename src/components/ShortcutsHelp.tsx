"use client";

import { Badge } from "@/components/ui/Badge";
import { ModalShell } from "@/components/ui/ModalShell";
import { Panel } from "@/components/ui/Panel";
import { wallShortcutRows } from "@/features/help/content";

type ShortcutsHelpProps = {
  open: boolean;
  onClose: () => void;
};

export const ShortcutsHelp = ({ open, onClose }: ShortcutsHelpProps) => {
  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-2">
        {wallShortcutRows.map(([combo, label]) => (
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
