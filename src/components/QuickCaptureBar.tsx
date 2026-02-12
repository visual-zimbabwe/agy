"use client";

import { useState } from "react";

import { parseCaptureItems, type CaptureItem } from "@/components/quick-capture/quickCaptureParsers";
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
      description="Type ideas quickly. One line becomes one note."
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
        <Badge className="ml-auto">Ctrl/Cmd + Enter capture</Badge>
      </div>
    </ModalShell>
  );
};
