"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  email: string;
};

export const AccountMenu = ({ email }: AccountMenuProps) => {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useMemo(() => {
    const normalized = email.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return `account-menu-${normalized || "user"}`;
  }, [email]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setBusy(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[95] sm:right-4 sm:top-4">
      <Button
        ref={toggleRef}
        size="sm"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="max-w-[min(78vw,20rem)] rounded-[var(--radius-lg)] border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[var(--color-text)] shadow-[var(--shadow-sm)] motion-panel-enter"
      >
        <span className="truncate">{email}</span>
        <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </Button>
      {open && (
        <Panel
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className="mt-2.5 w-[min(18rem,90vw)] p-3 motion-modal-enter"
        >
          <p className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-2 py-1.5 text-xs text-[var(--color-text-muted)]">
            Signed in as <span className="font-semibold text-[var(--color-text)]">{email}</span>
          </p>
          <Button
            className="mt-2 w-full justify-center"
            onClick={() => {
              void signOut();
            }}
            disabled={busy}
            variant="secondary"
            size="sm"
            role="menuitem"
          >
            {busy ? "Signing out..." : "Sign out"}
          </Button>
        </Panel>
      )}
    </div>
  );
};
