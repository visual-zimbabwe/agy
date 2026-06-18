import { describe, expect, it } from "vitest";

import { estimateImageCaptionHeight, getContainedImageLayout, getImageNoteAutoHeight } from "@/components/wall/spatial/notes/note-layout";
import { NOTE_DEFAULTS } from "@/features/wall/constants";

describe("note image layout", () => {
  it("does not reserve caption space when the caption is empty", () => {
    expect(estimateImageCaptionHeight(240, "   ")).toBe(0);
  });

  it("uses intrinsic image ratio when computing automatic image-note height", () => {
    const image = { naturalWidth: 400, naturalHeight: 200 } as HTMLImageElement;

    expect(getImageNoteAutoHeight({ w: 212 }, "caption", image)).toBeGreaterThan(NOTE_DEFAULTS.minHeight);
  });

  it("contains portrait images without overflowing the available image area", () => {
    const image = { naturalWidth: 300, naturalHeight: 600 } as HTMLImageElement;
    const layout = getContainedImageLayout({ w: 220, h: 180 }, "short caption", image);

    expect(layout.imageWidth).toBeLessThanOrEqual(208);
    expect(layout.imageHeight + layout.captionHeight).toBeLessThanOrEqual(168);
    expect(layout.imageX).toBeGreaterThanOrEqual(6);
    expect(layout.imageY).toBeGreaterThanOrEqual(6);
  });
});
