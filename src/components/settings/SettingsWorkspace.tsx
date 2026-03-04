"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { controlsModeStorageKey, layoutPrefsStorageKey } from "@/components/wall/wall-canvas-helpers";
import { defaultKeyboardColorSlots, readKeyboardColorSlots, writeKeyboardColorSlots } from "@/lib/keyboard-color-slots";
import {
  applyPreferencesToDocument,
  preferenceStorageKeys,
  persistPreferences,
  readStoredPreferences,
  type StartupBehavior,
  type StartupPage,
  type ThemePreference,
} from "@/lib/preferences";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SettingsWorkspaceProps = {
  userEmail: string;
  embedded?: boolean;
};

const profileUpdatedEventName = "idea-wall-profile-updated";
const preferencesUpdatedEventName = "idea-wall-preferences-updated";

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

type SettingsSectionId = "general" | "appearance" | "keyboard" | "advanced";

const settingsSections: Array<{ id: SettingsSectionId; label: string; description: string }> = [
  { id: "general", label: "My account", description: "Profile and workspace identity." },
  { id: "appearance", label: "My settings", description: "Appearance, startup, and date/time behavior." },
  { id: "keyboard", label: "Keyboard", description: "Shortcut color slots." },
  { id: "advanced", label: "Workspace", description: "Wall chrome and control density." },
];

const commonTimezones = [
  "UTC",
  "America/Vancouver",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
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
  <label className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)]">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-44 appearance-none bg-transparent pr-1 text-right outline-none"
      aria-label={label}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <span className="text-[11px] text-[var(--color-text-muted)]">▾</span>
  </label>
);

const ToggleControl = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-7 w-12 overflow-hidden rounded-full border border-transparent p-[2px] transition-colors ${checked ? "bg-[#2f7adf]" : "bg-[#d1d5db]"}`}
  >
    <span
      className={`absolute left-[2px] top-[2px] h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.28)] transition-transform ${checked ? "translate-x-[20px]" : "translate-x-0"}`}
    />
  </button>
);

type AvatarCropModalProps = {
  open: boolean;
  sourceDataUrl: string;
  zoom: number;
  panX: number;
  panY: number;
  onZoomChange: (value: number) => void;
  onPanXChange: (value: number) => void;
  onPanYChange: (value: number) => void;
  onClose: () => void;
  onApply: () => void;
  busy: boolean;
};

const drawAvatarCrop = ({
  canvas,
  image,
  zoom,
  panX,
  panY,
}: {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  zoom: number;
  panX: number;
  panY: number;
}) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const { width: size } = canvas;
  const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const maxPanX = Math.max(0, (drawW - size) / 2);
  const maxPanY = Math.max(0, (drawH - size) / 2);
  const offsetX = (panX / 100) * maxPanX;
  const offsetY = (panY / 100) * maxPanY;
  const x = (size - drawW) / 2 + offsetX;
  const y = (size - drawH) / 2 + offsetY;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, x, y, drawW, drawH);
};

const clampPan = (value: number) => Math.max(-100, Math.min(100, value));
const avatarMinZoom = 1.15;

const getAvatarPanMetrics = (size: number, image: HTMLImageElement, zoom: number) => {
  const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  return {
    maxPanX: Math.max(0, (drawW - size) / 2),
    maxPanY: Math.max(0, (drawH - size) / 2),
  };
};

const AvatarCropModal = ({
  open,
  sourceDataUrl,
  zoom,
  panX,
  panY,
  onZoomChange,
  onPanXChange,
  onPanYChange,
  onClose,
  onApply,
  busy,
}: AvatarCropModalProps) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  useEffect(() => {
    if (!open || !sourceDataUrl) {
      return;
    }
    const image = new Image();
    image.onload = () => setLoadedImage(image);
    image.src = sourceDataUrl;
  }, [open, sourceDataUrl]);

  useEffect(() => {
    if (!open || !loadedImage || !previewCanvasRef.current) {
      return;
    }
    drawAvatarCrop({
      canvas: previewCanvasRef.current,
      image: loadedImage,
      zoom,
      panX,
      panY,
    });
  }, [loadedImage, open, panX, panY, zoom]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!loadedImage || !previewCanvasRef.current) {
      return;
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: panX,
      startPanY: panY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || !loadedImage || !previewCanvasRef.current) {
      return;
    }
    const drag = dragStateRef.current;
    const size = previewCanvasRef.current.width;
    const metrics = getAvatarPanMetrics(size, loadedImage, zoom);
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const nextPanX = metrics.maxPanX > 0 ? clampPan(drag.startPanX + (deltaX / metrics.maxPanX) * 100) : drag.startPanX;
    const nextPanY = metrics.maxPanY > 0 ? clampPan(drag.startPanY + (deltaY / metrics.maxPanY) * 100) : drag.startPanY;
    onPanXChange(nextPanX);
    onPanYChange(nextPanY);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Crop Profile Image"
      description="Adjust framing before upload for better face visibility and clarity."
      maxWidthClassName="max-w-lg"
      panelClassName="p-5"
      contentClassName="mt-4"
    >
      <div className="space-y-4">
        <div
          className="mx-auto w-fit rounded-full border border-[#d1d5db] bg-white p-2"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <canvas ref={previewCanvasRef} width={320} height={320} className="h-64 w-64 cursor-grab active:cursor-grabbing rounded-full" />
        </div>
        <p className="text-center text-xs text-[var(--color-text-muted)]">Drag the image to position your face in frame.</p>
        <label className="block text-xs text-[var(--color-text-muted)]">
          Zoom
          <input
            type="range"
            min={avatarMinZoom}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={onApply} disabled={busy || !loadedImage}>
            {busy ? "Uploading..." : "Apply & Upload"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export const SettingsWorkspace = ({ userEmail, embedded = false }: SettingsWorkspaceProps) => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredPreferences().theme);
  const [startupBehavior, setStartupBehavior] = useState<StartupBehavior>(() => readStoredPreferences().startupBehavior);
  const [startupDefaultPage, setStartupDefaultPage] = useState<StartupPage>(() => readStoredPreferences().startupDefaultPage);
  const [autoTimezone, setAutoTimezone] = useState(() => readStoredPreferences().autoTimezone);
  const [manualTimezone, setManualTimezone] = useState(() => readStoredPreferences().manualTimezone);
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
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarSourceDataUrl, setAvatarSourceDataUrl] = useState("");
  const [avatarCropZoom, setAvatarCropZoom] = useState(avatarMinZoom);
  const [avatarCropPanX, setAvatarCropPanX] = useState(0);
  const [avatarCropPanY, setAvatarCropPanY] = useState(0);

  const preferenceState = useMemo(
    () => ({ theme, startupBehavior, startupDefaultPage, autoTimezone, manualTimezone }),
    [autoTimezone, manualTimezone, startupBehavior, startupDefaultPage, theme],
  );

  const onSavePreferences = () => {
    persistPreferences(preferenceState);
    applyPreferencesToDocument(preferenceState);
    window.dispatchEvent(new CustomEvent(preferencesUpdatedEventName));
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
  const detectedTimezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const effectiveTimezone = autoTimezone ? detectedTimezone : manualTimezone;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(preferenceStorageKeys.theme, theme);
    document.documentElement.dataset.themePreference = theme;
  }, [theme]);

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
      window.dispatchEvent(new CustomEvent(profileUpdatedEventName));
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
      window.dispatchEvent(new CustomEvent(profileUpdatedEventName));
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to upload profile image.");
    } finally {
      setAccountBusy(null);
    }
  };

  const beginAvatarCrop = async (file: File) => {
    const sourceDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read selected image."));
      reader.readAsDataURL(file);
    });
    setAvatarSourceDataUrl(sourceDataUrl);
    setAvatarCropZoom(avatarMinZoom);
    setAvatarCropPanX(0);
    setAvatarCropPanY(0);
    setAvatarCropOpen(true);
  };

  const renderCroppedAvatarFile = async () => {
    if (!avatarSourceDataUrl) {
      throw new Error("No image selected.");
    }
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load selected image."));
      img.src = avatarSourceDataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    drawAvatarCrop({
      canvas,
      image,
      zoom: avatarCropZoom,
      panX: avatarCropPanX,
      panY: avatarCropPanY,
    });
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (!value) {
            reject(new Error("Failed to process image."));
            return;
          }
          resolve(value);
        },
        "image/webp",
        0.96,
      );
    });
    return new File([blob], `avatar-${Date.now()}.webp`, { type: "image/webp" });
  };

  const applyAvatarCropAndUpload = async () => {
    try {
      const file = await renderCroppedAvatarFile();
      await handleAvatarUpload(file);
      setAvatarCropOpen(false);
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Failed to process avatar image.");
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
        <aside className="w-[260px] border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">Account</p>
            <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">Idea Wall User</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{userEmail}</p>
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
                    isActive ? "bg-[var(--color-surface)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
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
                className="inline-flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
              >
                Back to wall
              </Link>
            )}
          </div>
        </aside>

        <article className={`flex-1 bg-[var(--color-surface)] p-5 sm:p-8 ${embedded ? "overflow-y-auto" : ""}`}>
          <header className="border-b border-[var(--color-border)] pb-4">
            <h1 className="text-[30px] font-semibold tracking-tight text-[var(--color-text)]">{activeSectionMeta?.label ?? "My settings"}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{activeSectionMeta?.description ?? "Manage your preferences."}</p>
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
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                      {profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profilePhotoUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[10px] text-[var(--color-text-muted)]">No photo</div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void beginAvatarCrop(file);
                          }
                          event.currentTarget.value = "";
                        }}
                        disabled={accountBusy !== null}
                      />
                    </label>
                    <span className="text-[11px] text-[var(--color-text-muted)]">Max 5MB, JPG/PNG/WEBP/GIF</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      value={preferredName}
                      onChange={(event) => setPreferredName(event.target.value)}
                      placeholder="Preferred name"
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-focus)]"
                    />
                    <input
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      placeholder="Email address"
                      type="email"
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-focus)]"
                    />
                    <input
                      value={profilePhotoUrl}
                      onChange={(event) => setProfilePhotoUrl(event.target.value)}
                      placeholder="Profile photo URL (optional)"
                      className="sm:col-span-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-focus)]"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void handleSaveProfileBasics()} disabled={accountBusy !== null}>
                      {accountBusy === "profile" ? "Saving..." : "Save profile basics"}
                    </Button>
                    <span className="text-xs text-[var(--color-text-muted)]">Signed in as {userEmail}</span>
                  </div>
                </section>

                <section className="border-b border-[var(--color-border-muted)] py-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">Account Security</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Set or change password and manage two-step verification (2FA).</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="password"
                      placeholder="New password"
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)]"
                    />
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type="password"
                      placeholder="Confirm password"
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-focus)]"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void handleUpdatePassword()} disabled={accountBusy !== null}>
                      {accountBusy === "password" ? "Updating..." : "Update password"}
                    </Button>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        mfaEnabled ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
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
                    <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <p className="text-xs text-[var(--color-text)]">Scan this QR code with your authenticator app:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mfaQrCode} alt="2FA QR Code" className="mt-2 h-36 w-36 rounded border border-[var(--color-border)]" />
                      <p className="mt-2 break-all font-mono text-[11px] text-[var(--color-text-muted)]">Secret: {mfaSecret}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={mfaVerifyCode}
                          onChange={(event) => setMfaVerifyCode(event.target.value)}
                          placeholder="Enter 6-digit code"
                          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-focus)]"
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
                  <h2 className="text-sm font-semibold text-rose-700">Danger Zone</h2>
                  <p className="mt-1 text-xs text-rose-700/80">Global account actions that affect all signed-in sessions.</p>
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
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Global application: changes here apply to your user profile everywhere this account is used.
                  </p>
                  {accountStatus && <p className="mt-2 text-xs text-[var(--color-text)]">{accountStatus}</p>}
                </section>
              </>
            )}

            {activeSection === "appearance" && (
              <>
                <SettingRow
                  title="Appearance"
                  description="Choose Light, Dark, or System theme."
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
                  title="On startup"
                  description="Choose what opens when the app launches."
                  control={
                    <SelectControl
                      value={startupBehavior}
                      onChange={(value) => setStartupBehavior(value as StartupBehavior)}
                      label="Startup behavior"
                      options={[
                        { value: "default_page", label: "Default page" },
                        { value: "continue_last", label: "Continue where left off" },
                      ]}
                    />
                  }
                />
                {startupBehavior === "default_page" && (
                  <SettingRow
                    title="Default page"
                    description="Used at startup when no last-session page should be restored."
                    control={
                      <SelectControl
                        value={startupDefaultPage}
                        onChange={(value) => setStartupDefaultPage(value as StartupPage)}
                        label="Default startup page"
                        options={[
                          { value: "/wall", label: "Wall" },
                          { value: "/decks", label: "Decks" },
                        ]}
                      />
                    }
                  />
                )}
                <article className="border-b border-[var(--color-border-muted)] py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-sm font-medium text-[var(--color-text)]">Date &amp; Time</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Set timezone automatically using your location.</p>
                    </div>
                    <ToggleControl checked={autoTimezone} onChange={setAutoTimezone} />
                  </div>
                  {!autoTimezone && (
                    <div className="mt-3 max-w-xs">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Select city / timezone</label>
                      <label className="inline-flex w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-sm text-[var(--color-text)]">
                        <select
                          value={manualTimezone}
                          onChange={(event) => setManualTimezone(event.target.value)}
                          className="w-full appearance-none bg-transparent pr-1 text-right outline-none"
                        >
                          {commonTimezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-[var(--color-text-muted)]">v</span>
                      </label>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                    Time Zone set: <span className="font-medium text-[var(--color-text)]">{effectiveTimezone}</span>
                  </p>
                </article>
              </>
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
                  <h2 className="text-sm font-medium text-[var(--color-text)]">Keyboard color slots</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Press `C`, then `1-9` to quick switch note color slots.</p>
                </section>
                <div className="grid gap-2 py-3 sm:grid-cols-2">
                  {Array.from({ length: 9 }).map((_, index) => {
                    const color = keyboardColorSlots[index];
                    const fallback = defaultKeyboardColorSlots[index] ?? "#FEEA89";
                    return (
                      <article key={`shortcut-color-${index + 1}`} className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-xs font-semibold text-[var(--color-text)]">
                          {index + 1}
                        </span>
                        <input
                          type="color"
                          value={color ?? fallback}
                          onChange={(event) => setKeyboardSlot(index, event.target.value.toUpperCase())}
                          className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
                          aria-label={`Set keyboard color slot ${index + 1}`}
                        />
                        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{color ?? "Not set"}</span>
                        <button
                          type="button"
                          onClick={() => setKeyboardSlot(index, null)}
                          className="ml-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                        >
                          Clear
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Save settings to persist slot updates.</p>
                  <button
                    type="button"
                    onClick={() => setKeyboardColorSlots([...defaultKeyboardColorSlots])}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  >
                    Reset defaults
                  </button>
                </div>
              </>
            )}

            <footer className="pt-5 text-xs text-[var(--color-text-muted)]">Last saved {new Date(savedAt).toLocaleTimeString()}.</footer>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Current controls mode: {controlsModeLabel}.</p>
          </section>
        </article>
      </section>
  );

  if (embedded) {
    return (
      <div className="h-[min(78vh,760px)] min-h-[540px] w-full overflow-hidden rounded-xl bg-[var(--background)] text-[var(--color-text)]">
        {content}
        <AvatarCropModal
          open={avatarCropOpen}
          sourceDataUrl={avatarSourceDataUrl}
          zoom={avatarCropZoom}
          panX={avatarCropPanX}
          panY={avatarCropPanY}
          onZoomChange={setAvatarCropZoom}
          onPanXChange={setAvatarCropPanX}
          onPanYChange={setAvatarCropPanY}
          onClose={() => setAvatarCropOpen(false)}
          onApply={() => void applyAvatarCropAndUpload()}
          busy={accountBusy === "avatar"}
        />
      </div>
    );
  }

  return (
    <main className="route-shell min-h-screen bg-[var(--background)] text-[var(--color-text)]">
      {content}
      <AvatarCropModal
        open={avatarCropOpen}
        sourceDataUrl={avatarSourceDataUrl}
        zoom={avatarCropZoom}
        panX={avatarCropPanX}
        panY={avatarCropPanY}
        onZoomChange={setAvatarCropZoom}
        onPanXChange={setAvatarCropPanX}
        onPanYChange={setAvatarCropPanY}
        onClose={() => setAvatarCropOpen(false)}
        onApply={() => void applyAvatarCropAndUpload()}
        busy={accountBusy === "avatar"}
      />
    </main>
  );
};
