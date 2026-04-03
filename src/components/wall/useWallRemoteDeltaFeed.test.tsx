import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWallRemoteDeltaFeed } from "@/components/wall/useWallRemoteDeltaFeed";
import type { PersistedWallState } from "@/features/wall/types";

const loadWallDeltaMock = vi.fn();

vi.mock("@/features/wall/cloud-delta", () => ({
  loadWallDelta: (...args: unknown[]) => loadWallDeltaMock(...args),
}));

vi.mock("@/lib/api/client-auth", () => ({
  authExpiredMessage: "auth expired",
  redirectToLoginForAuth: vi.fn(),
}));

const baselineSnapshot: PersistedWallState = {
  notes: {
    note1: {
      id: "note1",
      text: "hello",
      tags: [],
      x: 0,
      y: 0,
      w: 120,
      h: 80,
      color: "#fff",
      createdAt: 1,
      updatedAt: 1,
    },
  },
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

const bounds = {
  minX: -100,
  minY: -100,
  maxX: 100,
  maxY: 100,
};

const HookHarness = ({
  getBaselineSnapshot,
  getSyncVersion,
  getViewportBounds,
  onRemoteSnapshot,
}: {
  getBaselineSnapshot: () => PersistedWallState | null;
  getSyncVersion: () => number;
  getViewportBounds: () => typeof bounds;
  onRemoteSnapshot: (payload: { baselineSnapshot: PersistedWallState; viewportSnapshot: PersistedWallState | null; syncVersion: number }) => void;
}) => {
  useWallRemoteDeltaFeed({
    wallId: "wall-1",
    enabled: true,
    getBaselineSnapshot,
    getSyncVersion,
    getViewportBounds,
    onRemoteSnapshot,
  });

  return null;
};

describe("useWallRemoteDeltaFeed", () => {
  beforeEach(() => {
    loadWallDeltaMock.mockResolvedValue({
      currentVersion: 1,
      changes: [],
    });
  });

  it("does not re-poll immediately when rerendered with new callback identities", async () => {
    const onRemoteSnapshot = vi.fn();
    const firstGetBaselineSnapshot = () => baselineSnapshot;
    const firstGetSyncVersion = () => 1;
    const firstGetViewportBounds = () => bounds;

    const view = render(
      <HookHarness
        getBaselineSnapshot={firstGetBaselineSnapshot}
        getSyncVersion={firstGetSyncVersion}
        getViewportBounds={firstGetViewportBounds}
        onRemoteSnapshot={onRemoteSnapshot}
      />,
    );

    await act(async () => {});
    expect(loadWallDeltaMock).toHaveBeenCalledTimes(1);

    view.rerender(
      <HookHarness
        getBaselineSnapshot={() => baselineSnapshot}
        getSyncVersion={() => 1}
        getViewportBounds={() => bounds}
        onRemoteSnapshot={onRemoteSnapshot}
      />,
    );

    await act(async () => {});
    expect(loadWallDeltaMock).toHaveBeenCalledTimes(1);

    view.unmount();
  });
});
