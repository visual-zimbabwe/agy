# Settings

## Purpose

This document describes the current settings surface and the kinds of user preferences it owns.

## Scope

This covers the `/settings` route and the embedded settings modal opened from the wall header gear icon.

## Behavior

The settings workspace is authenticated and organized into three sections:

- **Account**: profile and identity
- **Preferences**: startup, timezone, and keyboard color slots
- **Workspace**: wall chrome (context bar, tags on cards, pin details panel, replay tour)

The app is **light-only**; theme preference was removed in the Phase 1 unified refactor.

The settings surface can be used as a full route (`/settings`) and as a modal overlay on `/wall`.

## Current Settings Areas

### Account and Profile

- preferred name
- profile photo upload and crop flow
- email display
- password update flow
- logout and account-level actions
- MFA-related state

### Preferences

- startup behavior (`continue_last` or `default_page`)
- startup default page (`/wall`, `/decks`, `/settings`)
- timezone mode and manual timezone
- configurable keyboard color slots

### Workspace

- show context bar on note selection (default on)
- show tags on note cards
- pin details panel open
- replay wall product tour (embedded modal only)

## Data and State

Settings draw from both local preference reads and cloud-backed account settings.

- local preference initialization
- fetch from `/api/account/settings`
- save through `/api/account/settings`
- local persistence of normalized account settings after successful save

The account API no longer accepts `theme` or `controls_mode`; existing rows are normalized to light theme and basic controls on save.

## Edge Cases

- If settings cannot be loaded from the server, the UI can continue using local settings.
- Avatar upload and crop can fail independently from other settings.
- Embedded settings remain usable without full-page navigation.

## Limitations

- Decks still uses legacy chrome until Phase 3 rebuild; workspace settings apply primarily to Wall.

## Related Docs

- `docs/product/overview.md`
- `docs/api/account.md`
- `docs/qa.md`
