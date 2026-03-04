"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { controlsModeStorageKey, layoutPrefsStorageKey } from "@/components/wall/wall-canvas-helpers";
import { defaultKeyboardColorSlots, readKeyboardColorSlots, writeKeyboardColorSlots } from "@/lib/keyboard-color-slots";
import { applyPreferencesToDocument, persistPreferences, readStoredPreferences, type ThemePreference } from "@/lib/preferences";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SettingsWorkspaceProps = {
  userEmail: string;
  embedded?: boolean;
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

export const SettingsWorkspace = ({ userEmail, embedded = false }: SettingsWorkspaceProps) => {
  const router = useRouter();
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
  const [preferredName, setPreferredName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profileEmail, setProfileEmail] = useState(userEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState<"profile" | "password" | "logout" | "delete" | "avatar" | "mfa" | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");

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

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
      setPreferredName(typeof metadata?.full_name === "string" ? metadata.full_name : "");
      setProfilePhotoUrl(typeof metadata?.avatar_url === "string" ? metadata.avatar_url : "");
      setProfileEmail(data.user?.email ?? userEmail);
    };
    void loadProfile();
  }, [userEmail]);

  const refreshMfaState = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setAccountStatus(error.message ?? "Failed to load 2FA status.");
      return;
    }
    const verifiedTotp = data.totp.find((entry) => entry.status === "verified");
    setMfaEnabled(Boolean(verifiedTotp));
    if (verifiedTotp) {
      setMfaFactorId(verifiedTotp.id);
      setMfaQrCode("");
      setMfaSecret("");
      setMfaVerifyCode("");
    }
  };

  useEffect(() => {
    void refreshMfaState();
  }, []);

  const handleSaveProfileBasics = async () => {
    setAccountBusy("profile");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const payload: { email?: string; data?: { full_name: string | null; avatar_url: string | null } } = {
        data: {
          full_name: preferredName.trim() || null,
          avatar_url: profilePhotoUrl.trim() || null,
        },
      };
      const normalizedEmail = profileEmail.trim();
      if (normalizedEmail && normalizedEmail !== userEmail) {
        payload.email = normalizedEmail;
      }
      const { error } = await supabase.auth.updateUser(payload);
      if (error) {
        throw error;
      }
      setAccountStatus(
        normalizedEmail !== userEmail
          ? "Profile saved. Check your inbox to confirm the new email address."
          : "Profile basics saved.",
      );
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to save profile basics.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      setAccountStatus("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountStatus("Password confirmation does not match.");
      return;
    }
    setAccountBusy("password");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }
      setNewPassword("");
      setConfirmPassword("");
      setAccountStatus("Password updated.");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to update password.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAccountBusy("avatar");
    setAccountStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to upload avatar.");
      }
      setProfilePhotoUrl(payload.avatarUrl);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: preferredName.trim() || null,
          avatar_url: payload.avatarUrl,
        },
      });
      if (error) {
        throw error;
      }
      setAccountStatus("Profile image uploaded.");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to upload profile image.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleStartMfaEnrollment = async () => {
    setAccountBusy("mfa");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Idea Wall Authenticator",
      });
      if (error) {
        throw error;
      }
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaVerifyCode("");
      setAccountStatus("Scan the QR code, then enter the 6-digit code to verify.");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to start 2FA setup.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || !mfaVerifyCode.trim()) {
      setAccountStatus("Enter the verification code from your authenticator app.");
      return;
    }
    setAccountBusy("mfa");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) {
        throw challengeError;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaVerifyCode.trim(),
      });
      if (verifyError) {
        throw verifyError;
      }
      setAccountStatus("Two-step verification is now enabled.");
      await refreshMfaState();
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to verify 2FA.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaFactorId) {
      setAccountStatus("No verified 2FA factor found.");
      return;
    }
    const confirmed = window.confirm("Disable two-step verification for this account?");
    if (!confirmed) {
      return;
    }
    setAccountBusy("mfa");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) {
        throw error;
      }
      setAccountStatus("Two-step verification has been disabled.");
      setMfaEnabled(false);
      setMfaFactorId("");
      setMfaQrCode("");
      setMfaSecret("");
      setMfaVerifyCode("");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to disable 2FA.");
    } finally {
      setAccountBusy(null);
    }
  };

  const handleGlobalLogout = async () => {
    setAccountBusy("logout");
    setAccountStatus(null);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "global" });
      router.replace("/login");
      router.refresh();
    } finally {
      setAccountBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('Type "DELETE" to permanently delete your account.');
    if (confirmation !== "DELETE") {
      setAccountStatus("Account deletion cancelled.");
      return;
    }
    setAccountBusy("delete");
    setAccountStatus(null);
    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete account.");
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "global" });
      router.replace("/signup");
      router.refresh();
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to delete account.");
    } finally {
      setAccountBusy(null);
    }
  };

  const content = (
    <section className={`mx-auto flex w-full max-w-[1180px] gap-0 px-0 ${embedded ? "h-full min-h-0" : "min-h-screen"}`}>
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
            {!embedded && (
              <Link
                href="/wall"
                className="inline-flex items-center justify-center rounded-md border border-[#d4d4d2] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f3f4f6]"
              >
                Back to wall
              </Link>
            )}
          </div>
        </aside>

        <article className={`flex-1 bg-[#fafafa] p-5 sm:p-8 ${embedded ? "overflow-y-auto" : ""}`}>
          <header className="border-b border-[#e5e7eb] pb-4">
            <h1 className="text-[30px] font-semibold tracking-tight text-[#111827]">{activeSectionMeta?.label ?? "My settings"}</h1>
            <p className="mt-1 text-sm text-[#6b7280]">{activeSectionMeta?.description ?? "Manage your preferences."}</p>
          </header>

          <section className="mt-5 max-w-3xl">
            {activeSection === "general" && (
              <>
                <section className="border-b border-[var(--color-border-muted)] py-4">
                  <h2 className="text-sm font-semibold text-[#111827]">Profile Basics</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Change your profile image, preferred name, and email address.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-[#d1d5db] bg-[#f3f4f6]">
                      {profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profilePhotoUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[10px] text-[#6b7280]">No photo</div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f3f4f6]">
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleAvatarUpload(file);
                          }
                          event.currentTarget.value = "";
                        }}
                        disabled={accountBusy !== null}
                      />
                    </label>
                    <span className="text-[11px] text-[#6b7280]">Max 5MB, JPG/PNG/WEBP/GIF</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      value={preferredName}
                      onChange={(event) => setPreferredName(event.target.value)}
                      placeholder="Preferred name"
                      className="rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                    />
                    <input
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      placeholder="Email address"
                      type="email"
                      className="rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                    />
                    <input
                      value={profilePhotoUrl}
                      onChange={(event) => setProfilePhotoUrl(event.target.value)}
                      placeholder="Profile photo URL (optional)"
                      className="sm:col-span-2 rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void handleSaveProfileBasics()} disabled={accountBusy !== null}>
                      {accountBusy === "profile" ? "Saving..." : "Save profile basics"}
                    </Button>
                    <span className="text-xs text-[#6b7280]">Signed in as {userEmail}</span>
                  </div>
                </section>

                <section className="border-b border-[var(--color-border-muted)] py-4">
                  <h2 className="text-sm font-semibold text-[#111827]">Account Security</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">Set or change password and manage two-step verification (2FA).</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="password"
                      placeholder="New password"
                      className="rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                    />
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type="password"
                      placeholder="Confirm password"
                      className="rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void handleUpdatePassword()} disabled={accountBusy !== null}>
                      {accountBusy === "password" ? "Updating..." : "Update password"}
                    </Button>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        mfaEnabled ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#d1d5db] bg-[#f9fafb] text-[#6b7280]"
                      }`}
                    >
                      Two-step verification: {mfaEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {!mfaEnabled && !mfaQrCode && (
                    <div className="mt-3">
                      <Button size="sm" variant="secondary" onClick={() => void handleStartMfaEnrollment()} disabled={accountBusy !== null}>
                        {accountBusy === "mfa" ? "Preparing..." : "Set up 2FA"}
                      </Button>
                    </div>
                  )}
                  {!mfaEnabled && mfaQrCode && (
                    <div className="mt-3 rounded-md border border-[#d1d5db] bg-white p-3">
                      <p className="text-xs text-[#374151]">Scan this QR code with your authenticator app:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mfaQrCode} alt="2FA QR Code" className="mt-2 h-36 w-36 rounded border border-[#e5e7eb]" />
                      <p className="mt-2 break-all font-mono text-[11px] text-[#6b7280]">Secret: {mfaSecret}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={mfaVerifyCode}
                          onChange={(event) => setMfaVerifyCode(event.target.value)}
                          placeholder="Enter 6-digit code"
                          className="rounded-md border border-[#d1d5db] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#9ca3af]"
                        />
                        <Button size="sm" variant="secondary" onClick={() => void handleVerifyMfa()} disabled={accountBusy !== null}>
                          {accountBusy === "mfa" ? "Verifying..." : "Verify 2FA"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {mfaEnabled && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => void handleDisableMfa()}
                        disabled={accountBusy !== null}
                        className="rounded-md border border-[#f59e0b] bg-[#fffbeb] px-3 py-1.5 text-xs font-medium text-[#92400e] disabled:opacity-60"
                      >
                        {accountBusy === "mfa" ? "Updating..." : "Disable 2FA"}
                      </button>
                    </div>
                  )}
                </section>

                <section className="border-b border-[var(--color-border-muted)] py-4">
                  <h2 className="text-sm font-semibold text-[#991b1b]">Danger Zone</h2>
                  <p className="mt-1 text-xs text-[#7f1d1d]">Global account actions that affect all signed-in sessions.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void handleGlobalLogout()} disabled={accountBusy !== null}>
                      {accountBusy === "logout" ? "Logging out..." : "Log out of all devices"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteAccount()}
                      disabled={accountBusy !== null}
                      className="rounded-md border border-[#ef4444] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] disabled:opacity-60"
                    >
                      {accountBusy === "delete" ? "Deleting..." : "Delete my account"}
                    </button>
                  </div>
                </section>

                <section className="pt-4">
                  <p className="text-xs text-[#6b7280]">
                    Global application: changes here apply to your user profile everywhere this account is used.
                  </p>
                  {accountStatus && <p className="mt-2 text-xs text-[#374151]">{accountStatus}</p>}
                </section>
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
  );

  if (embedded) {
    return <div className="h-[min(78vh,760px)] min-h-[540px] w-full overflow-hidden rounded-xl bg-[#f7f7f6] text-[#191919]">{content}</div>;
  }

  return (
    <main className="route-shell min-h-screen bg-[#f7f7f6] text-[#191919]">
      {content}
    </main>
  );
};
