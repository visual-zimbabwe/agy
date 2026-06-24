# Decks

## Purpose

The decks workspace gives Agy a standalone structured study and review surface for spaced repetition. Decks shares auth, header navigation, settings, and design tokens with Wall but does not import from or sync with wall notes.

## Scope

This document covers the `/decks` product surface and major workflows visible in the codebase.

## Behavior

The decks workspace is mounted at `/decks` (redirects to `/decks/decks`) and requires an authenticated user.

### Navigation

- **Header:** Shared Agy chrome with Wall · Decks · Timeline links, settings gear, and profile menu (Help, Settings, Sign out).
- **View tabs:** Decks · Browse · Stats · Study — each is a route under `/decks/*`.
- **Library sidebar:** Nested deck tree with create-deck controls on all main views.

Settings open in a modal from the header gear (same `SettingsWorkspace` content as `/settings`). Help opens from the profile menu.

### Workflows

| Area | Route | Behavior |
|------|-------|----------|
| Deck overview | `/decks/decks` | Counts, sub-deck table, launch study/browse/stats |
| Browse | `/decks/browse` | Search, inspect cards, flag/suspend, bulk actions |
| Stats | `/decks/stats` | Forecast, maturity, retention summaries |
| Study | `/decks/study` | Due queue, reveal answer, Again/Hard/Good/Easy ratings |
| Custom study | Study view modal | Filtered sessions, tag filters, limit overrides |
| Add note | Header action | Note-type template, tags, deck placement |
| Import | Header action | CSV/TXT import with column mapping and presets |

Deck note creation blocks exact duplicates within the same deck and note type (normalized field content; tags excluded from duplicate detection).

Study uses the existing deck APIs including FSRS scheduling when enabled per deck (Options modal on Study overview).

### Standalone rules

- No import from Wall or wall `note_id` coupling in UI.
- No BroadcastChannel or cross-window presence with Wall.
- Existing `deck_cards` rows are kept; wall provenance is not shown.

## Data and State

Deck behavior uses server APIs (`/api/decks/*`) for decks, note types, cards, stats, custom study, and scheduling (`scheduler_mode`, `fsrs_params`).

Client state is per-view with shared deck library context from `DecksChrome`.

## Edge Cases

- Deck APIs tolerate partial scheduler schema rollout (`fsrsAvailable` flag).
- Nested decks affect study when `includeChildren` is used (default on browse/study).
- Custom study with `preview_new` does not reschedule cards unless explicitly enabled.

## Limitations

- Stats activity lattice is illustrative until review-history heatmap data is wired.
- No dedicated `docs/architecture/decks-data-model.md` yet.

## Related Docs

- `docs/product/overview.md`
- `docs/api/decks.md`
- `docs/qa.md`
- `docs/product/unified-agy-refactor-plan.md`
