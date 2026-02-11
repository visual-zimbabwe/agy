"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type PanelTone = "base" | "muted";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  base: "border-[var(--color-border)] bg-[var(--color-surface-elevated)]",
  muted: "border-[var(--color-border-muted)] bg-[var(--color-surface-muted)]",
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(({ className, tone = "base", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--radius-xl)] border shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-panel)]",
      toneClasses[tone],
      className,
    )}
    {...props}
  />
));

Panel.displayName = "Panel";
