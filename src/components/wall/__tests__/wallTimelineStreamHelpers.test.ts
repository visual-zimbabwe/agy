import { describe, expect, it } from "vitest";

import { moveTimelineStreamSelection } from "@/components/wall/wallTimelineStreamHelpers";

describe("moveTimelineStreamSelection", () => {
  const entryIds = ["newest", "middle", "oldest"];

  it("returns the first entry when nothing is selected and moving next", () => {
    expect(moveTimelineStreamSelection(entryIds, undefined, "next")).toBe("newest");
  });

  it("returns the last entry when nothing is selected and moving previous", () => {
    expect(moveTimelineStreamSelection(entryIds, undefined, "previous")).toBe("oldest");
  });

  it("moves toward older entries on next", () => {
    expect(moveTimelineStreamSelection(entryIds, "newest", "next")).toBe("middle");
    expect(moveTimelineStreamSelection(entryIds, "middle", "next")).toBe("oldest");
  });

  it("moves toward newer entries on previous", () => {
    expect(moveTimelineStreamSelection(entryIds, "oldest", "previous")).toBe("middle");
    expect(moveTimelineStreamSelection(entryIds, "middle", "previous")).toBe("newest");
  });

  it("clamps at the ends of the list", () => {
    expect(moveTimelineStreamSelection(entryIds, "oldest", "next")).toBe("oldest");
    expect(moveTimelineStreamSelection(entryIds, "newest", "previous")).toBe("newest");
  });

  it("falls back to the first entry when the current id is missing", () => {
    expect(moveTimelineStreamSelection(entryIds, "missing", "next")).toBe("newest");
  });
});
