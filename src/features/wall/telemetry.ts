import { appSlug, legacyAppSlug } from "@/lib/brand";
import { readStorageValue, writeStorageValue } from "@/lib/local-storage";

export type WallTelemetryMetricKey =
  | "initialInteractMs"
  | "toolsPanelOpenMs"
  | "detailsPanelOpenMs"
  | "searchOpenMs"
  | "exportOpenMs"
  | "shortcutsOpenMs"
  | "startupLocalBootstrapMs"
  | "startupHydrateMs"
  | "startupCloudBootstrapMs"
  | "startupRecoveryMs";

export type WallTelemetryMetricSummary = {
  count: number;
  lastMs: number;
  avgMs: number;
  p95Ms: number;
};

export type WallTelemetrySnapshot = {
  updatedAt: number;
  samples: Partial<Record<WallTelemetryMetricKey, number[]>>;
  summary: Partial<Record<WallTelemetryMetricKey, WallTelemetryMetricSummary>>;
};

export type WallStartupCheckpointStage =
  | "local-bootstrap-started"
  | "local-bootstrap-completed"
  | "local-bootstrap-timeout"
  | "local-bootstrap-failed"
  | "hydrate-completed"
  | "cloud-bootstrap-started"
  | "cloud-bootstrap-completed"
  | "cloud-bootstrap-failed";

export type WallStartupCheckpoint = {
  ts: number;
  stage: WallStartupCheckpointStage;
  durationMs?: number;
  detail?: string;
};

export type WallStartupDiagnosticsSnapshot = {
  updatedAt: number;
  checkpoints: WallStartupCheckpoint[];
};

export const wallTelemetryStorageKey = `${appSlug}-ux-telemetry-v1`;
export const wallStartupDiagnosticsStorageKey = `${appSlug}-wall-startup-diagnostics-v1`;
const legacyWallTelemetryStorageKey = `${legacyAppSlug}-ux-telemetry-v1`;
const legacyWallStartupDiagnosticsStorageKey = `${legacyAppSlug}-wall-startup-diagnostics-v1`;
const maxSamplesPerMetric = 50;
const maxStartupCheckpoints = 80;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isWallTelemetryEnabled = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return process.env.NODE_ENV !== "production" || window.location.hostname === "localhost";
};

const summarize = (values: number[]): WallTelemetryMetricSummary => {
  const safe = values.filter((value) => Number.isFinite(value) && value >= 0);
  if (safe.length === 0) {
    return { count: 0, lastMs: 0, avgMs: 0, p95Ms: 0 };
  }
  const sorted = [...safe].sort((a, b) => a - b);
  const count = sorted.length;
  const avgMs = Number((sorted.reduce((sum, value) => sum + value, 0) / count).toFixed(1));
  const percentileIndex = Math.max(0, Math.min(count - 1, Math.ceil(count * 0.95) - 1));
  const p95Value = sorted[percentileIndex] ?? 0;
  const lastValue = sorted[count - 1] ?? 0;
  const p95Ms = Number(p95Value.toFixed(1));
  const lastMs = Number(lastValue.toFixed(1));
  return { count, lastMs, avgMs, p95Ms };
};

export const loadWallTelemetrySnapshot = (): WallTelemetrySnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = readStorageValue(wallTelemetryStorageKey, [legacyWallTelemetryStorageKey]);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();
    const samples: WallTelemetrySnapshot["samples"] = {};
    const sampleRecord = parsed.samples;
    if (isRecord(sampleRecord)) {
      for (const [key, value] of Object.entries(sampleRecord)) {
        if (!Array.isArray(value)) {
          continue;
        }
        samples[key as WallTelemetryMetricKey] = value
          .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry) && entry >= 0)
          .slice(-maxSamplesPerMetric);
      }
    }
    return {
      updatedAt,
      samples,
      summary: buildWallTelemetrySummary(samples),
    };
  } catch {
    return null;
  }
};

export const buildWallTelemetrySummary = (
  samples: Partial<Record<WallTelemetryMetricKey, number[]>>,
): Partial<Record<WallTelemetryMetricKey, WallTelemetryMetricSummary>> => {
  const summary: Partial<Record<WallTelemetryMetricKey, WallTelemetryMetricSummary>> = {};
  for (const [key, values] of Object.entries(samples) as Array<[WallTelemetryMetricKey, number[] | undefined]>) {
    if (!values || values.length === 0) {
      continue;
    }
    summary[key] = summarize(values);
  }
  return summary;
};

export const recordWallTelemetryMetric = (key: WallTelemetryMetricKey, valueMs: number) => {
  if (!isWallTelemetryEnabled() || !Number.isFinite(valueMs) || valueMs < 0) {
    return null;
  }

  const current = loadWallTelemetrySnapshot();
  const samples = { ...(current?.samples ?? {}) };
  const existing = samples[key] ?? [];
  samples[key] = [...existing, Number(valueMs.toFixed(1))].slice(-maxSamplesPerMetric);

  const next: WallTelemetrySnapshot = {
    updatedAt: Date.now(),
    samples,
    summary: buildWallTelemetrySummary(samples),
  };

  try {
    writeStorageValue(wallTelemetryStorageKey, JSON.stringify(next));
  } catch {
    return null;
  }

  return next;
};

export const loadWallStartupDiagnosticsSnapshot = (): WallStartupDiagnosticsSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = readStorageValue(wallStartupDiagnosticsStorageKey, [legacyWallStartupDiagnosticsStorageKey]);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.checkpoints)) {
      return null;
    }

    const checkpoints = parsed.checkpoints
      .filter((entry): entry is Record<string, unknown> => isRecord(entry))
      .map((entry) => ({
        ts: typeof entry.ts === "number" ? entry.ts : Date.now(),
        stage: entry.stage as WallStartupCheckpointStage,
        durationMs: typeof entry.durationMs === "number" ? entry.durationMs : undefined,
        detail: typeof entry.detail === "string" ? entry.detail : undefined,
      }))
      .slice(-maxStartupCheckpoints);

    return {
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      checkpoints,
    };
  } catch {
    return null;
  }
};

export const recordWallStartupCheckpoint = (
  stage: WallStartupCheckpointStage,
  options?: { durationMs?: number; detail?: string },
) => {
  if (!isWallTelemetryEnabled()) {
    return null;
  }

  const current = loadWallStartupDiagnosticsSnapshot();
  const checkpoint: WallStartupCheckpoint = {
    ts: Date.now(),
    stage,
    durationMs: typeof options?.durationMs === "number" && Number.isFinite(options.durationMs) ? Number(options.durationMs.toFixed(1)) : undefined,
    detail: options?.detail?.trim() || undefined,
  };

  const next: WallStartupDiagnosticsSnapshot = {
    updatedAt: checkpoint.ts,
    checkpoints: [...(current?.checkpoints ?? []), checkpoint].slice(-maxStartupCheckpoints),
  };

  try {
    writeStorageValue(wallStartupDiagnosticsStorageKey, JSON.stringify(next));
  } catch {
    return null;
  }

  if (typeof console !== "undefined") {
    console.debug("[wall-startup]", checkpoint);
  }

  return next;
};
