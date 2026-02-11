"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

type ModalPosition = "center" | "top";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
  position?: ModalPosition;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  closeLabel?: string;
};

export const ModalShell = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-xl",
  panelClassName,
  contentClassName,
  position = "center",
  closeOnBackdrop = true,
  showCloseButton = true,
  closeLabel = "Close",
}: ModalShellProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialogNode = dialogRef.current;
    const focusTarget = dialogNode?.querySelector<HTMLElement>("[autofocus]") ?? dialogNode;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogNode) {
        return;
      }

      const focusables = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ).filter((node) => !node.hasAttribute("aria-hidden"));

      if (focusables.length === 0) {
        event.preventDefault();
        dialogNode.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[var(--z-overlay)] flex bg-[var(--color-overlay)] px-4 backdrop-blur-[2px] motion-fade-in",
        position === "top" ? "items-start justify-center pt-16" : "items-center justify-center py-4",
      )}
      onClick={() => {
        if (closeOnBackdrop) {
          onClose();
        }
      }}
      role="presentation"
    >
      <Panel
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn("w-full p-4 md:p-5 motion-modal-enter", maxWidthClassName, panelClassName)}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-3">
            <div>
              {title && <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>}
              {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
            </div>
            {showCloseButton && (
              <Button size="sm" variant="secondary" onClick={onClose}>
                {closeLabel}
              </Button>
            )}
          </div>
        )}
        <div className={cn(title || description || showCloseButton ? "mt-4" : "", contentClassName)}>{children}</div>
      </Panel>
    </div>
  );
};
