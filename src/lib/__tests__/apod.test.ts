import { describe, expect, it } from "vitest";

import { resolveApodMedia } from "@/lib/apod";

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
});
