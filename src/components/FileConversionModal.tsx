"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { Button } from "@/components/ui/Button";
import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, removeStorageKeys, writeStorageValue } from "@/lib/local-storage";

type ConversionMode = "pdf_to_word" | "word_to_pdf";
type RunPreference = "auto" | "single" | "batch";
type FileStatus = "success" | "failed" | "skipped" | "canceled";

type ConversionHistoryItem = {
  id: string;
  createdAt: number;
  fileName: string;
  inputSizeBytes: number;
  mode: ConversionMode;
  status: FileStatus;
};

type ConversionResult = {
  fileName: string;
  blob: Blob;
};

type FileConversionModalProps = {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  preferredMode?: ConversionMode | null;
};

const modeStorageKey = `${appSlug}-file-conversion-last-mode`;
const historyStorageKey = `${appSlug}-file-conversion-history-v1`;
const legacyModeStorageKey = `${legacyAppSlug}-file-conversion-last-mode`;
const legacyHistoryStorageKey = `${legacyAppSlug}-file-conversion-history-v1`;
const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
const maxFileSizeBytes = 100 * 1024 * 1024;
const maxBatchFiles = 20;

const extensionForMode = (mode: ConversionMode) => (mode === "pdf_to_word" ? "docx" : "pdf");
const acceptedByMode = (mode: ConversionMode) =>
  mode === "pdf_to_word"
    ? ".pdf,application/pdf"
    : ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const likelyEncryptedPdf = async (file: File) => {
  try {
    const sample = await file.slice(0, Math.min(file.size, 1024 * 1024)).text();
    return sample.includes("/Encrypt");
  } catch {
    return false;
  }
};

const toBase64 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const validateInputByMode = (file: File, mode: ConversionMode) => {
  const lower = file.name.toLowerCase();
  if (file.size > maxFileSizeBytes) {
    return `File exceeds 100MB limit: ${file.name}`;
  }
  if (mode === "pdf_to_word" && !lower.endsWith(".pdf")) {
    return `Only .pdf is allowed in PDF to Word mode: ${file.name}`;
  }
  if (mode === "word_to_pdf" && !lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    return `Only .doc or .docx is allowed in Word to PDF mode: ${file.name}`;
  }
  return null;
};

const makeOutputName = (sourceName: string, mode: ConversionMode) => {
  const lower = sourceName.toLowerCase();
  if (mode === "pdf_to_word" && lower.endsWith(".pdf")) {
    return `${sourceName.slice(0, -4)}.docx`;
  }
  if (mode === "word_to_pdf" && lower.endsWith(".docx")) {
    return `${sourceName.slice(0, -5)}.pdf`;
  }
  if (mode === "word_to_pdf" && lower.endsWith(".doc")) {
    return `${sourceName.slice(0, -4)}.pdf`;
  }
  return `${sourceName}.${extensionForMode(mode)}`;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileConversionModal = ({ open, onClose, onOpen, preferredMode }: FileConversionModalProps) => {
  const [mode, setMode] = useState<ConversionMode>("pdf_to_word");
  const [runPreference, setRunPreference] = useState<RunPreference>("auto");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null);
  const [lastOutputFolderPath, setLastOutputFolderPath] = useState<string | null>(null);
  const [showMiniProgress, setShowMiniProgress] = useState(false);
  const [notifyWhenDone, setNotifyWhenDone] = useState(false);
  const [miniPosition, setMiniPosition] = useState({ x: 24, y: 140 });
  const miniDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);

  useEffect(() => {
    if (preferredMode) {
      setMode(preferredMode);
    }
  }, [preferredMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedMode = readStorageValue(modeStorageKey, [legacyModeStorageKey]);
    if (storedMode === "pdf_to_word" || storedMode === "word_to_pdf") {
      setMode(storedMode);
    }
    try {
      const raw = readStorageValue(historyStorageKey, [legacyHistoryStorageKey]);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ConversionHistoryItem[];
      const now = Date.now();
      const pruned = parsed
        .filter((item) => now - item.createdAt <= sevenDaysMs)
        .sort((left, right) => right.createdAt - left.createdAt)
        .slice(0, 400);
      setHistory(pruned);
      writeStorageValue(historyStorageKey, JSON.stringify(pruned));
    } catch {
      // Ignore malformed local history payloads.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    writeStorageValue(modeStorageKey, mode);
  }, [mode]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const batchEnabled = useMemo(() => {
    if (runPreference === "batch") {
      return true;
    }
    if (runPreference === "single") {
      return false;
    }
    return files.length > 1;
  }, [files.length, runPreference]);

  const overallProgressPercent = files.length === 0 ? 0 : Math.round((completedCount / files.length) * 100);
  const currentProgressLabel = files[currentIndex]?.name ?? "Waiting";
  const hasDesktopApi = typeof window !== "undefined" && Boolean(window.desktopApi);

  const addHistory = useCallback((entry: Omit<ConversionHistoryItem, "id">) => {
    setHistory((previous) => {
      const now = Date.now();
      const next = [{ ...entry, id: `conv-${now}-${Math.random().toString(36).slice(2, 8)}` }, ...previous]
        .filter((item) => now - item.createdAt <= sevenDaysMs)
        .slice(0, 400);
      if (typeof window !== "undefined") {
        writeStorageValue(historyStorageKey, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const assignFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      if (incoming.length === 0) {
        return;
      }
      const limited = incoming.slice(0, maxBatchFiles);
      if (incoming.length > maxBatchFiles) {
        setError(`Only ${maxBatchFiles} files are allowed per batch.`);
      }
      const issues = limited
        .map((file) => validateInputByMode(file, mode))
        .filter((message): message is string => Boolean(message));
      if (issues.length > 0) {
        setError(issues[0] ?? "Unsupported file selection.");
      }
      const valid = limited.filter((file) => !validateInputByMode(file, mode));
      setFiles(valid);
    },
    [mode],
  );

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    assignFiles(nextFiles);
    event.target.value = "";
  };

  const callConvertApi = async (file: File, selectedMode: ConversionMode, password?: string): Promise<ConversionResult> => {
    const formData = new FormData();
    formData.set("mode", selectedMode);
    formData.set("file", file);
    if (password) {
      formData.set("password", password);
    }
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
      signal: abortRef.current?.signal,
    });
    if (!response.ok) {
      let detail = "Conversion failed.";
      try {
        const payload = (await response.json()) as { error?: string; detail?: string };
        detail = payload.error ?? payload.detail ?? detail;
      } catch {
        // Ignore non-JSON failures.
      }
      throw new Error(detail);
    }
    const blob = await response.blob();
    const headerName = response.headers.get("x-converted-filename");
    const fileName = headerName && headerName.trim() ? headerName : makeOutputName(file.name, selectedMode);
    return { fileName, blob };
  };

  const saveSingleResult = async (result: ConversionResult, targetPath?: string | null) => {
    if (window.desktopApi) {
      let filePath = targetPath ?? null;
      if (!filePath) {
        const pick = await window.desktopApi.pickSavePath({
          defaultPath: result.fileName,
          filters: [{ name: "Converted files", extensions: [extensionForMode(mode)] }],
        });
        if (pick.canceled || !pick.filePath) {
          return false;
        }
        filePath = pick.filePath;
      }
      const base64 = await toBase64(result.blob);
      const save = await window.desktopApi.saveFile({ filePath, base64 });
      if (!save.ok || !save.filePath) {
        throw new Error(save.error ?? "Failed to save converted file.");
      }
      setLastOutputPath(save.filePath);
      setLastOutputFolderPath(save.filePath.slice(0, Math.max(save.filePath.lastIndexOf("/"), save.filePath.lastIndexOf("\\"))));
      return true;
    }

    const savePicker = (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
    if (typeof savePicker === "function") {
      const picker = savePicker as (options: {
        suggestedName: string;
        types: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<{ createWritable: () => Promise<{ write: (value: Blob) => Promise<void>; close: () => Promise<void> }> }>;
      const handle = await picker({
        suggestedName: result.fileName,
        types: [{ description: "Converted file", accept: { "application/octet-stream": [`.${extensionForMode(mode)}`] } }],
      });
      const writer = await handle.createWritable();
      await writer.write(result.blob);
      await writer.close();
      return true;
    }

    triggerBrowserDownload(result.blob, result.fileName);
    return true;
  };

  const saveBatchResult = async (result: ConversionResult, folderPath: string | null) => {
    if (window.desktopApi && folderPath) {
      const base64 = await toBase64(result.blob);
      const write = await window.desktopApi.writeInFolder({
        folderPath,
        fileName: result.fileName,
        base64,
      });
      if (write.status === "written") {
        setLastOutputPath(write.filePath);
        setLastOutputFolderPath(folderPath);
        return "saved" as const;
      }
      if (write.status === "skipped") {
        return "skipped" as const;
      }
      if (write.status === "canceled") {
        return "canceled" as const;
      }
      throw new Error(write.error ?? "Failed to save converted file.");
    }

    const directoryPicker = (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker;
    if (!folderPath && typeof directoryPicker === "function") {
      // Directory picker flow is selected before loop; this path should not be reached.
      return "canceled" as const;
    }

    triggerBrowserDownload(result.blob, result.fileName);
    return "saved" as const;
  };

  const requestClose = () => {
    if (!isConverting) {
      onClose();
      return;
    }
    const wantsMini = window.confirm(
      "Conversion is still running. Click OK to show a tiny draggable progress bar, or Cancel to hide it and only notify when done.",
    );
    setShowMiniProgress(wantsMini);
    setNotifyWhenDone(!wantsMini);
    onClose();
  };

  const cancelConversion = () => {
    cancelRequestedRef.current = true;
    abortRef.current?.abort();
    setIsConverting(false);
    setShowMiniProgress(false);
    setNotifyWhenDone(false);
  };

  const runConversion = async () => {
    if (files.length === 0) {
      setError("Add at least one file.");
      return;
    }
    setError(null);
    setToastMessage(null);
    setCompletedCount(0);
    setCurrentIndex(0);
    setLastOutputPath(null);
    setLastOutputFolderPath(null);
    setIsConverting(true);
    cancelRequestedRef.current = false;
    abortRef.current = new AbortController();
    let processed = 0;
    let failures = 0;

    let electronBatchFolder: string | null = null;
    const electronSinglePathByFile = new Map<string, string>();
    if (batchEnabled && window.desktopApi) {
      const folderPick = await window.desktopApi.pickFolder();
      if (folderPick.canceled || !folderPick.folderPath) {
        setIsConverting(false);
        return;
      }
      electronBatchFolder = folderPick.folderPath;
      setLastOutputFolderPath(folderPick.folderPath);
    } else if (!batchEnabled && window.desktopApi) {
      const only = files[0];
      if (!only) {
        setIsConverting(false);
        return;
      }
      const pick = await window.desktopApi.pickSavePath({
        defaultPath: makeOutputName(only.name, mode),
        filters: [{ name: "Converted files", extensions: [extensionForMode(mode)] }],
      });
      if (pick.canceled || !pick.filePath) {
        setIsConverting(false);
        return;
      }
      electronSinglePathByFile.set(only.name, pick.filePath);
    }

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (!file) {
        continue;
      }
      if (cancelRequestedRef.current) {
        addHistory({
          createdAt: Date.now(),
          fileName: file.name,
          inputSizeBytes: file.size,
          mode,
          status: "canceled",
        });
        break;
      }

      setCurrentIndex(index);
      try {
        const validationMessage = validateInputByMode(file, mode);
        if (validationMessage) {
          throw new Error(validationMessage);
        }

        let password: string | undefined;
        if (mode === "pdf_to_word" && (await likelyEncryptedPdf(file))) {
          const typed = window.prompt(`"${file.name}" appears password-protected. Enter password (leave empty to skip/cancel):`, "") ?? "";
          if (!typed.trim()) {
            const skip = window.confirm("Skip this file and continue?");
            if (skip) {
              addHistory({
                createdAt: Date.now(),
                fileName: file.name,
                inputSizeBytes: file.size,
                mode,
                status: "skipped",
              });
              setCompletedCount((count) => count + 1);
              continue;
            }
            cancelRequestedRef.current = true;
            break;
          }
          password = typed;
        }

        const converted = await callConvertApi(file, mode, password);
        if (!batchEnabled) {
          const singlePath = electronSinglePathByFile.get(file.name) ?? null;
          const saved = await saveSingleResult(converted, singlePath);
          if (!saved) {
            addHistory({
              createdAt: Date.now(),
              fileName: file.name,
              inputSizeBytes: file.size,
              mode,
              status: "skipped",
            });
          } else {
            addHistory({
              createdAt: Date.now(),
              fileName: file.name,
              inputSizeBytes: file.size,
              mode,
              status: "success",
            });
          }
        } else {
          const status = await saveBatchResult(converted, electronBatchFolder);
          if (status === "saved") {
            addHistory({
              createdAt: Date.now(),
              fileName: file.name,
              inputSizeBytes: file.size,
              mode,
              status: "success",
            });
          } else if (status === "skipped") {
            addHistory({
              createdAt: Date.now(),
              fileName: file.name,
              inputSizeBytes: file.size,
              mode,
              status: "skipped",
            });
          } else {
            addHistory({
              createdAt: Date.now(),
              fileName: file.name,
              inputSizeBytes: file.size,
              mode,
              status: "canceled",
            });
            cancelRequestedRef.current = true;
            break;
          }
        }
      } catch (conversionError) {
        const message = conversionError instanceof Error ? conversionError.message : "Conversion failed.";
        failures += 1;
        addHistory({
          createdAt: Date.now(),
          fileName: file.name,
          inputSizeBytes: file.size,
          mode,
          status: "failed",
        });
        const skip = window.confirm(`${message}\n\nSkip this file and continue? Click Cancel to stop the batch.`);
        if (!skip) {
          cancelRequestedRef.current = true;
          break;
        }
      } finally {
        setCompletedCount((count) => count + 1);
        processed += 1;
      }
    }

    setIsConverting(false);
    abortRef.current = null;
    if (notifyWhenDone) {
      const summary = `Conversion finished. Completed: ${processed}/${files.length}. Failed: ${failures}.`;
      setToastMessage(summary);
    }
    setNotifyWhenDone(false);
  };

  const modeTitle = mode === "pdf_to_word" ? "PDF to Word" : "Word to PDF";

  return (
    <>
      {open && (
        <ModalShell
          open={open}
          onClose={requestClose}
          title={`File Conversion: ${modeTitle}`}
          description="Upload documents and convert with progress tracking."
          maxWidthClassName="max-w-3xl"
          closeLabel={isConverting ? "Close (keep running)" : "Close"}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={mode === "pdf_to_word" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setMode("pdf_to_word");
                  setFiles([]);
                }}
                disabled={isConverting}
              >
                PDF to Word
              </Button>
              <Button
                variant={mode === "word_to_pdf" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setMode("word_to_pdf");
                  setFiles([]);
                }}
                disabled={isConverting}
              >
                Word to PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode((previous) => (previous === "pdf_to_word" ? "word_to_pdf" : "pdf_to_word"));
                  setFiles([]);
                }}
                disabled={isConverting}
              >
                Swap mode
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Run mode:</span>
              <label className="inline-flex items-center gap-1">
                <input type="radio" checked={runPreference === "auto"} onChange={() => setRunPreference("auto")} disabled={isConverting} />
                Auto
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="radio" checked={runPreference === "single"} onChange={() => setRunPreference("single")} disabled={isConverting} />
                Single
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="radio" checked={runPreference === "batch"} onChange={() => setRunPreference("batch")} disabled={isConverting} />
                Batch
              </label>
              <span className="ml-2">100MB max per file, {maxBatchFiles} max files per batch.</span>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingOver(false);
                assignFiles(Array.from(event.dataTransfer.files ?? []));
              }}
              className={`rounded-[var(--radius-lg)] border border-dashed p-4 text-sm ${isDraggingOver ? "border-[var(--color-focus)] bg-[var(--color-surface-muted)]" : "border-[var(--color-border)]"}`}
            >
              <p className="font-medium text-[var(--color-text)]">Drag and drop files here</p>
              <p className="mt-1 text-[var(--color-text-muted)]">or use the file picker.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
                Choose files
                <input type="file" multiple onChange={onPickFiles} accept={acceptedByMode(mode)} className="hidden" disabled={isConverting} />
              </label>
            </div>

            {error && <p className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/35 bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger-strong)]">{error}</p>}

            <div className="space-y-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-text)]">Queue ({files.length})</span>
                <span className="text-[var(--color-text-muted)]">{batchEnabled ? "Batch mode" : "Single mode"}</span>
              </div>
              <div className="max-h-36 overflow-y-auto pt-1">
                {files.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No files selected.</p>}
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/60 py-1 text-xs last:border-b-0">
                    <span className="truncate text-[var(--color-text)]">{file.name}</span>
                    <span className="shrink-0 text-[var(--color-text-muted)]">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-text)]">Progress</span>
                <span className="text-[var(--color-text-muted)]">
                  {completedCount}/{Math.max(1, files.length)} ({overallProgressPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-2 rounded-full bg-[var(--color-accent-strong)] transition-all" style={{ width: `${overallProgressPercent}%` }} />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Current: {isConverting ? currentProgressLabel : "Idle"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => void runConversion()} disabled={isConverting || files.length === 0}>
                Convert
              </Button>
              {isConverting && (
                <Button variant="danger" onClick={cancelConversion}>
                  Cancel conversion
                </Button>
              )}
              {!isConverting && lastOutputFolderPath && hasDesktopApi && (
                <Button variant="secondary" onClick={() => { void window.desktopApi?.openPath({ path: lastOutputFolderPath }); }}>
                  Open output folder
                </Button>
              )}
              {!isConverting && lastOutputPath && hasDesktopApi && (
                <Button variant="secondary" onClick={() => { void window.desktopApi?.openPath({ path: lastOutputPath }); }}>
                  Open converted file
                </Button>
              )}
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--color-text)]">History (last 7 days)</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setHistory([]);
                    removeStorageKeys([historyStorageKey, legacyHistoryStorageKey]);
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {history.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No recent conversion history.</p>}
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/60 py-1 text-xs last:border-b-0">
                    <span className="truncate text-[var(--color-text)]">
                      {item.fileName} - {item.mode === "pdf_to_word" ? "PDF->Word" : "Word->PDF"}
                    </span>
                    <span className="shrink-0 text-[var(--color-text-muted)]">
                      {item.status} - {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {showMiniProgress && isConverting && !open && (
        <div
          className="pointer-events-auto fixed z-[120] w-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 shadow-[var(--shadow-lg)]"
          style={{ left: miniPosition.x, top: miniPosition.y }}
          onPointerDown={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }
            const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
            miniDragRef.current = {
              offsetX: event.clientX - rect.left,
              offsetY: event.clientY - rect.top,
            };
            (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!miniDragRef.current) {
              return;
            }
            setMiniPosition({
              x: Math.max(8, event.clientX - miniDragRef.current.offsetX),
              y: Math.max(8, event.clientY - miniDragRef.current.offsetY),
            });
          }}
          onPointerUp={(event) => {
            miniDragRef.current = null;
            (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--color-text)]">Converting files...</p>
            <button
              type="button"
              className="text-xs text-[var(--color-accent-strong)] underline"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                onOpen();
              }}
            >
              Open
            </button>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-surface-muted)]">
            <div className="h-2 rounded-full bg-[var(--color-accent-strong)] transition-all" style={{ width: `${overallProgressPercent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            {completedCount}/{Math.max(1, files.length)} complete
          </p>
        </div>
      )}

      {toastMessage && (
        <div className="pointer-events-auto fixed bottom-4 right-4 z-[120] w-[min(24rem,90vw)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-xs text-[var(--color-text)] shadow-[var(--shadow-lg)]">
          <div className="flex items-start justify-between gap-2">
            <span>{toastMessage}</span>
            <button type="button" className="text-[var(--color-text-muted)]" onClick={() => setToastMessage(null)}>
              x
            </button>
          </div>
        </div>
      )}
    </>
  );
};







