# Settings

## Purpose

This document describes the current settings surface and the kinds of user preferences it owns.

## Scope

This covers the `/settings` route and the embedded settings experience used from other parts of the product.

## Behavior

The settings workspace is authenticated and currently organized into four sections:

- `general`: profile and identity
- `appearance`: theme, startup, and timezone behavior
- `keyboard`: keyboard color slots
- `advanced`: wall workspace chrome and control density

The settings surface can be used as a full route and can also be embedded in wall-adjacent UI.

## Current Settings Areas

### Account and Profile

Current account-related behavior includes:

- preferred name
- profile photo upload and crop flow
- email display
- password update flow
- logout and account-level actions
- MFA-related state

### Appearance and Startup

Current appearance and startup settings include:

- theme preference
- startup behavior
- startup default page
- timezone mode and manual timezone

The startup default page currently includes wall, page, decks, and settings destinations.

### Keyboard

Current keyboard settings include:

- configurable keyboard color slots

### Workspace Settings

Current workspace settings include:

- wall layout preferences
- controls mode (`basic` or `advanced`)

These settings affect how much wall chrome and advanced tooling the user sees.

## Data and State

Settings draw from both local preference reads and cloud-backed account settings.

Current behavior includes:

- local preference initialization
- fetch from `/api/account/settings`
- save through `/api/account/settings`
- local persistence of normalized account settings after successful save

## Edge Cases

- If settings cannot be loaded from the server, the UI can continue using local settings.
- Avatar upload and crop is its own interaction flow and can fail independently from other settings.
- Embedded settings need to remain usable without assuming full-page navigation context.

## Limitations

- Settings currently spans personal profile, workspace behavior, and wall chrome preferences in one surface.
- The current doc set does not yet include a dedicated API contract doc for account settings and avatar management.

## Related Docs

- `docs/product/overview.md`
- `docs/contributing/development-workflow.md`
- `docs/qa.md`
