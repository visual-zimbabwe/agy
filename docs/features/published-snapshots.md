# Published Snapshots

## Purpose

This document describes the current public-sharing behavior for wall content.

## Scope

This covers the status of the former URL-based published snapshot workflow.

## Current Behavior

Public snapshot publishing is disabled for confidential workspaces.

The previous implementation encoded an entire wall snapshot into a `snapshot` query parameter. That workflow is no longer offered from the export surface because it exposed readable wall content in URLs, browser history, clipboard history, and other secondary surfaces.

## Allowed Alternatives

Current sharing-safe behavior is limited to:

- encrypted wall backup export
- local readable exports that require explicit user confirmation

There is no public read-only link workflow for confidential wall content.

## Migration Note

Older `snapshot` URLs may still be readable by existing route logic, but they should be treated as legacy behavior and not as an approved confidentiality feature.

## Related Docs

- `docs/features/confidential-workspace.md`
- `docs/architecture/state-and-storage.md`
