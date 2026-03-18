# Timeline View

## Purpose

Timeline view gives wall users a time-oriented way to review how a wall has changed instead of only navigating it spatially.

## Scope

This document covers the current wall timeline behavior, the user value it provides, and its important constraints. It does not document every UI detail of the surrounding wall chrome.

## Behavior

Timeline view is a wall-specific mode that presents wall changes as a horizontal review surface.

Current capabilities include:

- toggling into timeline mode from the wall workspace
- reviewing wall changes over time
- navigating through timeline-oriented cards and detail surfaces
- pairing with related review affordances such as heatmap and playback-style workflows

The wall toolbar exposes timeline access directly, which makes the timeline a first-class wall mode rather than a secondary export or debug feature.

## Data and State

Timeline behavior depends on persisted wall snapshots and derived review data rather than a separate document model.

Relevant wall concepts:

- persisted wall snapshot state
- timestamps on notes and related entities
- camera state
- timeline entries loaded from wall persistence helpers

Timeline view is downstream of wall persistence; it is not a separate storage domain.

## Edge Cases

- Published read-only wall snapshots still need clear read-only behavior around review actions.
- Timeline state must stay coherent when the wall has sparse history or very recent changes.
- Large walls and dense history can create UI and performance pressure if review surfaces become too heavy.

## Limitations

- Timeline is currently documented as part of the wall experience, not as an isolated route or subsystem.
- The repo does not yet have a dedicated architecture doc for timeline storage and snapshot derivation.

## Related Docs

- `docs/product/overview.md`
- `docs/architecture/overview.md`
- `docs/api/walls.md`
- `docs/qa.md`
