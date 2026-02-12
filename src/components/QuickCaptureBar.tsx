"use client";

import { useState } from "react";

import { parseCaptureItems, type CaptureItem } from "@/components/quick-capture/quickCaptureParsers";
import { useQuickCaptureVoice } from "@/components/quick-capture/useQuickCaptureVoice";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { ModalShell } from "@/components/ui/ModalShell";

type QuickCaptureBarProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onCapture: (items: CaptureItem[]) => void;
};

export const QuickCaptureBar = ({ open, disabled, onClose, onCapture }: QuickCaptureBarProps) => {
  const [text, setText] = useState("");

  const { recognitionSupported, voiceActive, voiceMessage, interimTranscript, voiceDebug, startVoice, stopVoice } =
    useQuickCaptureVoice({
      open,
      disabled,
      onAppendText: (chunk) => {
        setText((previous) => `${previous}${previous ? "\n" : ""}${chunk}`);
      },
    });

  if (!open) {
    return null;
  }

  const submitCapture = () => {
    if (disabled) {
      return;
    }
    const items = parseCaptureItems(text);
    if (items.length === 0) {
      return;
    }
    onCapture(items);
    setText("");
    onClose();
  };

  const captureClipboard = async () => {
    if (disabled || !navigator.clipboard) {
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      const items = parseCaptureItems(clipboardText);
      if (items.length > 0) {
        onCapture(items);
      }
    } catch {
      // Clipboard permissions are browser-dependent.
    }
  };

  const parsedCount = parseCaptureItems(text).length;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Quick Capture"
      description="Type or dictate ideas. One line becomes one note."
      maxWidthClassName="max-w-[900px]"
      position="top"
    >
      <TextAreaField
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            submitCapture();
            return;
          }
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "v") {
            event.preventDefault();
            if (voiceActive) {
              stopVoice();
            } else {
              startVoice();
            }
          }
        }}
        placeholder="Type ideas quickly. One line equals one note. Use #tags inline."
        className="h-24 resize-none"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button onClick={submitCapture} disabled={disabled || parsedCount === 0} size="sm" variant="primary">
          Capture {parsedCount > 0 ? `(${parsedCount})` : ""}
        </Button>
        <Button
          onClick={() => {
            void captureClipboard();
          }}
          disabled={disabled}
          size="sm"
        >
          Paste to Notes
        </Button>
        {!voiceActive && (
          <Button
            onClick={startVoice}
            disabled={disabled || !recognitionSupported}
            title={!recognitionSupported ? "Browser does not support SpeechRecognition" : undefined}
            size="sm"
          >
            Start Voice
          </Button>
        )}
        {voiceActive && (
          <Button onClick={stopVoice} disabled={disabled} size="sm" variant="danger">
            Stop Voice
          </Button>
        )}
        <Badge className="ml-auto">Ctrl/Cmd + Enter capture | Ctrl/Cmd + Shift + V voice</Badge>
      </div>

      {voiceMessage && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{voiceMessage}</p>}
      {voiceActive && interimTranscript && (
        <p className="mt-1 rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-text)]">
          Live: {interimTranscript}
        </p>
      )}
      {voiceDebug.length > 0 && (
        <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-border-muted)] bg-[var(--color-surface-muted)] px-2 py-1.5 text-[11px] text-[var(--color-text-muted)]">
          <p className="font-semibold text-[var(--color-text)]">Voice Debug</p>
          {voiceDebug.map((line, index) => (
            <p key={`${line}-${index}`} className="truncate">
              {line}
            </p>
          ))}
        </div>
      )}
    </ModalShell>
  );
};
