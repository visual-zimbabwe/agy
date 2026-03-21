# 0002 Confidential Workspace Migration

## Status
Accepted

## Context

Agy previously stored wall and page snapshots in plaintext local storage and plaintext cloud records, and it also supported URL-based public snapshot sharing.

That model was not strong enough for a confidentiality-first promise.

## Decision

Adopt a compatibility-first confidentiality migration.

- require a client-side passphrase before normal wall and page persistence begins
- encrypt wall snapshots, page snapshots, and wall timeline history client-side
- sync ciphertext snapshots to the cloud when the secure schema is available
- export encrypted wall backups by default
- disable public snapshot sharing
- keep legacy plaintext readers in place during migration so existing user data is not lost

## Alternatives Considered

### Immediate destructive rewrite

Rejected because it risked user data loss during migration and provided no rollback path.

### Leave plaintext sync in place and market privacy improvements only

Rejected because it would not meet a credible confidentiality standard.

## Consequences

### Benefits

- new local and cloud snapshot writes avoid plaintext storage
- backup/export defaults align better with confidentiality goals
- existing user data remains recoverable during the migration window

### Costs

- old plaintext copies are still present until an explicit cleanup phase ships
- users must manage a passphrase
- secure sharing and file encryption remain follow-up work
