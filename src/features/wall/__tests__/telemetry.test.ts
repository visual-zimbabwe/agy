import { describe, expect, it } from "vitest";

import { buildWallTelemetrySummary } from "@/features/wall/telemetry";

describe("wall telemetry summary", () => {
  it("computes aggregate stats for metric samples", () => {
    const summary = buildWallTelemetrySummary({
      searchOpenMs: [20, 30, 40, 50, 60],
    });

    expect(summary.searchOpenMs?.count).toBe(5);
    expect(summary.searchOpenMs?.avgMs).toBe(40);
    expect(summary.searchOpenMs?.p95Ms).toBe(60);
    expect(summary.searchOpenMs?.lastMs).toBe(60);
  });
});
