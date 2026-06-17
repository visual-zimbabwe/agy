# Page API

## Purpose

This document describes the current page-related API surface used by the `/page` editor and related file and preview workflows.

## Scope

This is a current-state contract summary for routes under `src/app/api/page/`. It covers page document listing, page snapshot load/save, file upload, file deletion, and signed file URLs.

## Route Groups

### Page Documents

#### `GET /api/page/docs`

Returns the authenticated user’s page documents ordered by most recently updated.

Current response:

- `docs`: array of objects with `docId` and `updatedAt`

#### `GET /api/page/docs/:docId`

Returns a single page document for the authenticated owner.

Current response:

- `doc: null` when not found
- or `doc` with:
  - `docId`
  - `snapshot`
  - `updatedAt`
  - `createdAt`

`docId` is validated as a non-empty trimmed string up to 120 characters.

#### `PUT /api/page/docs/:docId`

Upserts a page snapshot for the authenticated owner.

Accepted body:

- `snapshot`

The route does not enforce the full page schema at the HTTP boundary. It accepts unknown snapshot payloads and relies on page-side normalization when loaded later.

Current success response:

- `doc` with `docId` and `updatedAt`

### Page Files

#### `POST /api/page/files`

Uploads one or more files for the authenticated user.

Current behavior:

- ensures private Supabase Storage bucket `page-files` exists
- stores files under `userId/timestamp-index-sanitized-name.ext`
- returns uploaded file metadata with:
  - `path`
  - `name`
  - `size`
  - `mimeType`

#### `DELETE /api/page/files`

Deletes a previously uploaded file.

Accepted body:

- `path`

The path must belong to the authenticated user namespace.

#### `POST /api/page/files/sign`

Creates a signed file URL for a previously uploaded file.

Accepted body:

- `path`

Current behavior:

- validates that the path belongs to the authenticated user
- signs the URL for one hour
- returns `signedUrl`

## Auth

All current page API routes require an authenticated user.

## Constraints

- Page document persistence currently stores whole snapshots rather than field-level patches.
- Page file storage is private and depends on signed URL generation.
- Page bookmark preview now uses the shared bookmark route at `GET /api/bookmarks/preview`.

## Failure Modes

- invalid doc ids return `400`
- invalid file paths return `400`
- missing auth returns the shared auth response path
- storage and database failures return `500`

## Related Docs

- `docs/features/page-editor.md`
- `docs/architecture/state-and-storage.md`
- `docs/architecture/overview.md`
