import { getAudioNoteTitle } from "@/features/wall/audio-notes";
import { getVideoNoteMeta, getVideoNoteTitle } from "@/features/wall/video-notes";
import type { AudioNote, Note, VideoNote } from "@/features/wall/types";

export type MediaLibraryItem = {
  id: string;
  kind: "audio" | "video";
  title: string;
  subtitle: string;
  durationSeconds?: number;
  createdAt: number;
  updatedAt: number;
  source: "upload" | "link";
  url: string;
  mimeType?: string;
  posterUrl?: string;
  tags: string[];
  noteText: string;
  audio?: AudioNote;
  video?: VideoNote;
};

const trimText = (value?: string) => value?.trim() ?? "";

const deriveAudioSubtitle = (note: Note, audio: AudioNote) => {
  const tags = note.tags.filter((tag) => tag !== "audio").slice(0, 2);
  if (tags.length > 0) {
    return tags.join(" • ");
  }
  if (audio.source === "link") {
    return "Linked audio";
  }
  return "Audio recording";
};

const deriveVideoSubtitle = (note: Note, video: VideoNote) => {
  const meta = getVideoNoteMeta(video);
  if (meta) {
    return meta;
  }
  const tags = note.tags.filter((tag) => tag !== "video").slice(0, 2);
  if (tags.length > 0) {
    return tags.join(" • ");
  }
  if (video.source === "link") {
    return "Linked video";
  }
  return "Video fragment";
};

export const mediaLibraryItemFromNote = (note: Note): MediaLibraryItem | undefined => {
  if (note.noteKind === "audio" && note.audio?.url) {
    return {
      id: note.id,
      kind: "audio",
      title: getAudioNoteTitle(note.audio),
      subtitle: deriveAudioSubtitle(note, note.audio),
      durationSeconds: note.audio.durationSeconds,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      source: note.audio.source,
      url: note.audio.url,
      mimeType: trimText(note.audio.mimeType) || undefined,
      tags: note.tags,
      noteText: trimText(note.text),
      audio: note.audio,
    };
  }

  if (note.noteKind === "video" && note.video?.url) {
    return {
      id: note.id,
      kind: "video",
      title: getVideoNoteTitle(note.video),
      subtitle: deriveVideoSubtitle(note, note.video),
      durationSeconds: note.video.durationSeconds,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      source: note.video.source,
      url: note.video.url,
      mimeType: trimText(note.video.mimeType) || undefined,
      posterUrl: trimText(note.video.posterDataUrl) || undefined,
      tags: note.tags,
      noteText: trimText(note.text),
      video: note.video,
    };
  }

  return undefined;
};

export const deriveMediaLibrary = (notes: Record<string, Note>) =>
  Object.values(notes)
    .map(mediaLibraryItemFromNote)
    .filter((item): item is MediaLibraryItem => Boolean(item))
    .sort((left, right) => right.updatedAt - left.updatedAt);
