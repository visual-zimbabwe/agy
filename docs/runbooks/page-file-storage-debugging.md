# Page File Storage Debugging

## When to Use

Use this runbook when page file upload, deletion, signed URLs, or bookmark-style file access is failing in the `/page` workspace.

## Preconditions

- access to the running app and browser devtools
- ability to reproduce with an authenticated user
- access to Supabase Storage and relevant project settings when server-side inspection is required

## Steps

1. Identify which page file flow is failing.
   Common paths include:
   - upload through `POST /api/page/files`
   - delete through `DELETE /api/page/files`
   - signed URL fetch through `POST /api/page/files/sign`
   - bookmark preview through `GET /api/bookmarks/preview`

2. Confirm authentication state.
   All current page file routes require an authenticated user.

3. Check the network tab for the failing request.
   Capture:
   - route
   - status code
   - returned error payload
   - request body shape

4. For upload issues, verify the file is actually being submitted as multipart form-data with `files` entries.
   The current upload route rejects empty submissions.

5. Check Supabase Storage bucket state.
   The current page file upload path expects bucket `page-files` and creates it when missing.

6. Validate user ownership in path-based operations.
   Current delete and sign routes require the file path to begin with the authenticated user id prefix.

7. For signed URL failures, confirm the target file exists at the expected storage path.
   The signing route does not repair missing files; it only signs valid user-owned paths.

8. For bookmark preview failures, confirm the issue is really file storage and not upstream metadata fetch.
   `GET /api/bookmarks/preview` can fail due to invalid URL, unsupported protocol, timeout, or upstream fetch failure.

9. If upload succeeds but the page block still fails, inspect the page block payload.
   Page snapshots store file metadata separately from the actual stored object, so broken metadata can cause apparent file failures even when storage succeeded.

10. Re-test the flow end to end.
    Verify:
    - upload returns file metadata
    - page block stores the expected path and display metadata
    - signed URL returns successfully
    - delete removes the object when requested

## Expected Outcome

The page workspace should be able to upload, reference, sign, and delete user-owned files consistently.

## Escalation

Escalate when:

- the storage bucket cannot be created or accessed
- user-owned paths are being rejected unexpectedly
- signed URLs fail for existing files
- the problem appears to be broader Supabase Storage or auth failure rather than page-specific behavior

## Related Docs

- `docs/api/page.md`
- `docs/architecture/state-and-storage.md`
- `docs/features/page-editor.md`
