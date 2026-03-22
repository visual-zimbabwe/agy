# Confidential Workspace

## Purpose

This document describes the current confidentiality-first workspace model for wall and page content.

## Confidentiality Promise

Wall snapshots, page snapshots, and uploaded page files are encrypted client-side before they are persisted locally or synced to the cloud, and the passphrase is kept only for the active unlocked session.

## Scope

This covers workspace unlock, local persistence, cloud snapshot sync, encrypted backups, encrypted page file handling, and migration behavior for existing plaintext data.

## Current Behavior

- Wall and page routes require a passphrase before normal persistence starts.
- The client creates or unlocks a confidential workspace passphrase and keeps it only in memory for the active session.
- Passphrase creation includes a local show or hide control so users can verify what they typed before locking the workspace.
- Existing confidential workspaces must be unlocked with their current passphrase; passphrase rotation is not yet supported.
- Local wall snapshots, wall timeline history, and page snapshots are written as encrypted payloads after unlock.
- Cloud wall sync stores an encrypted snapshot on the `walls` row when the latest migration is present.
- Cloud page sync stores an encrypted snapshot on the `page_docs` row when the latest migration is present.
- Page file uploads are encrypted client-side before they are stored in Supabase Storage, and the browser decrypts them only after a signed URL is resolved during an unlocked session.
- Encrypted wall backup export is the default backup path.
- Public snapshot sharing is disabled for confidential workspaces.
- PNG, PDF, and Markdown exports remain available, but the UI warns that they create readable copies outside the encrypted workspace.

## Plaintext and Ciphertext Boundaries

Plaintext exists in:

- active browser memory during an unlocked session
- readable exports that the user explicitly confirms, such as PNG, PDF, Markdown, or legacy backups imported from older versions
- legacy local or cloud records that existed before migration and have not yet been cleaned up

Ciphertext exists in:

- local wall snapshot storage
- local wall timeline history
- local page snapshot storage
- encrypted wall cloud snapshots
- encrypted page cloud snapshots
- encrypted page file objects in Supabase Storage
- encrypted wall backup exports

## Migration and Recovery

The migration is compatibility-first.

- Existing plaintext local and cloud snapshots remain readable.
- When the workspace is unlocked, the client creates encrypted copies alongside the legacy data.
- Wall plaintext fallback rows are cleared after a secure local snapshot is written successfully.
- Page cloud plaintext snapshot fields are cleared when encrypted snapshot sync succeeds.
- Older plaintext records that predate the migration can still remain until each workspace is opened and re-saved through the secure path.
- Legacy readers remain in place so the app can recover if encrypted state is missing or the latest schema has not been applied yet.
- Forgotten passphrases are not recoverable by the server.

## Threat Model Notes

Threats addressed by the current implementation:

- local disk disclosure from normal workspace persistence after migration
- cloud database disclosure for newly encrypted wall and page snapshots
- Supabase Storage disclosure for newly uploaded page files
- accidental content leaks through URL snapshot publishing
- persistent plaintext backup exports by default

Threats still requiring explicit follow-up work:

- cleanup of pre-migration plaintext cloud and local records that have not yet been reopened and re-saved
- encryption of other binary asset classes outside the current page upload flow
- richer secure sharing flows such as recipient-encrypted collaboration
- stronger metadata minimization for titles, ids, and operational records

## Related Docs

- `docs/architecture/state-and-storage.md`
- `docs/api/walls.md`
- `docs/features/published-snapshots.md`
- `docs/qa.md`

