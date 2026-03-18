# 0001 Local-First with Cloud Sync

## Status
Accepted

## Context

Idea-Wall needs to feel fast during capture, editing, movement, and review. The product also needs account-backed continuity across devices and sessions.

A cloud-only interaction model would put core workspace behavior behind network and backend availability. A purely local model would make signed-in continuity, recovery, and multi-device use much weaker.

This tradeoff affects the wall, page editor, settings, and supporting storage model.

## Decision

Use a local-first architecture with cloud-backed sync.

Current implementation direction:

- use IndexedDB-backed local persistence for core wall and page content
- load local state first in the client
- use Supabase for authenticated cloud records, snapshots, settings, and file storage
- merge wall state between local and cloud when needed
- keep published snapshot flows read-only

## Alternatives Considered

### Cloud-first only

Rejected because it would increase interaction latency, reduce resilience when offline or degraded, and make capture quality too dependent on network conditions.

### Local-only with optional export/import

Rejected because it would weaken account continuity, recovery, and device-to-device use too much for the current product direction.

## Consequences

### Benefits

- fast local interaction for wall and page workspaces
- better resilience during network or backend issues
- account-backed continuity for signed-in users
- clearer recovery paths through local snapshots, cloud snapshots, and exports

### Costs

- more complex persistence and merge behavior
- need for compatibility logic during schema rollout
- more operational debugging around local/cloud divergence
- more documentation burden around storage and sync behavior

### Follow-on Constraints

- storage and sync behavior must be documented clearly
- local reset actions must be treated carefully
- schema evolution needs compatibility-aware handling where possible
- contributors must treat persistence changes as documentation-impacting changes
