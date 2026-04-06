import { describe, expect, it } from "vitest";

import { applyPageOperations, derivePageOperations, parseStoredCloudPageSnapshot } from "@/features/page/operations";
import type { PersistedPageState } from "@/features/page/types";

const baseSnapshot: PersistedPageState = {
  blocks: [
    {
      id: "a",
      type: "text",
      content: "Hello",
      x: 10,
      y: 20,
      w: 200,
      h: 40,
    },
  ],
  camera: { x: 0, y: 0, zoom: 1 },
  updatedAt: 1,
};

describe("page operations", () => {
  it("derives targeted operations for changed page fields", () => {
    const nextSnapshot: PersistedPageState = {
      ...baseSnapshot,
      blocks: [...baseSnapshot.blocks, { id: "b", type: "todo", content: "", x: 10, y: 80, w: 200, h: 32, checked: false }],
      camera: { x: 10, y: 12, zoom: 1.2 },
      cover: { externalUrl: "https://example.com/cover.jpg" },
      updatedAt: 2,
    };

    const operations = derivePageOperations(baseSnapshot, nextSnapshot);
    expect(operations.map((entry) => entry.type)).toEqual(["replace_blocks", "set_camera", "set_cover"]);
  });

  it("applies operations on top of an existing snapshot", () => {
    const nextSnapshot = applyPageOperations(baseSnapshot, [
      { type: "set_camera", camera: { x: 30, y: 40, zoom: 1.4 } },
      { type: "set_cover", cover: { externalUrl: "https://example.com/cover.jpg" } },
    ]);

    expect(nextSnapshot.camera).toEqual({ x: 30, y: 40, zoom: 1.4 });
    expect(nextSnapshot.cover).toEqual({ externalUrl: "https://example.com/cover.jpg" });
    expect(nextSnapshot.blocks).toEqual(baseSnapshot.blocks);
  });

  it("parses legacy and envelope cloud snapshots", () => {
    expect(parseStoredCloudPageSnapshot(baseSnapshot)).toEqual({
      snapshot: baseSnapshot,
      revision: 0,
    });
    expect(parseStoredCloudPageSnapshot({ state: baseSnapshot, revision: 7 })).toEqual({
      snapshot: baseSnapshot,
      revision: 7,
    });
  });
});
