"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type PanelTone = "base" | "muted";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  base: "border-[var(--color-border)] bg-[var(--color-surface-elevated)]",
  muted: "border-[var(--color-border-muted)] bg-[var(--color-surface-muted)]",
};

export const Panel = ({ className, tone = "base", ...props }: PanelProps) => {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
};
