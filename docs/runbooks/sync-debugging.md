# Sync Debugging

## When to Use

Use this runbook when cloud-backed wall state is not loading, local and cloud state appear inconsistent, sync errors are shown in the wall UI, or a user reports that changes are not crossing devices as expected.

## Preconditions

- local access to the repo and running app
- ability to sign in as the affected user or reproduce with a test account
- access to Supabase tables and storage when cloud-side inspection is required
- understanding that published snapshot mode is read-only and should not be debugged as normal sync

## Steps

1. Confirm whether the problem is wall sync, page persistence, or file access.
   Wall sync issues typically involve `/wall`, `/api/walls`, or cloud merge behavior.

2. Check whether the user is in published snapshot mode.
   `src/app/wall/page.tsx` allows read-only snapshot access through the `snapshot` query parameter. In that mode the normal authenticated wall sync path is bypassed.

3. Reproduce with the browser console and network tab open.
   Look for failures on:
   - `GET /api/walls`
   - `POST /api/walls`
   - `GET /api/walls/:wallId`
   - `POST /api/walls/:wallId/sync`

4. Determine whether local wall data exists.
   The wall loads local IndexedDB snapshot state first through `loadWallSnapshot()` before cloud sync is attempted.

5. Determine whether cloud wall data exists.
   The app loads the user wall list first. If no wall exists, it creates one with title `My Wall` and then loads the snapshot.

6. Inspect the merge/import branch.
   Current behavior in `useWallPersistenceEffects` is:
   - if local has content and server is empty, the UI may prompt to import local data
   - otherwise server and local snapshots merge with last-write-wins rules
   - newer entities win by `updatedAt`
   - local camera wins after merge
   - local last color wins when present

7. If sync requests fail, inspect the returned error message.
   Common causes include:
   - auth failure
   - missing wall record
   - outdated database schema
   - server-side query or upsert errors

   Current expired-session behavior:
   - protected wall and settings API calls return `401`
   - the client redirects to `/login` instead of leaving the raw `Unauthorized` string in the wall sync UI
   - the login screen should show a short session-expired message before re-authentication

8. Check for compatibility fallback conditions in the wall API.
   Current wall read and sync handlers contain compatibility logic for missing:
   - `zones.kind`
   - richer note formatting columns
   - `notes.vocabulary`
   - `note_groups` table

9. If the problem is local-only corruption or drift, export and preserve current local state before destructive recovery.
   The wall supports JSON backup/export flows. Preserve user state before resets.

10. If needed, clear or reset local state only after confirming that the desired cloud snapshot is valid and recoverable.
    Local wall state lives in IndexedDB database `agy-db`.

11. Re-open the wall and verify:
    - local load completes
    - cloud wall id is established
    - snapshot fetch succeeds
    - subsequent edits schedule and complete sync without new errors

## Expected Outcome

The wall should load without sync errors, establish or reuse a cloud wall record, merge or import data correctly, and continue syncing subsequent edits.

## Escalation

Escalate when:

- the database schema is missing columns or tables required by the current release and compatibility paths are insufficient
- a cloud snapshot appears corrupted server-side
- local and cloud data both exist but expected ownership or merge behavior is unclear
- page file access failures suggest broader Supabase Storage issues rather than wall sync issues

## Related Docs

- `docs/api/walls.md`
- `docs/architecture/state-and-storage.md`
- `docs/architecture/overview.md`

