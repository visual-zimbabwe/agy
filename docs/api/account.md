# Account API

## Purpose

This document describes the current account-related API surface used by settings, profile, and account-management flows.

## Scope

This is a current-state summary for routes under `src/app/api/account/`. It covers account settings, avatar upload, and account deletion.

## Route Groups

### Account Settings

#### `GET /api/account/settings`

Returns the authenticated user's stored account settings.

Current response:

- `settings: null` when no settings row exists
- or normalized `settings` with:
  - `startupBehavior`
  - `startupDefaultPage`
  - `autoTimezone`
  - `manualTimezone`
  - `keyboardColorSlots`
  - `wallLayoutPrefs`

The read path normalizes settings before returning them. Legacy `theme` and `controls_mode` columns may still exist in the database but are no longer exposed in the API after the unified light refactor.

#### `PUT /api/account/settings`

Upserts account settings for the authenticated user.

Accepted body includes:

- `startupBehavior`
- `startupDefaultPage`
- `autoTimezone`
- `manualTimezone`
- `keyboardColorSlots`
- `wallLayoutPrefs`

Current constraints:

- `startupDefaultPage` is `/wall` or `/decks`
- `keyboardColorSlots` must be an array of length 9

`theme` and `controlsMode` are **not** accepted. Saves succeed without them.

### Avatar Upload

#### `POST /api/account/avatar`

Uploads a profile image for the authenticated user.

Current behavior:

- accepts form-data field `file`
- only allows image MIME types
- enforces a 5 MB max size
- ensures public bucket `profile-images` exists
- stores file under `userId/timestamp-sanitized-name.ext`
- returns `avatarUrl` as an app-relative `/supabase/storage/...` path so profile images load on any device/origin through the Supabase proxy

Allowed MIME types are currently:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

### Account Deletion

#### `DELETE /api/account/delete`

Deletes the authenticated user through the Supabase admin path.

Current response:

- `{ ok: true }` on success

## Auth

All current account routes require an authenticated user.

## Failure Modes

- invalid settings bodies return `400`
- invalid avatar uploads return `400`
- oversized avatar uploads return `400`
- storage, database, or admin failures return `500`

## Related Docs

- `docs/features/settings.md`
- `docs/decisions/0004-unified-light-refactor.md`
