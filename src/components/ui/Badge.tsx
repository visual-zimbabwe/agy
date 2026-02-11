"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export const Badge = ({ className, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]",
        className,
      )}
      {...props}
    />
  );
};
