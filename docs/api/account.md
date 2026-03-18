# Account API

## Purpose

This document describes the current account-related API surface used by settings, profile, and account-management flows.

## Scope

This is a current-state summary for routes under `src/app/api/account/`. It covers account settings, avatar upload, and account deletion.

## Route Groups

### Account Settings

#### `GET /api/account/settings`

Returns the authenticated user’s stored account settings.

Current response:

- `settings: null` when no settings row exists
- or normalized `settings` with:
  - `theme`
  - `startupBehavior`
  - `startupDefaultPage`
  - `autoTimezone`
  - `manualTimezone`
  - `keyboardColorSlots`
  - `wallLayoutPrefs`
  - `controlsMode`

The read path normalizes settings before returning them.

#### `PUT /api/account/settings`

Upserts account settings for the authenticated user.

Accepted body includes:

- `theme`
- `startupBehavior`
- `startupDefaultPage`
- `autoTimezone`
- `manualTimezone`
- `keyboardColorSlots`
- `wallLayoutPrefs`
- `controlsMode`

Current constraints:

- `startupDefaultPage` is currently `/wall` or `/decks`
- `keyboardColorSlots` must be an array of length 9
- `controlsMode` is `basic` or `advanced`

### Avatar Upload

#### `POST /api/account/avatar`

Uploads a profile image for the authenticated user.

Current behavior:

- accepts form-data field `file`
- only allows image MIME types
- enforces a 5 MB max size
- ensures public bucket `profile-images` exists
- stores file under `userId/timestamp-sanitized-name.ext`
- returns `avatarUrl`

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
- `docs/contributing/development-workflow.md`
- `docs/architecture/state-and-storage.md`
