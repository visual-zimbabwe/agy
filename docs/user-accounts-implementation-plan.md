# Idea Wall Multi-User Implementation Plan

## Objective
Add user accounts so people can sign in and see the same wall data across sessions and devices, with full create/edit/delete support.

## Current State (already in repo)
- Frontend: Next.js App Router + TypeScript.
- Local state: Zustand.
- Local persistence: Dexie/IndexedDB (`src/features/wall/storage.ts`).
- No backend auth, no server database, no per-user isolation.

## Target Architecture
- Auth: Auth.js (NextAuth) with email/password (Credentials) in phase 1, optional OAuth in phase 2.
- Database: PostgreSQL (Neon/Supabase/RDS).
- ORM: Prisma.
- API: Next.js Route Handlers under `src/app/api/**`.
- Sync model: local-first cache (Dexie) + authenticated cloud source of truth.
- Ownership model: every wall-owned entity scoped by `userId` and `wallId`.

## Phase Plan

### Phase 0: Foundation and Infrastructure (1-2 days)
1. Add dependencies:
   - `next-auth`, `@auth/prisma-adapter`, `prisma`, `@prisma/client`, `bcryptjs`, `zod`.
2. Create env config:
   - `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.
3. Add Prisma schema and initial migration.
4. Add shared server utilities:
   - `src/lib/db.ts` (Prisma singleton)
   - `src/lib/auth.ts` (Auth.js config/helpers)

Definition of done:
- `npx prisma migrate dev` succeeds.
- App runs with DB connected.

### Phase 1: Authentication (2-3 days)
1. Implement Auth.js route in `src/app/api/auth/[...nextauth]/route.ts`.
2. Add user registration endpoint:
   - `POST src/app/api/register/route.ts`
   - Hash password with `bcryptjs`.
3. Add login/logout UI:
   - `src/app/login/page.tsx`
   - `src/app/signup/page.tsx`
   - Header actions for sign out and user identity.
4. Add route protection middleware for `/wall`.

Definition of done:
- User can sign up, login, logout.
- Unauthenticated users are redirected from `/wall` to `/login`.

### Phase 2: Cloud Data Model and APIs (3-4 days)
1. Add multi-tenant schema (see section below).
2. Build wall CRUD endpoints:
   - `GET/POST /api/walls`
   - `GET/PATCH/DELETE /api/walls/[wallId]`
3. Build batched sync endpoint for entities:
   - `POST /api/walls/[wallId]/sync` (upserts/deletes for notes/zones/zoneGroups/links/camera)
4. Enforce authorization in every handler using authenticated `userId`.
5. Add Zod request validation and normalized API errors.

Definition of done:
- Authenticated user can create wall and persist note graph to Postgres.
- User cannot read/write another user's wall.

### Phase 3: Client Sync Integration (3-5 days)
1. Keep Dexie as offline cache, but change boot sequence:
   - On login: fetch cloud wall, merge into local, hydrate store.
   - On local edits: debounce cloud sync (e.g., 1-2s) + keep local save.
2. Add sync metadata fields to local records (`updatedAt`, `deletedAt`, `dirty`).
3. Conflict policy v1:
   - Last-write-wins by `updatedAt`.
   - Server returns authoritative timestamps.
4. Add manual actions:
   - "Sync now"
   - "Last synced at"
   - "Sync error" banner + retry.

Definition of done:
- User logs in on another device and sees same wall.
- Offline edits sync when connection returns.

### Phase 4: Data Migration and Backward Compatibility (1-2 days)
1. One-time import flow for existing local-only users:
   - On first login, detect local Dexie data and prompt import.
   - Upload as a new wall.
2. Preserve existing local behavior for signed-out users (optional guest mode).

Definition of done:
- Existing local users can move data to cloud without manual export/import files.

### Phase 5: Hardening and Production Readiness (2-3 days)
1. Security:
   - Rate limit auth and sync endpoints.
   - Input validation everywhere.
   - CSRF/session config review.
2. Reliability:
   - Structured logging and error monitoring.
   - DB backup and restore procedure.
3. QA gates:
   - Lint + build.
   - Manual QA updates in `docs/qa.md` for auth + multi-device sync.

Definition of done:
- Stable production deploy with runbook and monitored error budget.

## Proposed Prisma Schema (v1)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  walls         Wall[]
}

model Wall {
  id            String   @id @default(cuid())
  userId        String
  title         String   @default("My Wall")
  cameraX       Float    @default(0)
  cameraY       Float    @default(0)
  cameraZoom    Float    @default(1)
  lastColor     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes         Note[]
  zones         Zone[]
  zoneGroups    ZoneGroup[]
  links         Link[]

  @@index([userId, updatedAt])
}

model Note {
  id            String   @id
  wallId        String
  text          String
  tags          Json
  textSize      String?
  x             Float
  y             Float
  w             Float
  h             Float
  color         String
  createdAt     DateTime
  updatedAt     DateTime
  deletedAt     DateTime?

  wall          Wall     @relation(fields: [wallId], references: [id], onDelete: Cascade)
  @@index([wallId, updatedAt])
}

model Zone {
  id            String   @id
  wallId        String
  label         String
  groupId       String?
  x             Float
  y             Float
  w             Float
  h             Float
  color         String
  createdAt     DateTime
  updatedAt     DateTime
  deletedAt     DateTime?

  wall          Wall     @relation(fields: [wallId], references: [id], onDelete: Cascade)
  @@index([wallId, updatedAt])
}

model ZoneGroup {
  id            String   @id
  wallId        String
  label         String
  color         String
  zoneIds       Json
  collapsed     Boolean
  createdAt     DateTime
  updatedAt     DateTime
  deletedAt     DateTime?

  wall          Wall     @relation(fields: [wallId], references: [id], onDelete: Cascade)
  @@index([wallId, updatedAt])
}

model Link {
  id            String   @id
  wallId        String
  fromNoteId    String
  toNoteId      String
  type          String
  label         String
  createdAt     DateTime
  updatedAt     DateTime
  deletedAt     DateTime?

  wall          Wall     @relation(fields: [wallId], references: [id], onDelete: Cascade)
  @@index([wallId, updatedAt])
}
```

## API Contract (v1)
- `POST /api/register`
  - Request: `{ email, password, name? }`
  - Response: `{ userId }`
- `GET /api/walls`
  - Response: list of walls for logged-in user
- `POST /api/walls`
  - Request: `{ title? }`
  - Response: created wall
- `GET /api/walls/:wallId`
  - Response: wall snapshot (camera + entities)
- `POST /api/walls/:wallId/sync`
  - Request: `{ notes, zones, zoneGroups, links, camera, lastColor, clientSyncedAt }`
  - Response: `{ serverSnapshot, serverTime }`

## Repository Changes (Expected)
- New files:
  - `prisma/schema.prisma`
  - `src/lib/db.ts`
  - `src/lib/auth.ts`
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/api/register/route.ts`
  - `src/app/api/walls/route.ts`
  - `src/app/api/walls/[wallId]/route.ts`
  - `src/app/api/walls/[wallId]/sync/route.ts`
  - `src/app/login/page.tsx`
  - `src/app/signup/page.tsx`
  - `middleware.ts`
- Updated files:
  - `src/components/WallCanvas.tsx` (hydrate/sync lifecycle)
  - `src/features/wall/storage.ts` (local cache + dirty metadata)
  - `src/features/wall/types.ts` (sync metadata)
  - `docs/qa.md` (auth/sync test cases)

## QA Checklist Additions
1. Signup, logout, login with same account.
2. Create notes on Device A, verify visible on Device B after sync.
3. Edit and delete notes, verify cross-device propagation.
4. Offline edit, reconnect, verify sync reconciliation.
5. Verify user isolation using two separate accounts.

## Delivery Milestones
1. Auth-only release (users can log in; still local wall).
2. Single-wall cloud sync release.
3. Multi-wall + migration wizard release.
4. Production hardening release.

## Risks and Decisions
- Conflict resolution complexity grows quickly; v1 should stay last-write-wins.
- Soft delete (`deletedAt`) is required for reliable sync.
- If guest mode remains, clearly separate guest local wall from account wall to avoid accidental overwrite.
