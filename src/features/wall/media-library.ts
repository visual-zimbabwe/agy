import { getAudioNoteTitle } from "@/features/wall/audio-notes";
import { resolveAudioAssetUrl, resolveVideoAssetUrl, resolveVideoPosterAssetUrl } from "@/features/wall/asset-records";
import { getVideoNoteMeta, getVideoNoteTitle, getVideoPosterUrl } from "@/features/wall/video-notes";
import type { AudioNote, Note, VideoNote, WallAssetMap } from "@/features/wall/types";

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

export const mediaLibraryItemFromNote = (note: Note, assets?: WallAssetMap): MediaLibraryItem | undefined => {
  const audioUrl = resolveAudioAssetUrl(note, assets);
  const audio = note.audio;
  if (note.noteKind === "audio" && audioUrl && audio) {
    return {
      id: note.id,
      kind: "audio",
      title: getAudioNoteTitle(audio),
      subtitle: deriveAudioSubtitle(note, audio),
      durationSeconds: audio.durationSeconds,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      source: audio.source,
      url: audioUrl,
      mimeType: trimText(audio.mimeType) || undefined,
      tags: note.tags,
      noteText: trimText(note.text),
      audio,
    };
  }

  const videoUrl = resolveVideoAssetUrl(note, assets);
  const video = note.video;
  if (note.noteKind === "video" && videoUrl && video) {
    return {
      id: note.id,
      kind: "video",
      title: getVideoNoteTitle(video),
      subtitle: deriveVideoSubtitle(note, video),
      durationSeconds: video.durationSeconds,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      source: video.source,
      url: videoUrl,
      mimeType: trimText(video.mimeType) || undefined,
      posterUrl: resolveVideoPosterAssetUrl(note, assets) ?? getVideoPosterUrl(note.video),
      tags: note.tags,
      noteText: trimText(note.text),
      video,
    };
  }

  return undefined;
};

export const deriveMediaLibrary = (notes: Record<string, Note>, assets?: WallAssetMap) =>
  Object.values(notes)
    .map((note) => mediaLibraryItemFromNote(note, assets))
    .filter((item): item is MediaLibraryItem => Boolean(item))
    .sort((left, right) => right.updatedAt - left.updatedAt);
