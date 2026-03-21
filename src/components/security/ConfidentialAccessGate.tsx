"use client";

import { useMemo, useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextField } from "@/components/ui/Field";

type ConfidentialAccessGateProps = {
  open: boolean;
  hasConfig: boolean;
  scopeLabel: string;
  onCreate: (passphrase: string) => Promise<{ ok: boolean; error?: string }>;
  onUnlock: (passphrase: string) => Promise<{ ok: boolean; error?: string }>;
};

export const ConfidentialAccessGate = ({ open, hasConfig, scopeLabel, onCreate, onUnlock }: ConfidentialAccessGateProps) => {
  const [mode, setMode] = useState<"create" | "unlock">(hasConfig ? "unlock" : "create");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => (mode === "create" ? `Protect ${scopeLabel}` : `Unlock ${scopeLabel}`), [mode, scopeLabel]);

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={() => undefined}
      title={title}
      description="Content stays encrypted at rest and only unlocks for the current session. Forgotten passphrases cannot be recovered by the server."
      closeOnBackdrop={false}
      showCloseButton={false}
      maxWidthClassName="max-w-lg"
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          setError(null);

          try {
            if (mode === "create" && passphrase !== confirmPassphrase) {
              setError("Passphrases do not match.");
              return;
            }

            const result = mode === "create" ? await onCreate(passphrase) : await onUnlock(passphrase);
            if (!result.ok) {
              setError(result.error ?? "Unable to continue.");
              return;
            }

            setPassphrase("");
            setConfirmPassphrase("");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div>
          <FieldLabel htmlFor="confidential-passphrase">Passphrase</FieldLabel>
          <TextField
            id="confidential-passphrase"
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>

        {mode === "create" && (
          <div>
            <FieldLabel htmlFor="confidential-passphrase-confirm">Confirm Passphrase</FieldLabel>
            <TextField
              id="confidential-passphrase-confirm"
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={submitting}>
            {mode === "create" ? "Enable Confidential Mode" : "Unlock"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              setError(null);
              setPassphrase("");
              setConfirmPassphrase("");
              setMode((previous) => (previous === "create" ? "unlock" : "create"));
            }}
          >
            {mode === "create" ? "I already have a passphrase" : hasConfig ? "Create a new passphrase" : "Create passphrase"}
          </Button>
        </div>

        <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
          <p>Unlocked sessions auto-lock after 5 minutes of inactivity and when the tab is hidden.</p>
          <p>Exports such as PNG, PDF, Markdown, and legacy JSON create readable copies outside the encrypted workspace.</p>
        </div>
      </form>
    </ModalShell>
  );
};
