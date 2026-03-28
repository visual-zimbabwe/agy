import { describe, expect, it } from "vitest";

import { resolveWallPreviewDimensions } from "@/components/wall/wallNotePreviewSizing";

describe("resolveWallPreviewDimensions", () => {
  it("preserves wall note dimensions for timeline stream when the note fits", () => {
    const dimensions = resolveWallPreviewDimensions(
      { w: 420, h: 280 },
      { surface: "timeline-stream", maxWidth: 520 },
    );

    expect(dimensions.width).toBe(420);
    expect(dimensions.height).toBe(280);
    expect(dimensions.scale).toBe(1);
  });

  it("downscales timeline stream notes proportionally only when constrained", () => {
    const dimensions = resolveWallPreviewDimensions(
      { w: 640, h: 320 },
      { surface: "timeline-stream", maxWidth: 320 },
    );

    expect(dimensions.width).toBe(320);
    expect(dimensions.height).toBe(170);
    expect(dimensions.scale).toBeLessThan(1);
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
