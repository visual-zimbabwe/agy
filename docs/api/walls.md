# Walls API

## Purpose

This document describes the current wall API surface used by the wall workspace for wall records and wall snapshot sync.

## Scope

This is a current-state contract summary based on the server routes in `src/app/api/walls/`. It focuses on wall listing, wall retrieval, wall metadata updates, and snapshot sync.

## Routes

### `GET /api/walls`

Returns the authenticated user’s wall records ordered by `updated_at` descending.

Current response shape:

- `walls`: array of wall summaries

Each summary currently includes:

- `id`
- `title`
- `updated_at`
- `created_at`

### `POST /api/walls`

Creates a wall for the authenticated user.

Accepted body:

- `title?`: optional string, max 120 characters

Default title:

- `My Wall`

Current success response:

- `201`
- `wall`: created wall row including camera and last color fields

### `GET /api/walls/:wallId`

Returns wall metadata plus either an encrypted wall snapshot or a normalized legacy wall snapshot for the authenticated owner.

Current response shape:

- `wall`
- `secureSnapshot` when encrypted sync is active
- `snapshot` during legacy fallback reads

The snapshot includes:

- `notes`
- `zones`
- `zoneGroups`
- `noteGroups`
- `links`
- `camera`
- `lastColor`

The handler contains compatibility logic for older database states, including missing:

- zone kind columns
- note formatting columns
- vocabulary columns
- note groups table
- currency note column on 
otes during rollout or rollback-safe reads

This is important for migrations and rollback-safe releases.

### `PATCH /api/walls/:wallId`

Updates wall metadata for the authenticated owner.

Accepted fields:

- `title?`
- `camera?`
- `lastColor?`

Camera constraints:

- `zoom` must be positive and not exceed `5`

### `POST /api/walls/:wallId/sync`

Upserts either an encrypted wall snapshot or the legacy normalized wall snapshot for the authenticated owner.

Accepted payload includes either:

- `secureSnapshot` for confidentiality-first sync
- or legacy plaintext fields such as `notes`
- `zones`
- `zoneGroups`
- `noteGroups`
- `links`
- `camera`
- `lastColor?`
- `clientSyncedAt?`

The route validates richer wall payloads, including:

- note kinds
- quote metadata
- canon payloads
- Eisenhower payloads
- currency note payloads
- vocabulary payloads
- zone kinds
- wiki links and other link types

The sync handler also normalizes finite `textSizePx` values into the persisted integer range `8-72` so older local snapshots do not fail cloud sync over fractional font sizes alone.

## Auth

All wall API routes require an authenticated user except published read-only snapshot usage, which is handled at the route/UI layer rather than through these API endpoints.

## Failure Modes

- invalid wall ids return `400`
- missing or unauthorized walls return `404`
- schema mismatches can trigger compatibility fallbacks in read paths
- malformed sync payloads return `400`
- database errors return `500`

## Related Docs

- `docs/features/confidential-workspace.md`
- `docs/architecture/overview.md`
- `docs/features/timeline-view.md`
- `docs/product/overview.md`


