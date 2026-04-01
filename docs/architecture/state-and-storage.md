# State and Storage

## Purpose

This document explains how Agy stores and moves state across the wall, page, and cloud-backed parts of the product.

## Scope

This is a current-state architecture doc for persistence, normalization, merge behavior, and storage boundaries. It does not document every API response field in detail.

## Storage Domains

Agy currently uses multiple persistence layers:

- local IndexedDB for wall state
- local IndexedDB for page state
- local browser storage for some preference and migration flags
- local browser storage for currency note location/rate caches
- local browser storage for wall bookmark metadata cache entries keyed by normalized URL
- Supabase Postgres for cloud-backed records and snapshots
- Supabase Storage for page file uploads

These layers serve different purposes and should not be treated as interchangeable.

## Wall State

Canonical wall types live in `src/features/wall/types.ts`.

Persisted wall state includes:

- notes
- zones
- zone groups
- note groups
- links
- camera
- last color

Wall notes can also contain richer payloads such as:

- quote metadata
- canon payloads
- vocabulary review state
- Eisenhower payloads
- Joker card metadata via `noteKind`, note body text, and source fields
- Throne note metadata via `noteKind`, note body text, and source fields
- currency widget payloads for detected location, base currency, cached/live USD rate, trend, and converter state
- web bookmark payloads for normalized URLs, sanitized metadata, fetch status, cache timestamps, and retry state
- image URLs
- text formatting and visual flags
- private note ciphertext payloads for password-protected notes

### Local wall storage

Wall local persistence is implemented in `src/features/wall/storage.ts` using Dexie database `agy-db`.

On first load after the Agy rename, the app can migrate existing local wall data forward from the legacy `idea-wall-db` database when the new database is empty.

Local wall tables currently include:

- `notes`
- `zones`
- `zoneGroups`
- `noteGroups`
- `links`
- `meta`
- `timelineSnapshots`

The local wall layer also:

- debounces snapshot writes
- records timeline snapshots
- stores camera and last color in meta records
- normalizes old payloads through storage migration helpers
- preserves the permanent currency note and its last wall position inside normal wall snapshots
- keeps bookmark preview metadata in note payloads while a shared local cache avoids repeat metadata fetches for the same normalized URL during the 24 hour TTL window\n- uses a cache version bump to avoid reusing older domain-only bookmark preview entries after parser upgrades
- stores private note hidden payloads as ciphertext in persisted wall snapshots while unlock passwords remain in memory only for the active browser session

### Cloud wall storage

Cloud wall state is stored through `/api/walls` routes and normalized via helpers in `src/features/wall/cloud.ts`.

Important current behavior:

- the app loads local wall state first
- then loads or creates the remote wall record
- when multiple cloud wall records exist, `/wall` prefers the last successfully opened wall and otherwise falls back to the first wall with non-system content instead of blindly loading the newest mostly-empty wall
- then fetches the cloud snapshot
- then merges local and server state with a last-write-wins strategy for entity maps
- local camera wins during merge
- local last color wins when present
- currency note exchange-rate fetches are lazy, cached in local storage, and fall back to stale cache/default USD when live requests fail
- web bookmark preview fetches run through authenticated server routes that validate URLs, block private-network targets, follow a small redirect budget, and return only sanitized metadata JSON
- private notes sync through the normal wall snapshot pipeline as ciphertext plus harmless shell metadata; search and Markdown export exclude locked content

If local content exists and the server is empty, the UI can prompt the user to import local data into the cloud account.

## Page State

Canonical page types live in `src/features/page/types.ts`.

Persisted page state includes:

- `blocks`
- `camera`
- `updatedAt`

Blocks can also carry:

- rich text spans
- numbering state
- table data
- code block settings
- bookmark and embed metadata
- file metadata
- comments
- hierarchy and indentation state

### Local page storage

Page local persistence is implemented in `src/features/page/storage.ts` using Dexie database `agy-page-db`.

On first load after the Agy rename, the app can migrate existing local page data forward from the legacy `idea-wall-page-db` database when the new database is empty.

The current local page table is:

- `pageDocs`

Each row stores:

- `id`
- `snapshot`
- `updatedAt`

The page layer normalizes blocks when loading persisted snapshots so older or malformed data can degrade into valid page state instead of crashing the editor.

### Cloud page storage

Page cloud persistence is implemented both through direct Supabase browser access in `src/features/page/cloud.ts` and through server routes under `src/app/api/page/`.

The current cloud model stores page snapshots in `page_docs` keyed by:

- `owner_id`
- `doc_id`

Page file uploads are stored separately in Supabase Storage bucket `page-files`.

## Preferences and Auxiliary State

Not all state lives in the same persistence layer.

Examples of non-document state include:

- account settings
- startup route preferences
- wall layout preferences
- linked workspace state
- one-time migration or import flags in local storage

This state is operational UI state, not wall or page content state.

## Merge and Normalization Rules

### Wall

Wall merge behavior is explicitly defined in `mergeSnapshotsLww`.

Current rules:

- notes, zones, zone groups, note groups, and links merge by `updatedAt`
- the newer entity wins per id
- local camera replaces server camera after merge
- local last color overrides server last color when present

### Page

Page persistence does not currently expose the same explicit entity-level merge helper. Instead, snapshots are loaded and saved as whole document payloads.

## Constraints

- IndexedDB schemas evolve through explicit versioning and migration helpers.
- Cloud schema rollout is not assumed to be perfectly synchronized; some API paths contain compatibility fallbacks for missing columns or tables.
- File storage is separate from snapshot storage.
- Published wall snapshots are read-only and should not re-enter normal persistence flows as editable state.

## Failure Modes

- old local payloads may require normalization
- remote schema drift can disable newer fields
- local and cloud wall state can diverge and require merge or import decisions
- page file signing or bucket availability failures can break media access even when page snapshots still load

## Related Docs

- `docs/architecture/overview.md`
- `docs/api/walls.md`
- `docs/api/page.md`
- `docs/runbooks/sync-debugging.md`






