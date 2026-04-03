import { describe, expect, it } from "vitest";

import {
  deriveWallAssetRecords,
  resolveAudioAssetUrl,
  resolveImageAssetUrl,
  resolveVideoPosterAssetUrl,
  resolveVideoAssetUrl,
} from "@/features/wall/asset-records";
import type { Note, WallAssetMap } from "@/features/wall/types";

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: "note-1",
  text: "Hello",
  tags: [],
  x: 0,
  y: 0,
  w: 220,
  h: 160,
  color: "#fff",
  createdAt: 1,
  updatedAt: 5,
  ...overrides,
});

describe("wall asset records", () => {
  it("derives image, audio, and video asset records from media notes", () => {
    const notes = {
      image: baseNote({
        id: "image",
        noteKind: "image",
        imageUrl: "https://example.com/image.jpg",
        file: {
          source: "upload",
          name: "image.jpg",
          url: "https://example.com/image.jpg",
        },
      }),
      audio: baseNote({
        id: "audio",
        noteKind: "audio",
        audio: {
          source: "link",
          name: "audio.mp3",
          url: "https://example.com/audio.mp3",
          durationSeconds: 42,
        },
      }),
      video: baseNote({
        id: "video",
        noteKind: "video",
        video: {
          source: "upload",
          name: "video.mp4",
          url: "https://example.com/video.mp4",
          durationSeconds: 91,
          posterDataUrl: "data:image/jpeg;base64,abc",
        },
      }),
    };

    const assets = deriveWallAssetRecords(notes);

    expect(assets["image:image"]?.url).toBe("https://example.com/image.jpg");
    expect(assets["audio:audio"]?.durationSeconds).toBe(42);
    expect(assets["video:video"]?.posterUrl).toBe("data:image/jpeg;base64,abc");
  });

  it("resolves media urls through the asset map first", () => {
    const note = baseNote({
      id: "video",
      noteKind: "video",
      video: {
        source: "upload",
        name: "video.mp4",
        url: "https://example.com/fallback.mp4",
      },
      imageUrl: "https://example.com/fallback.jpg",
      audio: {
        source: "upload",
        name: "audio.mp3",
        url: "https://example.com/fallback-audio.mp3",
      },
    });

    const assets: WallAssetMap = {
      "video:image": {
        id: "video:image",
        noteId: "video",
        kind: "image",
        url: "https://example.com/asset-image.jpg",
        source: "upload" as const,
        updatedAt: 1,
      },
      "video:audio": {
        id: "video:audio",
        noteId: "video",
        kind: "audio",
        url: "https://example.com/asset-audio.mp3",
        source: "upload" as const,
        updatedAt: 1,
      },
      "video:video": {
        id: "video:video",
        noteId: "video",
        kind: "video",
        url: "https://example.com/asset-video.mp4",
        source: "upload" as const,
        posterUrl: "https://example.com/asset-video.jpg",
        updatedAt: 1,
      },
    };

    expect(resolveImageAssetUrl(note, assets)).toBe("https://example.com/asset-image.jpg");
    expect(resolveAudioAssetUrl(note, assets)).toBe("https://example.com/asset-audio.mp3");
    expect(resolveVideoAssetUrl(note, assets)).toBe("https://example.com/asset-video.mp4");
    expect(resolveVideoPosterAssetUrl(note, assets)).toBe("https://example.com/asset-video.jpg");
  });
});
