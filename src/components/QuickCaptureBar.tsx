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
  item?: (index: number) => { transcript: string } | null;
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
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onstart: (() => void) | null;
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

const getResultAt = (results: ArrayLike<RecognitionResult>, index: number): RecognitionResult | null => {
  const indexed = results[index];
  if (indexed) {
    return indexed;
  }
  const maybeItem = (results as ArrayLike<RecognitionResult> & { item?: (i: number) => RecognitionResult | null }).item;
  if (typeof maybeItem === "function") {
    return maybeItem(index);
  }
  return null;
};

const getTranscriptFromResult = (result: RecognitionResult | null): string => {
  if (!result) {
    return "";
  }
  const firstAlternative = result[0] ?? result.item?.(0) ?? null;
  return (firstAlternative?.transcript ?? "").trim();
};

export const QuickCaptureBar = ({ open, disabled, onClose, onCapture }: QuickCaptureBarProps) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceDebug, setVoiceDebug] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const interimTranscriptRef = useRef("");
  const keepListeningRef = useRef(false);
  const terminalErrorRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recognitionSupported = useMemo(() => Boolean(getRecognitionCtor()), []);
  const pushVoiceDebug = (entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setVoiceDebug((previous) => {
      const next = [...previous, `${timestamp} ${entry}`];
      if (next.length > 8) {
        next.splice(0, next.length - 8);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!open && isListening) {
      keepListeningRef.current = false;
      terminalErrorRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      recognitionRef.current?.stop();
    }
  }, [isListening, open]);

  useEffect(() => {
    if (!disabled || !isListening) {
      return;
    }
    keepListeningRef.current = false;
    terminalErrorRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    recognitionRef.current?.stop();
  }, [disabled, isListening]);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      terminalErrorRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
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
      keepListeningRef.current = false;
      terminalErrorRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      const pendingInterim = interimTranscriptRef.current.trim();
      if (pendingInterim) {
        setText((previous) => `${previous}${previous ? "\n" : ""}${pendingInterim}`);
        setInterimTranscript("");
        interimTranscriptRef.current = "";
      }
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
    keepListeningRef.current = true;
    terminalErrorRef.current = false;
    pushVoiceDebug("init recognizer");

    recognition.onstart = () => pushVoiceDebug("onstart");
    recognition.onaudiostart = () => pushVoiceDebug("onaudiostart");
    recognition.onaudioend = () => pushVoiceDebug("onaudioend");
    recognition.onspeechstart = () => pushVoiceDebug("onspeechstart");
    recognition.onspeechend = () => pushVoiceDebug("onspeechend");

    recognition.onresult = (event: RecognitionEventLike) => {
      if (recognitionRef.current !== recognition) {
        return;
      }
      let appended = "";
      let interim = "";
      let resultCount = 0;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = getResultAt(event.results, i);
        const transcript = getTranscriptFromResult(result);
        if (!transcript) {
          continue;
        }
        resultCount += 1;
        if (result?.isFinal) {
          appended += `${transcript}\n`;
        } else {
          interim += `${transcript} `;
        }
      }
      pushVoiceDebug(`onresult count=${resultCount} final=${Boolean(appended.trim())}`);
      const nextInterim = interim.trim();
      setInterimTranscript(nextInterim);
      interimTranscriptRef.current = nextInterim;
      if (appended.trim()) {
        setText((previous) => `${previous}${previous ? "\n" : ""}${appended.trim()}`);
      }
    };

    recognition.onerror = (event: RecognitionErrorLike) => {
      if (recognitionRef.current !== recognition) {
        return;
      }
      pushVoiceDebug(`onerror ${event.error}`);
      const messageByCode: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Allow mic access in browser settings.",
        "service-not-allowed": "Speech service is not allowed in this browser/profile.",
        "audio-capture": "No microphone was detected.",
        "no-speech": "No speech detected. Still listening; try speaking again.",
        network: "Speech recognition failed due to a network error.",
        aborted: "Voice capture was aborted.",
        "language-not-supported": "Selected language is not supported by speech recognition.",
      };
      const terminalErrors = new Set([
        "not-allowed",
        "service-not-allowed",
        "audio-capture",
        "language-not-supported",
      ]);
      if (terminalErrors.has(event.error)) {
        keepListeningRef.current = false;
        terminalErrorRef.current = true;
      }
      if (!keepListeningRef.current) {
        setIsListening(false);
      }
      pushVoiceDebug(
        `error-state keep=${keepListeningRef.current} terminal=${terminalErrorRef.current} listening=${isListening}`
      );
      setVoiceMessage(messageByCode[event.error] ?? `Voice recognition error: ${event.error}`);
      setInterimTranscript("");
      interimTranscriptRef.current = "";
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) {
        return;
      }
      pushVoiceDebug("onend");
      const pendingInterim = interimTranscriptRef.current.trim();
      if (pendingInterim) {
        setText((previous) => `${previous}${previous ? "\n" : ""}${pendingInterim}`);
      }
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      pushVoiceDebug(
        `end-state keep=${keepListeningRef.current} terminal=${terminalErrorRef.current} open=${open} disabled=${Boolean(disabled)}`
      );
      if (keepListeningRef.current && !terminalErrorRef.current) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        pushVoiceDebug("schedule restart");
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current !== recognition || !keepListeningRef.current || terminalErrorRef.current) {
            return;
          }
          try {
            recognition.start();
            setIsListening(true);
            setVoiceMessage("Listening... speak and pause to append lines.");
            pushVoiceDebug("restart() called");
          } catch {
            keepListeningRef.current = false;
            setIsListening(false);
            setVoiceMessage("Unable to restart voice capture. Retry and confirm microphone permission.");
            pushVoiceDebug("restart() threw");
          }
        }, 250);
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setVoiceMessage("Listening... speak and pause to append lines.");
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      pushVoiceDebug("start() called");
    } catch {
      setIsListening(false);
      setVoiceMessage("Unable to start voice capture. Retry and confirm microphone permission.");
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      pushVoiceDebug("start() threw");
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
      {voiceDebug.length > 0 && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-600">
          <p className="font-semibold text-zinc-700">Voice Debug</p>
          {voiceDebug.map((line, index) => (
            <p key={`${line}-${index}`} className="truncate">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
