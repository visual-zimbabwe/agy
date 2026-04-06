import { act, render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWallPersistenceEffects } from "@/components/wall/useWallPersistenceEffects";
import type { PersistedWallState } from "@/features/wall/types";

const loadWallBootstrapMock = vi.fn();
const loadWallShellMock = vi.fn();
const loadWallWindowMock = vi.fn();
const loadWallCameraStateMock = vi.fn();
const loadWallLocalStateWithRepairMock = vi.fn();
const loadWallWindowSnapshotMock = vi.fn();
const saveWallSnapshotMock = vi.fn();
const saveWallCloudBaselineSnapshotMock = vi.fn();
const saveWallSyncVersionMock = vi.fn();
const readStorageValueMock = vi.fn();
const writeStorageValueMock = vi.fn();

vi.mock("@/features/wall/cloud", () => ({
  hasContent: () => false,
  hasMeaningfulContent: () => true,
}));

vi.mock("@/features/wall/cloud-delta", () => ({
  loadWallBootstrap: (...args: unknown[]) => loadWallBootstrapMock(...args),
  loadWallDelta: vi.fn(),
  loadWallShell: (...args: unknown[]) => loadWallShellMock(...args),
  loadWallWindow: (...args: unknown[]) => loadWallWindowMock(...args),
}));

vi.mock("@/features/wall/storage", () => ({
  createSnapshotSaver: () => ({
    schedule: vi.fn(),
    flush: vi.fn(async () => undefined),
    markCommittedSnapshot: vi.fn(),
  }),
  createTimelineRecorder: () => ({
    schedule: vi.fn(),
    flush: vi.fn(async () => undefined),
    markCommittedSnapshot: vi.fn(),
  }),
  loadWallCameraState: (...args: unknown[]) => loadWallCameraStateMock(...args),
  loadWallLocalStateWithRepair: (...args: unknown[]) => loadWallLocalStateWithRepairMock(...args),
  loadWallWindowSnapshot: (...args: unknown[]) => loadWallWindowSnapshotMock(...args),
  saveWallSnapshot: (...args: unknown[]) => saveWallSnapshotMock(...args),
  saveWallCloudBaselineSnapshot: (...args: unknown[]) => saveWallCloudBaselineSnapshotMock(...args),
  saveWallSyncVersion: (...args: unknown[]) => saveWallSyncVersionMock(...args),
}));

vi.mock("@/features/wall/telemetry", () => ({
  recordWallStartupCheckpoint: vi.fn(),
  recordWallTelemetryMetric: vi.fn(),
}));

vi.mock("@/lib/local-storage", () => ({
  readStorageValue: (...args: unknown[]) => readStorageValueMock(...args),
  writeStorageValue: (...args: unknown[]) => writeStorageValueMock(...args),
}));

vi.mock("@/lib/api/client-auth", () => ({
  authExpiredMessage: "auth expired",
  redirectToLoginForAuth: vi.fn(),
}));

const emptySnapshot: PersistedWallState = {
  notes: {},
  zones: {},
  zoneGroups: {},
  noteGroups: {},
  links: {},
  camera: { x: 0, y: 0, zoom: 1 },
};

const setCloudWallIdMock = vi.fn();
const setWallAssetsMock = vi.fn();
const setTimelineEntriesMock = vi.fn();
const setTimelineIndexMock = vi.fn();
const onLocalSaveStateChangeMock = vi.fn();
const syncSnapshotToCloudMock = vi.fn(async () => undefined);
const fetchMock = vi.fn();

const HookHarness = ({
  hydrate,
  scheduleCloudSync,
  setAcknowledgedCloudSnapshot,
  setCloudSyncVersion,
  setCloudWallUpdatedAt,
  setSyncError,
  getViewportWindowBounds,
}: {
  hydrate: (snapshot: PersistedWallState) => void;
  scheduleCloudSync: (snapshot: PersistedWallState) => void;
  setAcknowledgedCloudSnapshot: (snapshot: PersistedWallState | null) => void;
  setCloudSyncVersion: (value: number) => void;
  setCloudWallUpdatedAt: (value: string | null) => void;
  setSyncError: (value: string | null) => void;
  getViewportWindowBounds: (camera: { x: number; y: number; zoom: number }) => {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}) => {
  const cloudReadyRef = useRef(false);
  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimelineSerialized = useRef("");
  const lastTimelineRecordedAt = useRef(0);

  useWallPersistenceEffects({
    hydrate,
    publishedReadOnly: false,
    scheduleCloudSync,
    syncSnapshotToCloud: syncSnapshotToCloudMock,
    setAcknowledgedCloudSnapshot,
    setCloudSyncVersion,
    setCloudWallUpdatedAt,
    setCloudWallId: setCloudWallIdMock,
    setWallAssets: setWallAssetsMock,
    setTimelineEntries: setTimelineEntriesMock,
    setTimelineIndex: setTimelineIndexMock,
    setSyncError,
    onLocalSaveStateChange: onLocalSaveStateChangeMock,
    cloudReadyRef,
    cloudSyncTimerRef,
    lastTimelineSerialized,
    lastTimelineRecordedAt,
    getViewportWindowBounds,
  });

  return null;
};

describe("useWallPersistenceEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    loadWallCameraStateMock.mockResolvedValue({ camera: { x: 0, y: 0, zoom: 1 } });
    loadWallWindowSnapshotMock.mockResolvedValue(emptySnapshot);
    loadWallLocalStateWithRepairMock.mockResolvedValue({
      snapshot: emptySnapshot,
      cloudBaselineSnapshot: null,
      syncVersion: 0,
    });
    loadWallShellMock.mockResolvedValue({
      id: "wall-1",
      camera: { x: 12, y: 24, zoom: 1.15 },
      syncVersion: 3,
      updatedAt: "2026-04-06T12:00:00.000Z",
    });
    loadWallWindowMock.mockResolvedValue({
      shell: {
        id: "wall-1",
        camera: { x: 12, y: 24, zoom: 1.15 },
        syncVersion: 3,
        updatedAt: "2026-04-06T12:00:00.000Z",
      },
      bounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
      snapshot: emptySnapshot,
      assets: {},
      readModel: {
        tileKey: "t",
        queryBounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
        candidateBounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
        prefetchBounds: [],
        counts: {
          candidateNotes: 0,
          candidateZones: 0,
          visibleNotes: 0,
          visibleZones: 0,
          visibleLinks: 0,
          visibleZoneGroups: 0,
          visibleNoteGroups: 0,
        },
      },
      syncVersion: 3,
    });
    loadWallBootstrapMock.mockResolvedValue({
      snapshot: emptySnapshot,
      syncVersion: 3,
    });
    saveWallSnapshotMock.mockResolvedValue(undefined);
    saveWallCloudBaselineSnapshotMock.mockResolvedValue(undefined);
    saveWallSyncVersionMock.mockResolvedValue(undefined);
    readStorageValueMock.mockImplementation((key: string) => (key === "agy-last-cloud-wall-id" ? "wall-1" : null));
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ walls: [{ id: "wall-1" }] }),
    });
  });

  it("does not restart bootstrap when rerendered with fresh callback identities", async () => {
    const view = render(
      <HookHarness
        hydrate={vi.fn()}
        scheduleCloudSync={vi.fn()}
        setAcknowledgedCloudSnapshot={vi.fn()}
        setCloudSyncVersion={vi.fn()}
        setCloudWallUpdatedAt={vi.fn()}
        setSyncError={vi.fn()}
        getViewportWindowBounds={() => ({ minX: -100, minY: -100, maxX: 100, maxY: 100 })}
      />,
    );

    await waitFor(() => {
      expect(loadWallShellMock).toHaveBeenCalledTimes(1);
      expect(loadWallWindowMock).toHaveBeenCalledTimes(1);
      expect(loadWallBootstrapMock).toHaveBeenCalledTimes(1);
    });

    view.rerender(
      <HookHarness
        hydrate={vi.fn()}
        scheduleCloudSync={vi.fn()}
        setAcknowledgedCloudSnapshot={vi.fn()}
        setCloudSyncVersion={vi.fn()}
        setCloudWallUpdatedAt={vi.fn()}
        setSyncError={vi.fn()}
        getViewportWindowBounds={() => ({ minX: -100, minY: -100, maxX: 100, maxY: 100 })}
      />,
    );

    await act(async () => {});

    expect(loadWallShellMock).toHaveBeenCalledTimes(1);
    expect(loadWallWindowMock).toHaveBeenCalledTimes(1);
    expect(loadWallBootstrapMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the local viewport when shell and remote content use a different camera", async () => {
    const hydrate = vi.fn();

    loadWallCameraStateMock.mockResolvedValue({ camera: { x: 250, y: 400, zoom: 1.8 } });
    loadWallWindowSnapshotMock.mockResolvedValue({
      ...emptySnapshot,
      camera: { x: 250, y: 400, zoom: 1.8 },
    });
    loadWallWindowMock.mockResolvedValue({
      shell: {
        id: "wall-1",
        camera: { x: 12, y: 24, zoom: 1.15 },
        syncVersion: 3,
        updatedAt: "2026-04-06T12:00:00.000Z",
      },
      bounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
      snapshot: {
        ...emptySnapshot,
        camera: { x: 12, y: 24, zoom: 1.15 },
      },
      assets: {},
      readModel: {
        tileKey: "t",
        queryBounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
        candidateBounds: { minX: -100, minY: -100, maxX: 100, maxY: 100 },
        prefetchBounds: [],
        counts: {
          candidateNotes: 0,
          candidateZones: 0,
          visibleNotes: 0,
          visibleZones: 0,
          visibleLinks: 0,
          visibleZoneGroups: 0,
          visibleNoteGroups: 0,
        },
      },
      syncVersion: 3,
    });

    render(
      <HookHarness
        hydrate={hydrate}
        scheduleCloudSync={vi.fn()}
        setAcknowledgedCloudSnapshot={vi.fn()}
        setCloudSyncVersion={vi.fn()}
        setCloudWallUpdatedAt={vi.fn()}
        setSyncError={vi.fn()}
        getViewportWindowBounds={() => ({ minX: -100, minY: -100, maxX: 100, maxY: 100 })}
      />,
    );

    await waitFor(() => {
      expect(hydrate).toHaveBeenCalled();
    });

    expect(hydrate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        camera: { x: 250, y: 400, zoom: 1.8 },
      }),
    );
  });
});
