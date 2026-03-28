import { describe, expect, it } from "vitest";

import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";

describe("resolveWallPreviewDimensions", () => {
  it("preserves wall note dimensions for timeline stream", () => {
    const dimensions = resolveWallPreviewDimensions(
      { w: 420, h: 280 },
      { surface: "timeline-stream" },
    );

    expect(dimensions.width).toBe(420);
    expect(dimensions.height).toBe(280);
    expect(dimensions.scale).toBe(1);
  });

  it("keeps timeline stream notes at wall size even when a max width is provided", () => {
    const dimensions = resolveWallPreviewDimensions(
      { w: 640, h: 320 },
      { surface: "timeline-stream", maxWidth: 320 },
    );

    expect(dimensions.width).toBe(640);
    expect(dimensions.height).toBe(320);
    expect(dimensions.scale).toBe(1);
  });

  it("applies timeline canvas card scaling from the shared policy", () => {
    const dimensions = resolveWallPreviewDimensions(
      { w: 420, h: 180 },
      { surface: "timeline-canvas", previewScale: "small" },
    );

    expect(dimensions.width).toBe(294);
    expect(dimensions.height).toBe(126);
    expect(dimensions.scale).toBe(0.7);
  });
});
