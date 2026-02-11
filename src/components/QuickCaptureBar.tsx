"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseTaggedText } from "@/lib/tag-utils";

type CaptureItem = {
  text: string;
  tags: string[];
};

type QuickCaptureBarProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onCapture: (items: CaptureItem[]) => void;
};

type RecognitionResult = {
  0: { transcript: string };
  isFinal: boolean;
};

type RecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type RecognitionErrorLike = {
  error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported"
    | string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const parseCaptureItems = (raw: string): CaptureItem[] => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^([-*]|\d+[.)])\s+/, ""))
    .filter(Boolean);

  return lines
    .map((line) => {
      const parsed = parseTaggedText(line);
      return {
        text: parsed.text || line,
        tags: parsed.tags,
      };
    })
    .filter((item) => item.text.length > 0);
};

const getRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const ctor = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    }
  ).SpeechRecognition ??
    (
      window as Window & {
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).webkitSpeechRecognition;

  return ctor ?? null;
};

export const QuickCaptureBar = ({ open, disabled, onClose, onCapture }: QuickCaptureBarProps) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const recognitionSupported = useMemo(() => Boolean(getRecognitionCtor()), []);

  useEffect(() => {
    if (!open && isListening) {
      recognitionRef.current?.stop();
    }
  }, [isListening, open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

  const toggleVoice = () => {
    if (disabled || !recognitionSupported) {
      if (!recognitionSupported) {
        setVoiceMessage("Voice recognition is not supported in this browser.");
      } else if (disabled) {
        setVoiceMessage("Voice capture is unavailable in read-only or timeline mode.");
      }
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceMessage("Voice capture stopped.");
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: RecognitionEventLike) => {
      let appended = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) {
          appended += `${result[0].transcript.trim()}\n`;
        } else {
          interim += `${result[0].transcript.trim()} `;
        }
      }
      setInterimTranscript(interim.trim());
      if (appended.trim()) {
        setText((previous) => `${previous}${previous ? "\n" : ""}${appended.trim()}`);
      }
    };

    recognition.onerror = (event: RecognitionErrorLike) => {
      setIsListening(false);
      const messageByCode: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Allow mic access in browser settings.",
        "service-not-allowed": "Speech service is not allowed in this browser/profile.",
        "audio-capture": "No microphone was detected.",
        "no-speech": "No speech detected. Try speaking closer to the microphone.",
        network: "Speech recognition failed due to a network error.",
        aborted: "Voice capture was aborted.",
        "language-not-supported": "Selected language is not supported by speech recognition.",
      };
      setVoiceMessage(messageByCode[event.error] ?? `Voice recognition error: ${event.error}`);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setVoiceMessage("Listening... speak and pause to append lines.");
      setInterimTranscript("");
    } catch {
      setIsListening(false);
      setVoiceMessage("Unable to start voice capture. Retry and confirm microphone permission.");
      setInterimTranscript("");
    }
  };

  const parsedCount = parseCaptureItems(text).length;

  return (
    <div className="fixed left-1/2 top-16 z-[70] w-[min(900px,95vw)] -translate-x-1/2 rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Quick Capture</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
        >
          Close
        </button>
      </div>

      <textarea
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
        className="h-24 w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submitCapture}
          disabled={disabled || parsedCount === 0}
          className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-45"
        >
          Capture {parsedCount > 0 ? `(${parsedCount})` : ""}
        </button>
        <button
          type="button"
          onClick={() => {
            void captureClipboard();
          }}
          disabled={disabled}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 disabled:opacity-45"
        >
          Paste to Notes
        </button>
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled || !recognitionSupported}
          title={!recognitionSupported ? "Browser does not support SpeechRecognition" : undefined}
          className={`rounded px-3 py-1.5 text-xs ${
            isListening ? "bg-red-500 text-white" : "border border-zinc-300 text-zinc-800"
          } disabled:opacity-45`}
        >
          {isListening ? "Stop Voice" : "Voice to Notes"}
        </button>
        <span className="ml-auto text-xs text-zinc-600">Ctrl/Cmd + Enter to capture</span>
      </div>
      {voiceMessage && <p className="mt-2 text-xs text-zinc-600">{voiceMessage}</p>}
      {isListening && interimTranscript && (
        <p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
          Live: {interimTranscript}
        </p>
      )}
    </div>
  );
};
