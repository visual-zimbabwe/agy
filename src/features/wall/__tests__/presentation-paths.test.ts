import { describe, expect, it } from "vitest";

import { addPresentationStep, clampPresentationIndex, createPresentationPath, parsePresentationPathsPayload } from "@/lib/presentation-paths";

describe("presentation paths helpers", () => {
  it("creates paths and appends camera waypoints", () => {
    const path = createPresentationPath("Q2 Story", 100);
    const withStep = addPresentationStep(path, { x: 10, y: 20, zoom: 1.4 }, 200);

    expect(withStep.title).toBe("Q2 Story");
    expect(withStep.steps).toHaveLength(1);
    expect(withStep.steps[0]?.title).toBe("Step 1");
    expect(withStep.steps[0]?.camera.zoom).toBe(1.4);
    expect(withStep.updatedAt).toBe(200);
  });

  it("parses only valid path payload entries", () => {
    const parsed = parsePresentationPathsPayload(
      JSON.stringify([
        {
          id: "p1",
          title: "Narrative",
          createdAt: 1,
          updatedAt: 2,
          steps: [{ id: "s1", title: "Step 1", camera: { x: 0, y: 0, zoom: 1.2 }, talkingPoints: "hello", createdAt: 1 }],
        },
        { nope: true },
      ]),
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe("p1");
    expect(parsed[0]?.steps).toHaveLength(1);
  });

  it("clamps index within bounds", () => {
    expect(clampPresentationIndex(-1, 3)).toBe(0);
    expect(clampPresentationIndex(10, 3)).toBe(2);
    expect(clampPresentationIndex(2, 0)).toBe(0);
  });
});
