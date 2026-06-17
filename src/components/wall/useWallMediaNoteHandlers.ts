"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { downloadDataUrl } from "@/components/wall/wall-download";
import { updateNote } from "@/features/wall/commands";
import { createAudioNoteState, toAudioNotePatch } from "@/features/wall/audio-notes";
import { createFileNoteState, getFileNoteTitle, normalizeFileUrl, toFileNotePatch } from "@/features/wall/file-notes";
import { createImageNoteState, getImageNoteFilename, toImageNotePatch } from "@/features/wall/image-notes";
import {
  cacheVideoPoster,
  createVideoNoteState,
  getVideoNoteTitle,
  toVideoNotePatch,
} from "@/features/wall/video-notes";
import type { Note } from "@/features/wall/types";

const maxVideoPosterDimensionPx = 320;
const videoPosterJpegQuality = 0.58;

type UseWallMediaNoteHandlersOptions = {
  isTimeLocked: boolean;
  renderSnapshotNotes: Record<string, Note>;
  openBookmarkUrl: (url: string) => void;
  setInlinePlayingVideoNoteId: (value: string | undefined | ((previous: string | undefined) => string | undefined)) => void;
  inlinePlayingVideoNoteId?: string;
  wallInlineVideoRef: RefObject<HTMLVideoElement | null>;
};

export const useWallMediaNoteHandlers = ({
  isTimeLocked,
  renderSnapshotNotes,
  openBookmarkUrl,
  setInlinePlayingVideoNoteId,
  inlinePlayingVideoNoteId,
  wallInlineVideoRef,
}: UseWallMediaNoteHandlersOptions) => {
  const wallAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingAudioNoteIdRef = useRef<string | undefined>(undefined);
  const [playingAudioNoteId, setPlayingAudioNoteId] = useState<string | undefined>(undefined);
  const [playingAudioCurrentTimeSeconds, setPlayingAudioCurrentTimeSeconds] = useState(0);
  const [playingAudioDurationSeconds, setPlayingAudioDurationSeconds] = useState<number | undefined>(undefined);

  const readFileAsDataUrl = useCallback(
    (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
        reader.readAsDataURL(file);
      }),
    [],
  );

  const readAudioDurationFromDataUrl = useCallback(
    (dataUrl: string) =>
      new Promise<number | undefined>((resolve) => {
        if (typeof window === "undefined") {
          resolve(undefined);
          return;
        }
        const audio = document.createElement("audio");
        const settle = (value?: number) => {
          audio.removeAttribute("src");
          audio.load();
          resolve(typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined);
        };
        audio.preload = "metadata";
        audio.onloadedmetadata = () => settle(audio.duration);
        audio.onerror = () => settle(undefined);
        audio.src = dataUrl;
      }),
    [],
  );

  const readVideoMediaFromUrl = useCallback(
    (url: string) =>
      new Promise<{ durationSeconds?: number; posterDataUrl?: string }>((resolve) => {
        if (typeof window === "undefined") {
          resolve({});
          return;
        }

        const video = document.createElement("video");
        let settled = false;
        const settle = (value: { durationSeconds?: number; posterDataUrl?: string }) => {
          if (settled) {
            return;
          }
          settled = true;
          video.pause();
          video.removeAttribute("src");
          video.load();
          resolve(value);
        };

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        if (!url.startsWith("data:")) {
          video.crossOrigin = "anonymous";
        }

        video.onloadeddata = () => {
          const durationSeconds = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : undefined;
          try {
            const sourceWidth = Math.max(1, video.videoWidth || 960);
            const sourceHeight = Math.max(1, video.videoHeight || 540);
            const scale = Math.min(1, maxVideoPosterDimensionPx / Math.max(sourceWidth, sourceHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));
            const context = canvas.getContext("2d");
            if (!context) {
              settle({ durationSeconds });
              return;
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const posterDataUrl = canvas.toDataURL("image/jpeg", videoPosterJpegQuality);
            cacheVideoPoster(url, posterDataUrl);
            settle({ durationSeconds, posterDataUrl });
          } catch {
            settle({ durationSeconds });
          }
        };
        video.onerror = () => settle({});
        video.src = url;
      }),
    [],
  );

  const submitImageNoteUrl = useCallback(
    async (noteId: string, rawUrl: string) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = normalizeFileUrl(rawUrl);
      if (!normalizedUrl) {
        return;
      }
      updateNote(
        noteId,
        toImageNotePatch(
          createImageNoteState({ ...(renderSnapshotNotes[noteId]?.file ?? {}), source: "link", url: normalizedUrl }),
          {
            caption: renderSnapshotNotes[noteId]?.text ?? "",
            preserveSize: true,
          },
        ),
      );
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const submitFileNoteUrl = useCallback(
    (noteId: string, rawUrl: string) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = normalizeFileUrl(rawUrl);
      if (!normalizedUrl) {
        return;
      }
      updateNote(
        noteId,
        toFileNotePatch(createFileNoteState({ ...(renderSnapshotNotes[noteId]?.file ?? {}), source: "link", url: normalizedUrl })),
      );
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const submitAudioNoteUrl = useCallback(
    (noteId: string, rawUrl: string) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = normalizeFileUrl(rawUrl);
      if (!normalizedUrl) {
        return;
      }
      updateNote(
        noteId,
        toAudioNotePatch(createAudioNoteState({ ...(renderSnapshotNotes[noteId]?.audio ?? {}), source: "link", url: normalizedUrl })),
      );
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const submitVideoNoteUrl = useCallback(
    async (noteId: string, rawUrl: string) => {
      if (isTimeLocked) {
        return;
      }
      const normalizedUrl = normalizeFileUrl(rawUrl);
      if (!normalizedUrl) {
        return;
      }
      const media = await readVideoMediaFromUrl(normalizedUrl);
      updateNote(
        noteId,
        toVideoNotePatch(
          createVideoNoteState({
            ...(renderSnapshotNotes[noteId]?.video ?? {}),
            source: "link",
            url: normalizedUrl,
            durationSeconds: media.durationSeconds,
          }),
        ),
      );
    },
    [isTimeLocked, readVideoMediaFromUrl, renderSnapshotNotes],
  );

  const selectImageNoteFile = useCallback(
    async (noteId: string, file: File) => {
      if (isTimeLocked) {
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      updateNote(
        noteId,
        toImageNotePatch(
          createImageNoteState({
            source: "upload",
            name: file.name,
            url: dataUrl,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedAt: Date.now(),
          }),
          {
            caption: renderSnapshotNotes[noteId]?.text ?? "",
            preserveSize: true,
          },
        ),
      );
    },
    [isTimeLocked, readFileAsDataUrl, renderSnapshotNotes],
  );

  const selectFileNoteFile = useCallback(
    async (noteId: string, file: File) => {
      if (isTimeLocked) {
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      updateNote(
        noteId,
        toFileNotePatch(
          createFileNoteState({
            source: "upload",
            name: file.name,
            url: dataUrl,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedAt: Date.now(),
          }),
        ),
      );
    },
    [isTimeLocked, readFileAsDataUrl],
  );

  const selectAudioNoteFile = useCallback(
    async (noteId: string, file: File) => {
      if (isTimeLocked) {
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const durationSeconds = await readAudioDurationFromDataUrl(dataUrl);
      updateNote(
        noteId,
        toAudioNotePatch(
          createAudioNoteState({
            source: "upload",
            name: file.name,
            url: dataUrl,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedAt: Date.now(),
            durationSeconds,
          }),
        ),
      );
    },
    [isTimeLocked, readAudioDurationFromDataUrl, readFileAsDataUrl],
  );

  const selectVideoNoteFile = useCallback(
    async (noteId: string, file: File) => {
      if (isTimeLocked) {
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const media = await readVideoMediaFromUrl(dataUrl);
      updateNote(
        noteId,
        toVideoNotePatch(
          createVideoNoteState({
            source: "upload",
            name: file.name,
            url: dataUrl,
            mimeType: file.type,
            sizeBytes: file.size,
            uploadedAt: Date.now(),
            durationSeconds: media.durationSeconds,
          }),
        ),
      );
    },
    [isTimeLocked, readFileAsDataUrl, readVideoMediaFromUrl],
  );

  const renameImageNote = useCallback(
    (noteId: string, name: string) => {
      if (isTimeLocked) {
        return;
      }
      const current = renderSnapshotNotes[noteId];
      if (!current) {
        return;
      }
      updateNote(noteId, { file: createImageNoteState({ ...(current.file ?? {}), name }) });
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const renameAudioNote = useCallback(
    (noteId: string, name: string) => {
      if (isTimeLocked) {
        return;
      }
      const current = renderSnapshotNotes[noteId]?.audio;
      updateNote(noteId, toAudioNotePatch(createAudioNoteState({ ...(current ?? {}), name })));
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const renameVideoNote = useCallback(
    (noteId: string, name: string) => {
      if (isTimeLocked) {
        return;
      }
      const current = renderSnapshotNotes[noteId]?.video;
      updateNote(noteId, toVideoNotePatch(createVideoNoteState({ ...(current ?? {}), name })));
    },
    [isTimeLocked, renderSnapshotNotes],
  );

  const toggleAudioNotePlayback = useCallback(
    async (noteId: string) => {
      const audioNote = renderSnapshotNotes[noteId]?.audio;
      const target = audioNote?.url?.trim();
      if (!target || typeof window === "undefined") {
        return;
      }

      let player = wallAudioRef.current;
      if (!player) {
        const nextPlayer = new Audio();
        nextPlayer.preload = "metadata";
        nextPlayer.addEventListener("timeupdate", () => {
          setPlayingAudioCurrentTimeSeconds(nextPlayer.currentTime ?? 0);
        });
        nextPlayer.addEventListener("loadedmetadata", () => {
          setPlayingAudioDurationSeconds(Number.isFinite(nextPlayer.duration) ? nextPlayer.duration : undefined);
        });
        nextPlayer.addEventListener("ended", () => {
          setPlayingAudioNoteId(undefined);
          playingAudioNoteIdRef.current = undefined;
          setPlayingAudioCurrentTimeSeconds(0);
          setPlayingAudioDurationSeconds(undefined);
        });
        wallAudioRef.current = nextPlayer;
        player = nextPlayer;
      }

      if (playingAudioNoteIdRef.current === noteId && !player.paused) {
        player.pause();
        setPlayingAudioNoteId(undefined);
        playingAudioNoteIdRef.current = undefined;
        return;
      }

      if (player.src !== target) {
        player.src = target;
      }

      try {
        await player.play();
        setPlayingAudioNoteId(noteId);
        playingAudioNoteIdRef.current = noteId;
        setPlayingAudioCurrentTimeSeconds(player.currentTime || 0);
        setPlayingAudioDurationSeconds(Number.isFinite(player.duration) ? player.duration : audioNote?.durationSeconds);
      } catch {
        setPlayingAudioNoteId(undefined);
        playingAudioNoteIdRef.current = undefined;
      }
    },
    [renderSnapshotNotes],
  );

  useEffect(() => {
    const playingId = playingAudioNoteIdRef.current;
    if (!playingId) {
      return;
    }
    const currentAudio = renderSnapshotNotes[playingId]?.audio;
    if (!currentAudio?.url && wallAudioRef.current) {
      wallAudioRef.current.pause();
      wallAudioRef.current.removeAttribute("src");
      playingAudioNoteIdRef.current = undefined;
      queueMicrotask(() => {
        setPlayingAudioNoteId(undefined);
        setPlayingAudioCurrentTimeSeconds(0);
        setPlayingAudioDurationSeconds(undefined);
      });
    }
  }, [renderSnapshotNotes]);

  useEffect(
    () => () => {
      if (wallAudioRef.current) {
        wallAudioRef.current.pause();
        wallAudioRef.current.removeAttribute("src");
        wallAudioRef.current.load();
      }
    },
    [],
  );

  useEffect(() => {
    if (!inlinePlayingVideoNoteId) {
      return;
    }

    const current = renderSnapshotNotes[inlinePlayingVideoNoteId];
    if (current?.noteKind === "video" && current.video?.url?.trim()) {
      return;
    }

    setInlinePlayingVideoNoteId(undefined);
  }, [inlinePlayingVideoNoteId, renderSnapshotNotes, setInlinePlayingVideoNoteId]);

  useEffect(
    () => () => {
      if (wallInlineVideoRef.current) {
        wallInlineVideoRef.current.pause();
        wallInlineVideoRef.current.removeAttribute("src");
        wallInlineVideoRef.current.load();
      }
    },
    [wallInlineVideoRef],
  );

  const toggleInlineVideoPlayback = useCallback(
    (noteId: string) => {
      if (isTimeLocked) {
        return;
      }

      const target = renderSnapshotNotes[noteId]?.video?.url?.trim();
      if (!target) {
        return;
      }

      if (playingAudioNoteIdRef.current && wallAudioRef.current) {
        wallAudioRef.current.pause();
        setPlayingAudioNoteId(undefined);
        playingAudioNoteIdRef.current = undefined;
      }

      setInlinePlayingVideoNoteId((current) => (current === noteId ? undefined : noteId));
    },
    [isTimeLocked, renderSnapshotNotes, setInlinePlayingVideoNoteId],
  );

  const openImageNote = useCallback(
    (noteId: string) => {
      const imageNote = renderSnapshotNotes[noteId];
      const target = imageNote?.imageUrl?.trim();
      if (!target || typeof window === "undefined") {
        return;
      }
      if (imageNote?.file?.source === "link") {
        openBookmarkUrl(target);
        return;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    },
    [openBookmarkUrl, renderSnapshotNotes],
  );

  const openFileNote = useCallback(
    (noteId: string) => {
      const fileNote = renderSnapshotNotes[noteId]?.file;
      const target = fileNote?.url?.trim();
      if (!target || typeof window === "undefined") {
        return;
      }
      if (fileNote?.source === "link") {
        openBookmarkUrl(target);
        return;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    },
    [openBookmarkUrl, renderSnapshotNotes],
  );

  const openAudioNote = useCallback(
    (noteId: string) => {
      const audioNote = renderSnapshotNotes[noteId]?.audio;
      const target = audioNote?.url?.trim();
      if (!target || typeof window === "undefined") {
        return;
      }
      if (audioNote?.source === "link") {
        openBookmarkUrl(target);
        return;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    },
    [openBookmarkUrl, renderSnapshotNotes],
  );

  const openVideoNote = useCallback(
    (noteId: string) => {
      const videoNote = renderSnapshotNotes[noteId]?.video;
      const target = videoNote?.url?.trim();
      if (!target || typeof window === "undefined") {
        return;
      }
      if (videoNote?.source === "link") {
        openBookmarkUrl(target);
        return;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    },
    [openBookmarkUrl, renderSnapshotNotes],
  );

  const downloadImageNote = useCallback(
    (noteId: string) => {
      const imageNote = renderSnapshotNotes[noteId];
      const target = imageNote?.imageUrl?.trim();
      if (!target || typeof document === "undefined") {
        return;
      }
      const filename = getImageNoteFilename(imageNote?.file);
      if (imageNote?.file?.source === "upload") {
        downloadDataUrl(filename, target);
        return;
      }
      const link = document.createElement("a");
      link.href = target;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [renderSnapshotNotes],
  );

  const downloadFileNote = useCallback(
    (noteId: string) => {
      const fileNote = renderSnapshotNotes[noteId]?.file;
      const target = fileNote?.url?.trim();
      if (!target || typeof document === "undefined") {
        return;
      }
      const filename = getFileNoteTitle(fileNote);
      if (fileNote?.source === "upload") {
        downloadDataUrl(filename, target);
        return;
      }
      const link = document.createElement("a");
      link.href = target;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [renderSnapshotNotes],
  );

  const downloadAudioNote = useCallback(
    (noteId: string) => {
      const audioNote = renderSnapshotNotes[noteId]?.audio;
      const target = audioNote?.url?.trim();
      if (!target || typeof document === "undefined") {
        return;
      }
      const filename = audioNote?.name?.trim() || "audio-note";
      if (audioNote?.source === "upload") {
        downloadDataUrl(filename, target);
        return;
      }
      const link = document.createElement("a");
      link.href = target;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [renderSnapshotNotes],
  );

  const downloadVideoNote = useCallback(
    (noteId: string) => {
      const videoNote = renderSnapshotNotes[noteId]?.video;
      const target = videoNote?.url?.trim();
      if (!target || typeof document === "undefined") {
        return;
      }
      const filename = getVideoNoteTitle(videoNote);
      if (videoNote?.source === "upload") {
        downloadDataUrl(filename, target);
        return;
      }
      const link = document.createElement("a");
      link.href = target;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [renderSnapshotNotes],
  );

  return {
    playingAudioNoteId,
    playingAudioCurrentTimeSeconds,
    playingAudioDurationSeconds,
    submitImageNoteUrl,
    submitFileNoteUrl,
    submitAudioNoteUrl,
    submitVideoNoteUrl,
    selectImageNoteFile,
    selectFileNoteFile,
    selectAudioNoteFile,
    selectVideoNoteFile,
    renameImageNote,
    renameAudioNote,
    renameVideoNote,
    toggleAudioNotePlayback,
    toggleInlineVideoPlayback,
    openImageNote,
    openFileNote,
    openAudioNote,
    openVideoNote,
    downloadImageNote,
    downloadFileNote,
    downloadAudioNote,
    downloadVideoNote,
  };
};
