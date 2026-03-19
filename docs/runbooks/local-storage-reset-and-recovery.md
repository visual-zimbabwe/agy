# Local Storage Reset and Recovery

## When to Use

Use this runbook when local workspace state appears corrupted, stale, or unusable and normal reload does not recover the expected content.

## Preconditions

- access to the affected machine and browser profile
- ability to verify whether the desired state exists in cloud-backed storage before clearing local data
- awareness that local resets can remove unsynced work

## Steps

1. Identify which local store is affected.
   Current local databases include:
   - wall: `agy-db`
   - page: `agy-page-db`

2. Determine whether the issue is local-only or also present in cloud-backed data.
   Check whether the same problem reproduces after sign-in on another machine or clean browser profile.

3. Preserve recoverable local state before clearing anything.
   For wall issues, export a JSON backup if the workspace can still load far enough to do so.

4. Check whether the desired data exists remotely.
   Relevant cloud-backed areas include:
   - walls and wall snapshots
   - page docs
   - account settings
   - page file storage

5. If the issue is wall-specific, inspect whether the problem may be timeline or merge related rather than raw local corruption.
   Wall local storage also includes timeline snapshots and meta records.

6. Clear local state only after deciding which source of truth should win.
   The decision should generally be one of:
   - keep local and recover from backup
   - discard local and rehydrate from cloud
   - export local first, then reset and compare

7. After reset, reload the relevant route and verify rehydration behavior.
   For wall:
   - local load should start empty or normalized
   - cloud wall should be fetched or created
   - sync errors should clear if the issue was local-only

   For page:
   - the editor should rebuild from cloud snapshot or start clean for the target doc id

8. Re-apply settings only if needed.
   After the rename, some preferences may be transparently copied from legacy `idea-wall-*` browser keys into new `agy-*` keys on first read.
   Some preferences are locally cached even when account settings also exist remotely.

## Expected Outcome

The affected workspace should reload into a coherent local state and, when applicable, reconcile correctly with cloud-backed records.

## Escalation

Escalate when:

- local reset does not resolve the issue
- the cloud snapshot appears wrong or corrupted
- the user has unsynced local work that cannot be safely discarded
- page files or account settings appear inconsistent with the restored content state

## Related Docs

- `docs/runbooks/sync-debugging.md`
- `docs/architecture/state-and-storage.md`
- `docs/api/walls.md`
- `docs/api/page.md`


