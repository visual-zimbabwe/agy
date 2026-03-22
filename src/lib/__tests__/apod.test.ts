import { describe, expect, it } from "vitest";

import { getApodDownloadUrl, getApodPlayback, hasUsableApodPreview, resolveApodMedia } from "@/lib/apod";

describe("resolveApodMedia", () => {
  it("prefers still-image URLs for image APOD entries", () => {
    expect(
      resolveApodMedia({
        media_type: "image",
        hdurl: "https://images-assets.nasa.gov/hd.jpg",
        url: "https://apod.nasa.gov/image.jpg",
        thumbnail_url: "https://apod.nasa.gov/thumb.jpg",
      }),
    ).toEqual({
      mediaType: "image",
      imageUrl: "https://images-assets.nasa.gov/hd.jpg",
      fallbackImageUrl: "https://apod.nasa.gov/image.jpg",
      pageUrl: "https://apod.nasa.gov/image.jpg",
    });
  });

  it("uses the thumbnail for video APOD entries instead of the embed page URL", () => {
    expect(
      resolveApodMedia({
        media_type: "video",
        url: "https://www.youtube.com/embed/example",
        thumbnail_url: "https://img.youtube.com/vi/example/hqdefault.jpg",
      }),
    ).toEqual({
      mediaType: "video",
      imageUrl: "https://img.youtube.com/vi/example/hqdefault.jpg",
      fallbackImageUrl: "https://img.youtube.com/vi/example/hqdefault.jpg",
      pageUrl: "https://www.youtube.com/embed/example",
    });
  });

  it("keeps embeddable video APOD entries usable even when NASA omits a thumbnail", () => {
    const media = resolveApodMedia({
      media_type: "video",
      url: "https://www.youtube.com/watch?v=abc123",
    });

    expect(media).toEqual({
      mediaType: "video",
      imageUrl: undefined,
      fallbackImageUrl: undefined,
      pageUrl: "https://www.youtube.com/watch?v=abc123",
    });
    expect(hasUsableApodPreview(media)).toBe(true);
  });
});

describe("getApodPlayback", () => {
  it("normalizes YouTube watch URLs into embeddable playback URLs", () => {
    expect(
      getApodPlayback({
        mediaType: "video",
        pageUrl: "https://www.youtube.com/watch?v=abc123",
      }),
    ).toEqual({
      kind: "embed",
      url: "https://www.youtube.com/embed/abc123",
    });
  });

  it("keeps direct video files as direct playback sources", () => {
    expect(
      getApodPlayback({
        mediaType: "video",
        pageUrl: "https://apod.nasa.gov/video/galaxy.mp4",
      }),
    ).toEqual({
      kind: "direct",
      url: "https://apod.nasa.gov/video/galaxy.mp4",
    });
  });
});

describe("getApodDownloadUrl", () => {
  it("prefers the direct video file for downloadable video APOD entries", () => {
    expect(
      getApodDownloadUrl({
        mediaType: "video",
        pageUrl: "https://apod.nasa.gov/video/galaxy.mp4",
        imageUrl: "https://img.youtube.com/vi/example/hqdefault.jpg",
      }),
    ).toBe("https://apod.nasa.gov/video/galaxy.mp4");
  });
});
