"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type VoicePhase = "idle" | "starting" | "listening" | "restarting" | "blocked";

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
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle");
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceDebug, setVoiceDebug] = useState<string[]>([]);
  const voiceButtonRef = useRef<HTMLButtonElement | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const interimTranscriptRef = useRef("");
  const openRef = useRef(open);
  const disabledRef = useRef(Boolean(disabled));
  const activeSessionIdRef = useRef<number | null>(null);
  const nextSessionIdRef = useRef(1);
  const recognitionRunningRef = useRef(false);
  const terminalErrorRef = useRef(false);
  const restartAttemptRef = useRef(0);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStartAtRef = useRef<number | null>(null);

  const recognitionSupported = useMemo(() => Boolean(getRecognitionCtor()), []);
  const terminalErrors = useMemo(
    () => new Set(["not-allowed", "service-not-allowed", "audio-capture", "language-not-supported"]),
    []
  );
  const voiceActive = voicePhase === "starting" || voicePhase === "listening" || voicePhase === "restarting";

  const pushVoiceDebug = useCallback((entry: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setVoiceDebug((previous) => {
      const next = [...previous, `${timestamp} ${entry}`];
      if (next.length > 12) {
        next.splice(0, next.length - 12);
      }
      return next;
    });
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const flushInterim = () => {
    const pending = interimTranscriptRef.current.trim();
    if (!pending) {
      return;
    }
    setText((previous) => `${previous}${previous ? "\n" : ""}${pending}`);
    setInterimTranscript("");
    interimTranscriptRef.current = "";
  };

  const startRecognition = useCallback((sessionId: number, reason: "start" | "restart" | "resume") => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }
    if (
      activeSessionIdRef.current !== sessionId ||
      terminalErrorRef.current ||
      !openRef.current ||
      disabledRef.current
    ) {
      return;
    }

    try {
      recognition.start();
      setVoicePhase(reason === "start" ? "starting" : "restarting");
      setVoiceMessage("Listening... speak and pause to append lines.");
      pushVoiceDebug(`${reason}() called`);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("already started")) {
        setVoicePhase("listening");
        pushVoiceDebug(`${reason}() ignored already-started`);
        return;
      }

      activeSessionIdRef.current = null;
      terminalErrorRef.current = true;
      setVoicePhase("blocked");
      setVoiceMessage("Unable to start voice capture. Retry and confirm microphone permission.");
      pushVoiceDebug(`${reason}() threw`);
    }
  }, [pushVoiceDebug]);
  const createRecognition = (sessionId: number): SpeechRecognitionLike | null => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      return null;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }
      recognitionRunningRef.current = true;
      restartAttemptRef.current = 0;
      setVoicePhase("listening");
      pushVoiceDebug("onstart");
    };

    recognition.onaudiostart = () => {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }
      pushVoiceDebug("onaudiostart");
    };

    recognition.onaudioend = () => {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }
      pushVoiceDebug("onaudioend");
    };

    recognition.onspeechstart = () => {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }
      pushVoiceDebug("onspeechstart");
    };

    recognition.onspeechend = () => {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }
      pushVoiceDebug("onspeechend");
    };

    recognition.onresult = (event: RecognitionEventLike) => {
      if (activeSessionIdRef.current !== sessionId) {
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
      if (activeSessionIdRef.current !== sessionId) {
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

      if (terminalErrors.has(event.error)) {
        activeSessionIdRef.current = null;
        terminalErrorRef.current = true;
        clearRestartTimer();
        setVoicePhase("blocked");
      }

      setVoiceMessage(messageByCode[event.error] ?? `Voice recognition error: ${event.error}`);
      setInterimTranscript("");
      interimTranscriptRef.current = "";
      pushVoiceDebug(
        `error-state session=${activeSessionIdRef.current ?? "none"} terminal=${terminalErrorRef.current}`
      );
    };

    recognition.onend = () => {
      const sessionStillActive = activeSessionIdRef.current === sessionId;
      const staleSession = activeSessionIdRef.current !== null && !sessionStillActive;
      if (staleSession) {
        return;
      }

      recognitionRunningRef.current = false;
      pushVoiceDebug("onend");
      flushInterim();

      const shouldRestart = sessionStillActive && !terminalErrorRef.current && openRef.current && !disabledRef.current;
      pushVoiceDebug(
        `end-state restart=${shouldRestart} session=${activeSessionIdRef.current ?? "none"} terminal=${terminalErrorRef.current}`
      );

      if (!shouldRestart) {
        setVoicePhase("idle");
        return;
      }

      clearRestartTimer();
      restartAttemptRef.current += 1;
      const delayMs = Math.min(1200, 250 + restartAttemptRef.current * 150);
      setVoicePhase("restarting");
      pushVoiceDebug(`schedule restart ${delayMs}ms`);
      restartTimeoutRef.current = setTimeout(() => {
        startRecognition(sessionId, "restart");
      }, delayMs);
    };

    return recognition;
  };

  useEffect(() => {
    openRef.current = open;
    disabledRef.current = Boolean(disabled);

    if (!open && activeSessionIdRef.current !== null) {
      activeSessionIdRef.current = null;
      terminalErrorRef.current = false;
      clearRestartTimer();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      return;
    }

    if (disabled && activeSessionIdRef.current !== null && recognitionRunningRef.current) {
      clearRestartTimer();
      recognitionRef.current?.stop();
      return;
    }

    if (!disabled && open && activeSessionIdRef.current !== null && !recognitionRunningRef.current && !terminalErrorRef.current) {
      const sessionId = activeSessionIdRef.current;
      const resumeTimer = setTimeout(() => {
        if (sessionId !== null) {
          startRecognition(sessionId, "resume");
        }
      }, 200);
      return () => clearTimeout(resumeTimer);
    }

    return;
  }, [clearRestartTimer, disabled, open, startRecognition]);

  useEffect(() => {
    return () => {
      activeSessionIdRef.current = null;
      terminalErrorRef.current = false;
      clearRestartTimer();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [clearRestartTimer]);

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

  const stopVoice = (reason: "manual") => {
    const activeSession = activeSessionIdRef.current;
    activeSessionIdRef.current = null;
    terminalErrorRef.current = false;
    clearRestartTimer();
    flushInterim();
    recognitionRef.current?.stop();
    recognitionRunningRef.current = false;
    recognitionRef.current = null;
    voiceStartAtRef.current = null;
    pushVoiceDebug(`${reason} stop session=${activeSession ?? "none"}`);
    setVoicePhase("idle");
    setVoiceMessage("Voice capture stopped.");
  };

  const startVoice = () => {
    if (disabled || !recognitionSupported) {
      if (!recognitionSupported) {
        setVoiceMessage("Voice recognition is not supported in this browser.");
      } else if (disabled) {
        setVoiceMessage("Voice capture is unavailable in read-only or timeline mode.");
      }
      return;
    }

    if (voiceActive || activeSessionIdRef.current !== null) {
      return;
    }

    const sessionId = nextSessionIdRef.current;
    nextSessionIdRef.current += 1;

    const recognition = createRecognition(sessionId);
    if (!recognition) {
      setVoiceMessage("Voice recognition is not supported in this browser.");
      return;
    }

    activeSessionIdRef.current = sessionId;
    terminalErrorRef.current = false;
    recognitionRunningRef.current = false;
    restartAttemptRef.current = 0;
    clearRestartTimer();

    recognitionRef.current = recognition;
    setInterimTranscript("");
    interimTranscriptRef.current = "";
    pushVoiceDebug(`init recognizer session=${sessionId}`);
    voiceButtonRef.current?.blur();
    voiceStartAtRef.current = Date.now();
    startRecognition(sessionId, "start");
  };

  const onVoiceButtonClick = () => {
    if (voiceActive || activeSessionIdRef.current !== null) {
      const startedAt = voiceStartAtRef.current;
      const elapsed = startedAt ? Date.now() - startedAt : Number.POSITIVE_INFINITY;
      // Guards against accidental double-activation/ghost click right after start.
      if (elapsed < 1200) {
        pushVoiceDebug(`ignored early stop elapsed=${elapsed}ms`);
        return;
      }
      stopVoice("manual");
      return;
    }
    startVoice();
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
          ref={voiceButtonRef}
          type="button"
          onClick={onVoiceButtonClick}
          disabled={disabled || !recognitionSupported}
          title={!recognitionSupported ? "Browser does not support SpeechRecognition" : undefined}
          className={`rounded px-3 py-1.5 text-xs ${
            voiceActive ? "bg-red-500 text-white" : "border border-zinc-300 text-zinc-800"
          } disabled:opacity-45`}
        >
          {voiceActive ? "Stop Voice" : "Voice to Notes"}
        </button>
        <span className="ml-auto text-xs text-zinc-600">Ctrl/Cmd + Enter to capture</span>
      </div>

      {voiceMessage && <p className="mt-2 text-xs text-zinc-600">{voiceMessage}</p>}
      {voiceActive && interimTranscript && (
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
