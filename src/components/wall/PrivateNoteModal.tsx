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
  onSubmit: (passphrase: string) => Promise<void> | void;
};

export const PrivateNoteModal = ({ open, mode, noteLabel, error, onClose, onSubmit }: PrivateNoteModalProps) => {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassphrase("");
      setConfirmPassphrase("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const protectMode = mode === "protect";
  const mismatch = protectMode && passphrase && confirmPassphrase && passphrase !== confirmPassphrase;
  const canSubmit = passphrase.trim().length >= 8 && (!protectMode || (!mismatch && confirmPassphrase.trim().length >= 8));

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={protectMode ? "Protect note" : "Unlock private note"}
      description={protectMode ? `Set a passphrase for ${noteLabel}. If you forget it, the app cannot recover the note.` : `Enter the passphrase for ${noteLabel}.`}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-3">
        <div>
          <FieldLabel htmlFor="private-note-passphrase">Passphrase</FieldLabel>
          <TextField
            id="private-note-passphrase"
            type="password"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            placeholder="Use a long phrase you can remember"
            autoFocus
          />
        </div>
        {protectMode && (
          <div>
            <FieldLabel htmlFor="private-note-confirm">Confirm passphrase</FieldLabel>
            <TextField
              id="private-note-confirm"
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
              placeholder="Enter the same passphrase again"
            />
          </div>
        )}
        {protectMode && <p className="text-xs text-[var(--color-text-muted)]">Use at least 8 characters. A short sentence or 4-6 words is better than a short password.</p>}
        {mismatch && <p className="text-xs text-[#B42318]">Passphrases do not match.</p>}
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
              await onSubmit(passphrase);
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
