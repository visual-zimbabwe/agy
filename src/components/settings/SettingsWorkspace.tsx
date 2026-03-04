"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { controlsModeStorageKey, layoutPrefsStorageKey } from "@/components/wall/wall-canvas-helpers";
import { defaultKeyboardColorSlots, readKeyboardColorSlots, writeKeyboardColorSlots } from "@/lib/keyboard-color-slots";
import { applyPreferencesToDocument, persistPreferences, readStoredPreferences, type ThemePreference } from "@/lib/preferences";

type SettingsWorkspaceProps = {
  userEmail: string;
};

type WallLayoutPrefs = {
  showToolsPanel: boolean;
  showDetailsPanel: boolean;
  showContextBar: boolean;
  showNoteTags: boolean;
};

type ControlsMode = "basic" | "advanced";

const defaultWallLayoutPrefs: WallLayoutPrefs = {
  showToolsPanel: true,
  showDetailsPanel: true,
  showContextBar: false,
  showNoteTags: false,
};

type SettingsSectionId = "general" | "appearance" | "accessibility" | "keyboard" | "advanced";

const settingsSections: Array<{ id: SettingsSectionId; label: string; description: string }> = [
  { id: "general", label: "My account", description: "Profile and workspace identity." },
  { id: "appearance", label: "My settings", description: "Theme and visual density." },
  { id: "accessibility", label: "Accessibility", description: "Motion preferences." },
  { id: "keyboard", label: "Keyboard", description: "Shortcut color slots." },
  { id: "advanced", label: "Workspace", description: "Wall chrome and control density." },
];

const SettingRow = ({
  title,
  description,
  control,
  compact = false,
}: {
  title: string;
  description: string;
  control: ReactNode;
  compact?: boolean;
}) => (
  <article className={`flex items-start justify-between gap-4 border-b border-[var(--color-border-muted)] ${compact ? "py-3" : "py-4"}`}>
    <div className="min-w-0 pr-2">
      <h3 className="text-sm font-medium text-[var(--color-text)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
    </div>
    <div className="shrink-0">{control}</div>
  </article>
);

const SelectControl = ({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; label: string }) => (
  <label className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)]">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-24 appearance-none bg-transparent pr-3 text-right outline-none"
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <span className="text-[10px] text-[var(--color-text-muted)]">v</span>
  </label>
);

const ToggleControl = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
    className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[#2f7adf]" : "bg-[#d1d5db]"}`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
    />
  </button>
);

export const SettingsWorkspace = ({ userEmail }: SettingsWorkspaceProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("appearance");
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredPreferences().theme);
  const [reduceMotion, setReduceMotion] = useState(() => readStoredPreferences().reduceMotion);
  const [compactMode, setCompactMode] = useState(() => readStoredPreferences().compactMode);
  const [keyboardColorSlots, setKeyboardColorSlots] = useState<Array<string | null>>(() => readKeyboardColorSlots());
  const [wallLayoutPrefs, setWallLayoutPrefs] = useState<WallLayoutPrefs>(() => {
    if (typeof window === "undefined") {
      return defaultWallLayoutPrefs;
    }
    try {
      const raw = window.localStorage.getItem(layoutPrefsStorageKey);
      if (!raw) {
        return defaultWallLayoutPrefs;
      }
      const parsed = JSON.parse(raw) as Partial<WallLayoutPrefs>;
      return {
        showToolsPanel: parsed.showToolsPanel ?? defaultWallLayoutPrefs.showToolsPanel,
        showDetailsPanel: parsed.showDetailsPanel ?? defaultWallLayoutPrefs.showDetailsPanel,
        showContextBar: parsed.showContextBar ?? defaultWallLayoutPrefs.showContextBar,
        showNoteTags: parsed.showNoteTags ?? defaultWallLayoutPrefs.showNoteTags,
      };
    } catch {
      return defaultWallLayoutPrefs;
    }
  });
  const [controlsMode, setControlsMode] = useState<ControlsMode>(() => {
    if (typeof window === "undefined") {
      return "basic";
    }
    const raw = window.localStorage.getItem(controlsModeStorageKey);
    return raw === "advanced" ? "advanced" : "basic";
  });
  const [savedAt, setSavedAt] = useState<number>(() => Date.now());

  const preferenceState = useMemo(
    () => ({ theme, reduceMotion, compactMode }),
    [compactMode, reduceMotion, theme],
  );

  const onSavePreferences = () => {
    persistPreferences(preferenceState);
    applyPreferencesToDocument(preferenceState);
    writeKeyboardColorSlots(keyboardColorSlots);
    window.localStorage.setItem(layoutPrefsStorageKey, JSON.stringify(wallLayoutPrefs));
    window.localStorage.setItem(controlsModeStorageKey, controlsMode);
    setSavedAt(Date.now());
  };

  const setKeyboardSlot = (index: number, color: string | null) => {
    setKeyboardColorSlots((previous) => {
      const next = [...previous];
      next[index] = color;
      return next;
    });
  };

  const activeSectionMeta = settingsSections.find((section) => section.id === activeSection);
  const controlsModeLabel = controlsMode === "advanced" ? "Advanced" : "Basic";

  return (
    <main className="route-shell min-h-screen bg-[#f7f7f6] text-[#191919]">
      <section className="mx-auto flex min-h-screen w-full max-w-[1180px] gap-0 px-0">
        <aside className="w-[260px] border-r border-[#e7e6e4] bg-[#f1f1ef] p-5">
          <div className="rounded-lg bg-[#ececea] px-3 py-3">
            <p className="text-xs font-semibold text-[#4b5563]">Account</p>
            <p className="mt-1 truncate text-sm font-medium text-[#111827]">Idea Wall User</p>
            <p className="truncate text-xs text-[#6b7280]">{userEmail}</p>
          </div>

          <nav aria-label="Settings sections" className="mt-4 space-y-1">
            {settingsSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    isActive ? "bg-[#e4e4e2] text-[#111827]" : "text-[#4b5563] hover:bg-[#e9e9e7]"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={onSavePreferences}>
              Save settings
            </Button>
            <Link
              href="/wall"
              className="inline-flex items-center justify-center rounded-md border border-[#d4d4d2] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f3f4f6]"
            >
              Back to wall
            </Link>
          </div>
        </aside>

        <article className="flex-1 bg-[#fafafa] p-5 sm:p-8">
          <header className="border-b border-[#e5e7eb] pb-4">
            <h1 className="text-[30px] font-semibold tracking-tight text-[#111827]">{activeSectionMeta?.label ?? "My settings"}</h1>
            <p className="mt-1 text-sm text-[#6b7280]">{activeSectionMeta?.description ?? "Manage your preferences."}</p>
          </header>

          <section className="mt-5 max-w-3xl">
            {activeSection === "general" && (
              <>
                <SettingRow
                  title="Signed in as"
                  description="Current account email for this workspace."
                  control={<span className="max-w-56 truncate text-xs text-[#4b5563]">{userEmail}</span>}
                />
                <SettingRow
                  title="Last saved"
                  description="Most recent local settings save time."
                  control={<span className="text-xs text-[#4b5563]">{new Date(savedAt).toLocaleTimeString()}</span>}
                />
              </>
            )}

            {activeSection === "appearance" && (
              <>
                <SettingRow
                  title="Appearance"
                  description="Choose how Idea Wall looks on your device."
                  control={
                    <SelectControl
                      value={theme}
                      onChange={(value) => setTheme(value as ThemePreference)}
                      label="Theme preference"
                      options={[
                        { value: "system", label: "System" },
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                      ]}
                    />
                  }
                />
                <SettingRow
                  title="Compact mode"
                  description="Reduce spacing for denser wall controls."
                  control={<ToggleControl checked={compactMode} onChange={setCompactMode} />}
                />
              </>
            )}

            {activeSection === "accessibility" && (
              <SettingRow
                title="Reduce motion"
                description="Minimize non-essential animation and movement."
                control={<ToggleControl checked={reduceMotion} onChange={setReduceMotion} />}
              />
            )}

            {activeSection === "advanced" && (
              <>
                <SettingRow
                  title="Show Tools panel controls"
                  description="Display quick controls for tools in wall mode."
                  control={
                    <ToggleControl
                      checked={wallLayoutPrefs.showToolsPanel}
                      onChange={(checked) => setWallLayoutPrefs((previous) => ({ ...previous, showToolsPanel: checked }))}
                    />
                  }
                />
                <SettingRow
                  title="Show Details panel controls"
                  description="Display quick controls for details panel behavior."
                  control={
                    <ToggleControl
                      checked={wallLayoutPrefs.showDetailsPanel}
                      onChange={(checked) => setWallLayoutPrefs((previous) => ({ ...previous, showDetailsPanel: checked }))}
                    />
                  }
                />
                <SettingRow
                  title="Show context bar"
                  description="Show contextual actions near selected content."
                  control={
                    <ToggleControl
                      checked={wallLayoutPrefs.showContextBar}
                      onChange={(checked) => setWallLayoutPrefs((previous) => ({ ...previous, showContextBar: checked }))}
                    />
                  }
                />
                <SettingRow
                  title="Show note tags on cards"
                  description="Render tag chips directly on note cards."
                  control={
                    <ToggleControl
                      checked={wallLayoutPrefs.showNoteTags}
                      onChange={(checked) => setWallLayoutPrefs((previous) => ({ ...previous, showNoteTags: checked }))}
                    />
                  }
                />
                <SettingRow
                  title="Wall controls density"
                  description="Choose between basic and advanced controls."
                  control={
                    <SelectControl
                      value={controlsMode}
                      onChange={(value) => setControlsMode(value as ControlsMode)}
                      label="Wall controls density"
                      options={[
                        { value: "basic", label: "Basic" },
                        { value: "advanced", label: "Advanced" },
                      ]}
                    />
                  }
                />
              </>
            )}

            {activeSection === "keyboard" && (
              <>
                <section className="border-b border-[var(--color-border-muted)] py-4">
                  <h2 className="text-sm font-medium text-[#111827]">Keyboard color slots</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">Press `C`, then `1-9` to quick switch note color slots.</p>
                </section>
                <div className="grid gap-2 py-3 sm:grid-cols-2">
                  {Array.from({ length: 9 }).map((_, index) => {
                    const color = keyboardColorSlots[index];
                    const fallback = defaultKeyboardColorSlots[index] ?? "#FEEA89";
                    return (
                      <article key={`shortcut-color-${index + 1}`} className="flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[#d1d5db] bg-[#f9fafb] text-xs font-semibold text-[#374151]">
                          {index + 1}
                        </span>
                        <input
                          type="color"
                          value={color ?? fallback}
                          onChange={(event) => setKeyboardSlot(index, event.target.value.toUpperCase())}
                          className="h-7 w-9 cursor-pointer rounded border border-[#d1d5db] bg-white p-0.5"
                          aria-label={`Set keyboard color slot ${index + 1}`}
                        />
                        <span className="font-mono text-[11px] text-[#6b7280]">{color ?? "Not set"}</span>
                        <button
                          type="button"
                          onClick={() => setKeyboardSlot(index, null)}
                          className="ml-auto rounded border border-[#d1d5db] bg-[#f9fafb] px-2 py-0.5 text-[11px] text-[#4b5563] hover:bg-white"
                        >
                          Clear
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-[#e5e7eb] py-3">
                  <p className="text-xs text-[#6b7280]">Save settings to persist slot updates.</p>
                  <button
                    type="button"
                    onClick={() => setKeyboardColorSlots([...defaultKeyboardColorSlots])}
                    className="rounded border border-[#d1d5db] bg-white px-2.5 py-1 text-xs text-[#374151] hover:bg-[#f3f4f6]"
                  >
                    Reset defaults
                  </button>
                </div>
              </>
            )}

            <footer className="pt-5 text-xs text-[#6b7280]">Last saved {new Date(savedAt).toLocaleTimeString()}.</footer>
            <p className="mt-1 text-xs text-[#9ca3af]">Current controls mode: {controlsModeLabel}.</p>
          </section>
        </article>
      </section>
    </main>
  );
};
