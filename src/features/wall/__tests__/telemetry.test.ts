import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildWallTelemetrySummary,
  loadWallStartupDiagnosticsSnapshot,
  recordWallStartupCheckpoint,
  wallStartupDiagnosticsStorageKey,
} from "@/features/wall/telemetry";

afterEach(() => {
  window.localStorage.removeItem(wallStartupDiagnosticsStorageKey);
  vi.restoreAllMocks();
});

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

  it("records startup diagnostics checkpoints", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const snapshot = recordWallStartupCheckpoint("local-bootstrap-timeout", {
      durationMs: 321.49,
      detail: " exceeded-3000ms ",
    });

    expect(snapshot?.checkpoints).toHaveLength(1);
    expect(snapshot?.checkpoints[0]).toMatchObject({
      stage: "local-bootstrap-timeout",
      durationMs: 321.5,
      detail: "exceeded-3000ms",
    });
    expect(loadWallStartupDiagnosticsSnapshot()?.checkpoints).toHaveLength(1);
    expect(debugSpy).toHaveBeenCalledWith(
      "[wall-startup]",
      expect.objectContaining({ stage: "local-bootstrap-timeout" }),
    );
  });
});
