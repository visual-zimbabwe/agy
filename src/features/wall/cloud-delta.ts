import type { DeltaSyncRequest } from "@/features/wall/delta-sync";
import type { PersistedWallState } from "@/features/wall/types";
import { authExpiredMessage } from "@/lib/api/client-auth";

export type WallDeltaChange = {
  id: number;
  entity_type: string;
  entity_id: string;
  revision: number;
  deleted: boolean;
  payload: unknown;
  changed_at: string;
};

export const loadWallBootstrap = async (wallId: string): Promise<{ snapshot: PersistedWallState; syncVersion: number }> => {
  const response = await fetch(`/api/walls/${wallId}`, { cache: "no-store" });
  if (response.status === 401) {
    throw new Error(authExpiredMessage);
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Unable to load wall bootstrap");
  }

  const payload = (await response.json()) as { snapshot: PersistedWallState; syncVersion?: number };
  return {
    snapshot: payload.snapshot,
    syncVersion: payload.syncVersion ?? 0,
  };
};

export const loadWallDelta = async (wallId: string, since: number) => {
  const response = await fetch(`/api/walls/${wallId}/delta?since=${encodeURIComponent(String(Math.max(0, since)))}`, {
    cache: "no-store",
  });
  if (response.status === 401) {
    throw new Error(authExpiredMessage);
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Unable to load wall delta");
  }

  return (await response.json()) as {
    wallId: string;
    fromVersion: number;
    currentVersion: number;
    changes: WallDeltaChange[];
  };
};

export const pushWallDelta = async (wallId: string, delta: DeltaSyncRequest) => {
  const response = await fetch(`/api/walls/${wallId}/delta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(delta),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    currentVersion?: number;
    appliedChanges?: number;
  };

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};
