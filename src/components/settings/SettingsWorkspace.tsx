"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { defaultKeyboardColorSlots, readKeyboardColorSlots, writeKeyboardColorSlots } from "@/lib/keyboard-color-slots";
import { applyPreferencesToDocument, persistPreferences, readStoredPreferences, type ThemePreference } from "@/lib/preferences";

type SettingsWorkspaceProps = {
  userEmail: string;
};

type SettingsSectionId = "general" | "appearance" | "accessibility" | "keyboard" | "advanced";

const settingsSections: Array<{ id: SettingsSectionId; label: string; description: string }> = [
  { id: "general", label: "General", description: "Account and workspace defaults." },
  { id: "appearance", label: "Appearance", description: "Theme and density controls." },
  { id: "accessibility", label: "Accessibility", description: "Motion and readability preferences." },
  { id: "keyboard", label: "Keyboard", description: "Shortcut behavior and color slots." },
  { id: "advanced", label: "Advanced", description: "Reserved for future power features." },
];

export const SettingsWorkspace = ({ userEmail }: SettingsWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("appearance");
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredPreferences().theme);
  const [reduceMotion, setReduceMotion] = useState(() => readStoredPreferences().reduceMotion);
  const [compactMode, setCompactMode] = useState(() => readStoredPreferences().compactMode);
  const [keyboardColorSlots, setKeyboardColorSlots] = useState<Array<string | null>>(() => readKeyboardColorSlots());
  const [savedAt, setSavedAt] = useState<number>(() => Date.now());

  const preferenceState = useMemo(
    () => ({ theme, reduceMotion, compactMode }),
    [compactMode, reduceMotion, theme],
  );

  const onSavePreferences = () => {
    persistPreferences(preferenceState);
    applyPreferencesToDocument(preferenceState);
    writeKeyboardColorSlots(keyboardColorSlots);
    setSavedAt(Date.now());
  };

  const setKeyboardSlot = (index: number, color: string | null) => {
    setKeyboardColorSlots((previous) => {
      const next = [...previous];
      next[index] = color;
      return next;
    });
  };

  return (
    <main className="route-shell text-[var(--color-text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-panel)] sm:px-5 sm:py-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--color-text-muted)]">Workspace Settings</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Settings Studio</h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onSavePreferences}>
              Save settings
            </Button>
            <Link href="/wall" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-muted)]">
              Back to wall
            </Link>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Panel className="p-3">
            <nav aria-label="Settings sections" className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors ${
                    activeSection === section.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                      : "border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-muted)] hover:bg-[var(--color-surface-muted)]"
                  }`}
                >
                  <p className="text-sm font-medium">{section.label}</p>
                  <p className="mt-0.5 text-[11px]">{section.description}</p>
                </button>
              ))}
            </nav>
          </Panel>

          <Panel className="p-4 sm:p-5">
            {activeSection === "general" && (
              <section>
                <h2 className="text-lg font-semibold">General</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">This area will grow with workspace-level controls, notifications, and integrations.</p>
                <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-muted)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-sm text-[var(--color-text-muted)]">Placeholder ready for future modules.</p>
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Control visual style and density across the wall.</p>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                    <span>Theme preference</span>
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
                  <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                    <span>Compact mode</span>
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(event) => setCompactMode(event.target.checked)}
                      className="h-4 w-4 accent-[var(--color-accent-strong)]"
                    />
                  </label>
                </div>
              </section>
            )}

            {activeSection === "accessibility" && (
              <section>
                <h2 className="text-lg font-semibold">Accessibility</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Make interactions calmer and easier to follow.</p>
                <label className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <span>Reduce motion</span>
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(event) => setReduceMotion(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-accent-strong)]"
                  />
                </label>
              </section>
            )}

            {activeSection === "keyboard" && (
              <section>
                <h2 className="text-lg font-semibold">Keyboard Color Slots</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Press `C`, then `1-9` to quick-switch by slot. `Shift + C` cycles through configured slots.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 9 }).map((_, index) => {
                    const color = keyboardColorSlots[index];
                    const fallback = defaultKeyboardColorSlots[index] ?? "#FEEA89";
                    return (
                      <div key={`shortcut-color-${index + 1}`} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-xs font-semibold">
                          {index + 1}
                        </span>
                        <input
                          type="color"
                          value={color ?? fallback}
                          onChange={(event) => setKeyboardSlot(index, event.target.value.toUpperCase())}
                          className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
                          aria-label={`Set keyboard color slot ${index + 1}`}
                        />
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{color ?? "Not set"}</span>
                        <button
                          type="button"
                          onClick={() => setKeyboardSlot(index, null)}
                          className="ml-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                        >
                          Clear
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyboardColorSlots([...defaultKeyboardColorSlots])}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  >
                    Reset defaults
                  </button>
                  <p className="text-xs text-[var(--color-text-muted)]">Save settings to apply across sessions.</p>
                </div>
              </section>
            )}

            {activeSection === "advanced" && (
              <section>
                <h2 className="text-lg font-semibold">Advanced</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">Reserved for future exports, backup controls, and experimental tools.</p>
                <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-muted)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-sm text-[var(--color-text-muted)]">No advanced settings yet.</p>
                </div>
              </section>
            )}

            <div className="mt-6 border-t border-[var(--color-border-muted)] pt-3 text-xs text-[var(--color-text-muted)]">
              Last saved {new Date(savedAt).toLocaleTimeString()}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
};
