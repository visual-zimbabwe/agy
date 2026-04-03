import { getVideoPosterUrl } from "@/features/wall/video-notes";
import type { AudioNote, FileNote, Note, VideoNote, WallAssetMap, WallAssetRecord } from "@/features/wall/types";

const clean = (value?: string | null) => value?.trim() || undefined;

const makeAssetId = (noteId: string, kind: WallAssetRecord["kind"]) => `${noteId}:${kind}`;

const fileAssetRecord = (
  note: Note,
  kind: WallAssetRecord["kind"],
  file: Partial<FileNote | AudioNote | VideoNote> | null | undefined,
  options?: { url?: string; durationSeconds?: number; posterUrl?: string },
): WallAssetRecord | null => {
  const url = clean(options?.url ?? file?.url);
  if (!url) {
    return null;
  }

  return {
    id: makeAssetId(note.id, kind),
    noteId: note.id,
    kind,
    url,
    source: file?.source === "link" ? "link" : "upload",
    name: clean(file?.name),
    mimeType: clean(file?.mimeType),
    extension: clean(file?.extension),
    sizeBytes: typeof file?.sizeBytes === "number" ? file.sizeBytes : undefined,
    uploadedAt: typeof file?.uploadedAt === "number" ? file.uploadedAt : undefined,
    durationSeconds: typeof options?.durationSeconds === "number" ? options.durationSeconds : undefined,
    posterUrl: clean(options?.posterUrl),
    updatedAt: note.updatedAt,
  };
};

export const deriveNoteAssetRecords = (note: Note): WallAssetRecord[] => {
  const assets: WallAssetRecord[] = [];

  if (note.noteKind === "image") {
    const imageAsset = fileAssetRecord(note, "image", note.file, {
      url: note.file?.url ?? note.imageUrl,
    });
    if (imageAsset) {
      assets.push(imageAsset);
    }
  }

  if (note.noteKind === "file") {
    const fileAsset = fileAssetRecord(note, "file", note.file);
    if (fileAsset) {
      assets.push(fileAsset);
    }
  }

  if (note.noteKind === "audio") {
    const audioAsset = fileAssetRecord(note, "audio", note.audio, {
      durationSeconds: note.audio?.durationSeconds,
    });
    if (audioAsset) {
      assets.push(audioAsset);
    }
  }

  if (note.noteKind === "video") {
    const videoAsset = fileAssetRecord(note, "video", note.video, {
      durationSeconds: note.video?.durationSeconds,
      posterUrl: getVideoPosterUrl(note.video),
    });
    if (videoAsset) {
      assets.push(videoAsset);
    }
  }

  return assets;
};

export const deriveWallAssetRecords = (notes: Record<string, Note>): WallAssetMap =>
  Object.fromEntries(
    Object.values(notes)
      .flatMap((note) => deriveNoteAssetRecords(note))
      .map((asset) => [asset.id, asset]),
  );

export const mergeWallAssetRecords = (...assetMaps: Array<WallAssetMap | null | undefined>): WallAssetMap =>
  Object.assign({}, ...assetMaps.filter(Boolean));

const findAssetForNote = (note: Note, kind: WallAssetRecord["kind"], assets?: WallAssetMap) => {
  const assetId = makeAssetId(note.id, kind);
  return assets?.[assetId];
};

export const resolveImageAssetUrl = (note: Note, assets?: WallAssetMap) =>
  findAssetForNote(note, "image", assets)?.url ?? clean(note.file?.url ?? note.imageUrl);

export const resolveFileAssetUrl = (note: Note, assets?: WallAssetMap) =>
  findAssetForNote(note, "file", assets)?.url ?? clean(note.file?.url);

export const resolveAudioAssetUrl = (note: Note, assets?: WallAssetMap) =>
  findAssetForNote(note, "audio", assets)?.url ?? clean(note.audio?.url);

export const resolveVideoAssetUrl = (note: Note, assets?: WallAssetMap) =>
  findAssetForNote(note, "video", assets)?.url ?? clean(note.video?.url);

export const resolveVideoPosterAssetUrl = (note: Note, assets?: WallAssetMap) =>
  findAssetForNote(note, "video", assets)?.posterUrl ?? getVideoPosterUrl(note.video);
