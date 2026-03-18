# Idea Wall Multi-User Implementation Plan (Supabase)

## Objective
Add user accounts so people can sign in and see the same wall data across sessions and devices, with full create/edit/delete support.

## Current State (already in repo)
- Frontend: Next.js App Router + TypeScript.
- Local state: Zustand.
- Local persistence: Dexie/IndexedDB (`src/features/wall/storage.ts`).
- No backend auth, no server database, no per-user isolation.

## Target Architecture
- Platform: Supabase (PostgreSQL + Auth + Row Level Security).
- Auth: Supabase Auth (email/password in v1, optional OAuth later).
- DB access: `@supabase/supabase-js` + `@supabase/ssr`.
- API: Next.js Route Handlers under `src/app/api/**` for sync orchestration/business rules.
- Sync model: local-first cache (Dexie) + cloud source of truth per authenticated user.
- Ownership model: every wall-owned entity scoped by `owner_id` and `wall_id`.

## Supabase Project Setup
1. Create Supabase project.
2. Enable Email auth provider.
3. Configure Auth URL settings:
   - Site URL
   - Redirect URLs for local and production
4. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
5. Create SQL migration for tables, indexes, and RLS policies.

Definition of done:
- Supabase project reachable from local app.
- Sign-in works with email/password.

## Phase Plan

### Phase 0: Foundation and Infra (1-2 days)
1. Add dependencies:
   - `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
2. Add Supabase clients:
   - `src/lib/supabase/client.ts` (browser client)
   - `src/lib/supabase/server.ts` (server client with cookies)
   - `src/lib/supabase/admin.ts` (service role; only when absolutely needed)
3. Add DB migration files under `supabase/migrations`.
4. Add typed DB interfaces for app code.

Definition of done:
- Local app can read authenticated session.
- Migrations apply successfully.

### Phase 1: Authentication (2-3 days)
1. Build auth pages:
   - `src/app/login/page.tsx`
   - `src/app/signup/page.tsx`
2. Add auth actions/endpoints for sign up/sign in/sign out.
3. Protect `/wall` route using session check in middleware or server components.
4. Add account UI in header (email + sign out).

Definition of done:
- User can sign up, sign in, sign out.
- Unauthenticated users are redirected from `/wall` to `/login`.

### Phase 2: Cloud Data Model + RLS + APIs (3-4 days)
1. Add multi-tenant tables (see SQL model below).
2. Enable RLS on all user-owned tables.
3. Add policies so authenticated users can only access rows where `owner_id = auth.uid()`.
4. Build API endpoints:
   - `GET/POST /api/walls`
   - `GET/PATCH/DELETE /api/walls/[wallId]`
   - `POST /api/walls/[wallId]/sync`
5. Validate payloads with Zod and return normalized errors.

Definition of done:
- Authenticated user can persist wall graph to Supabase Postgres.
- Cross-account access is blocked by RLS and endpoint checks.

### Phase 3: Client Sync Integration (3-5 days)
1. Keep Dexie as offline cache, but change boot sequence:
   - On login: fetch cloud snapshot, merge into local, hydrate store.
   - On local edits: debounce cloud sync (1-2s) while continuing local saves.
2. Add sync metadata to records (`updatedAt`, `deletedAt`, `dirty`).
3. Conflict policy v1:
   - Last-write-wins by server-normalized `updated_at`.
4. Add sync UX:
   - "Sync now" button
   - "Last synced" indicator
   - Error banner with retry.

Definition of done:
- User logs in on another device and sees same wall.
- Offline edits sync after reconnect.

### Phase 4: Local Data Migration (1-2 days)
1. On first login, detect local Dexie data and prompt import.
2. Upload local snapshot into a new cloud wall.
3. Mark migration complete to avoid duplicate imports.

Definition of done:
- Existing local-only users can migrate without manual file export/import.

### Phase 5: Hardening and Production Readiness (2-3 days)
1. Security:
   - Keep service role key out of client bundle.
   - Rate limit auth-adjacent and sync APIs.
   - Validate all payloads.
2. Reliability:
   - Error tracking and structured logs.
   - Backup and restore test using Supabase backup workflow.
3. QA gates:
   - `npm run lint`
   - `npm run build`
   - Update `docs/qa.md` with auth + sync scenarios.

Definition of done:
- Stable production deployment with runbook.

## Proposed SQL Data Model (Supabase Postgres v1)
```sql
create table public.walls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Wall',
  camera_x double precision not null default 0,
  camera_y double precision not null default 0,
  camera_zoom double precision not null default 1,
  last_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  tags jsonb not null default '[]'::jsonb,
  text_size text,
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.zones (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  group_id text,
  x double precision not null,
  y double precision not null,
  w double precision not null,
  h double precision not null,
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.zone_groups (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color text not null,
  zone_ids jsonb not null default '[]'::jsonb,
  collapsed boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.links (
  id text primary key,
  wall_id uuid not null references public.walls(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_note_id text not null,
  to_note_id text not null,
  type text not null,
  label text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index idx_walls_owner_updated on public.walls(owner_id, updated_at desc);
create index idx_notes_wall_updated on public.notes(wall_id, updated_at desc);
create index idx_zones_wall_updated on public.zones(wall_id, updated_at desc);
create index idx_zone_groups_wall_updated on public.zone_groups(wall_id, updated_at desc);
create index idx_links_wall_updated on public.links(wall_id, updated_at desc);
```

## RLS Policies (required)
Apply to: `walls`, `notes`, `zones`, `zone_groups`, `links`.

- Enable RLS on all tables.
- Read policy: allow `select` when `owner_id = auth.uid()`.
- Insert policy: allow `insert` when `owner_id = auth.uid()`.
- Update policy: allow `update` when `owner_id = auth.uid()`.
- Delete policy: allow `delete` when `owner_id = auth.uid()`.

For child tables, optionally also enforce wall ownership join check.

## API Contract (v1)
- `GET /api/walls`
  - Response: list of walls for current session user.
- `POST /api/walls`
  - Request: `{ title? }`
  - Response: created wall.
- `GET /api/walls/:wallId`
  - Response: wall snapshot (camera + entities).
- `PATCH /api/walls/:wallId`
  - Request: wall metadata updates (title/camera/lastColor).
- `DELETE /api/walls/:wallId`
  - Soft-delete optional in v1, hard-delete acceptable for MVP.
- `POST /api/walls/:wallId/sync`
  - Request: `{ notes, zones, zoneGroups, links, camera, lastColor, clientSyncedAt }`
  - Response: `{ serverSnapshot, serverTime }`.

## Repository Changes (Expected)
- New files:
  - `supabase/migrations/*` (schema + RLS)
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts` (optional)
  - `src/app/login/page.tsx`
  - `src/app/signup/page.tsx`
  - `src/app/api/walls/route.ts`
  - `src/app/api/walls/[wallId]/route.ts`
  - `src/app/api/walls/[wallId]/sync/route.ts`
  - `middleware.ts` (if used for route guard)
- Updated files:
  - `src/components/WallCanvas.tsx` (cloud hydrate/sync lifecycle)
  - `src/features/wall/storage.ts` (local cache + dirty metadata)
  - `src/features/wall/types.ts` (sync metadata)
  - `docs/qa.md` (auth/sync test cases)

## QA Checklist Additions
1. Sign up, sign out, sign in with same account.
2. Create notes on Device A, verify on Device B after sync.
3. Edit/delete notes and confirm cross-device propagation.
4. Offline edit then reconnect; confirm successful reconciliation.
5. Verify account isolation with two users.
6. Verify RLS by attempting direct access to another user's wall row (must fail).

## Delivery Milestones
1. Auth and protected `/wall` release.
2. Single-wall cloud sync release.
3. Multi-wall + migration wizard release.
4. Production hardening release.

## Risks and Decisions
- Conflict resolution complexity grows fast; v1 uses last-write-wins.
- Soft delete (`deleted_at`) is strongly recommended for robust sync.
- Guest mode must be isolated from account-backed walls to avoid accidental overwrite.
- Service role key usage should be minimized and server-only.
