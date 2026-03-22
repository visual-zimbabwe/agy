# Published Snapshots

## Purpose

This document describes the current read-only published snapshot workflow for wall content.

## Scope

This covers URL-based wall snapshot publishing and the behavioral differences between normal wall mode and published snapshot mode.

## Behavior

Published snapshots are generated from the current persisted wall state and encoded into the URL.

Current flow:

- take the current wall snapshot
- compress and encode it into the `snapshot` query parameter
- build a `/wall?snapshot=...` URL
- copy the URL to the clipboard or prompt for manual copy

The current implementation uses compressed URL encoding, not a server-stored published snapshot record.

## Read-Only Behavior

When `/wall` is loaded with a `snapshot` query parameter:

- the route bypasses the normal auth gate
- the wall can load without a signed-in user
- the experience is read-only
- normal authenticated cloud sync should not be treated as active for this mode

Published snapshots are for viewing and sharing, not editing.

## Data and Storage

Published snapshots currently use:

- serialized `PersistedWallState`
- compressed URL encoding through `lz-string`
- client-side URL generation

This means the snapshot is self-contained in the URL rather than stored as a separate server object.

## Edge Cases

- invalid or malformed snapshot parameters must degrade safely
- published snapshots need to avoid entering normal editable persistence flows
- large walls can create large encoded URLs, which constrains this publishing model

## Limitations

- snapshots are URL-backed rather than server-backed
- the current model is suitable for read-only sharing, not collaborative publishing
- long or complex snapshots may pressure URL length and practical shareability

## Related Docs

- `docs/api/walls.md`
- `docs/runbooks/sync-debugging.md`
- `docs/architecture/state-and-storage.md`
