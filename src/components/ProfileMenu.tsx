"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { applyPreferencesToDocument, persistPreferences, readStoredPreferences, type ThemePreference } from "@/lib/preferences";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileMenuProps = {
  email: string;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
};

export const ProfileMenu = ({ email, onOpenShortcuts, onOpenSettings }: ProfileMenuProps) => {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useMemo(() => {
    const normalized = email.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return `profile-menu-${normalized || "user"}`;
  }, [email]);
  const initials = useMemo(() => {
    const source = email.split("@")[0] ?? "U";
    const tokens = source.split(/[._-]+/).filter(Boolean);
    const first = tokens[0]?.[0] ?? source[0] ?? "U";
    const second = tokens[1]?.[0] ?? source[1] ?? "";
    return `${first}${second}`.toUpperCase();
  }, [email]);

  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredPreferences().theme);
  const [reduceMotion, setReduceMotion] = useState(() => readStoredPreferences().reduceMotion);
  const [compactMode, setCompactMode] = useState(() => readStoredPreferences().compactMode);
  const [preferredName, setPreferredName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
      setPreferredName(typeof metadata?.full_name === "string" ? metadata.full_name : "");
      setAvatarUrl(typeof metadata?.avatar_url === "string" ? metadata.avatar_url : "");
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    const preferences = { theme, reduceMotion, compactMode };
    persistPreferences(preferences);
    applyPreferencesToDocument(preferences);
  }, [compactMode, reduceMotion, theme]);

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

  const signOut = async () => {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[11px] font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] transition-colors hover:bg-[var(--color-surface-muted)]"
        title={preferredName ? `${preferredName} (${email})` : email}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={preferredName || email} className="h-full w-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <Panel
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2.5 w-[min(22rem,90vw)] p-3 motion-modal-enter"
        >
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] px-2.5 py-2">
            <p className="text-[11px] text-[var(--color-text-muted)]">Account</p>
            <p className="truncate text-sm font-medium text-[var(--color-text)]">{preferredName || email}</p>
            {preferredName && <p className="truncate text-[11px] text-[var(--color-text-muted)]">{email}</p>}
            <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Plan: Free</p>
          </div>

          <div className="mt-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-2.5 py-2">
            <p className="text-[11px] text-[var(--color-text-muted)]">Preferences</p>
            <label className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[var(--color-text)]">
              <span>Theme</span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value as ThemePreference)}
                className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[var(--color-text)]">
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(event) => setReduceMotion(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
              />
            </label>
            <label className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[var(--color-text)]">
              <span>Compact mode</span>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(event) => setCompactMode(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-accent-strong)]"
              />
            </label>
          </div>

          <div className="mt-2 grid gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              role="menuitem"
              onClick={() => {
                onOpenSettings();
                setOpen(false);
              }}
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              role="menuitem"
              onClick={() => {
                onOpenShortcuts();
                setOpen(false);
              }}
            >
              Keyboard shortcuts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              role="menuitem"
              onClick={() => {
                onOpenShortcuts();
                setOpen(false);
              }}
            >
              Help / Docs
            </Button>
            <Button
              className="w-full justify-start"
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
          </div>
        </Panel>
      )}
    </div>
  );
};
