"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--color-accent-strong)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent)]",
  secondary:
    "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
  ghost: "border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
  danger: "border-transparent bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-strong)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs",
  md: "rounded-[var(--radius-md)] px-3 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
