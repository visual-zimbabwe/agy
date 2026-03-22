"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldLabel, TextField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

type PrivateNoteModalProps = {
  open: boolean;
  mode: "protect" | "unlock";
  noteLabel: string;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void> | void;
};

export const PrivateNoteModal = ({ open, mode, noteLabel, error, onClose, onSubmit }: PrivateNoteModalProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmPassword("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const protectMode = mode === "protect";
  const mismatch = protectMode && password && confirmPassword && password !== confirmPassword;
  const canSubmit = password.trim().length >= 8 && (!protectMode || (!mismatch && confirmPassword.trim().length >= 8));

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={protectMode ? "Protect note" : "Unlock private note"}
      description={protectMode ? `Set a password for ${noteLabel}. If you forget it, the app cannot recover the note.` : `Enter the password for ${noteLabel}.`}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-3">
        <div>
          <FieldLabel htmlFor="private-note-password">Password</FieldLabel>
          <TextField
            id="private-note-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Use a password you can remember"
            autoFocus
          />
        </div>
        {protectMode && (
          <div>
            <FieldLabel htmlFor="private-note-confirm">Confirm password</FieldLabel>
            <TextField
              id="private-note-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter the same password again"
            />
          </div>
        )}
        {protectMode && <p className="text-xs text-[var(--color-text-muted)]">Use at least 8 characters.</p>}
        {mismatch && <p className="text-xs text-[#B42318]">Passwords do not match.</p>}
        {error && <p className="text-xs text-[#B42318]">{error}</p>}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose} variant="secondary" disabled={submitting}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!canSubmit || submitting}
          onClick={async () => {
            if (!canSubmit) {
              return;
            }
            setSubmitting(true);
            try {
              await onSubmit(password);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {protectMode ? (submitting ? "Protecting..." : "Protect note") : submitting ? "Unlocking..." : "Unlock note"}
        </Button>
      </div>
    </ModalShell>
  );
};
