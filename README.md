# Agy

Agy is a local-first visual thinking workspace built with Next.js, React, and TypeScript.

The current product includes:

- `/wall`: infinite spatial canvas for notes, links, grouping, search, timeline review, export, and published snapshots
- `/page`: block-based infinite document canvas for structured writing, embeds, uploads, and comments
- `/decks`: study workspace for decks, cards, browsing, review sessions, and stats
- `/settings`: account and workspace preferences
- `/help`: route-based help library and support entry point

Local state is stored in IndexedDB with Dexie. Signed-in and cloud-backed flows use Supabase for authentication, storage, and account-scoped data.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- Supabase project for authenticated and cloud-backed flows

### Install

```bash
npm install
```

The repo includes `.nvmrc` to pin the expected Node.js major version.

### Environment

Copy `.env.example` to `.env.local` and provide the required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=/supabase
SUPABASE_SERVER_URL=http://localhost:18000
SUPABASE_PROXY_TARGET=http://localhost:18000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
CURRENCY_API_KEY=your-currencyapi-com-api-key
# or, if you already use CurrencyAPI naming
CURRENCYAPI_API_KEY=your-currencyapi-com-api-key
```

`NEXT_PUBLIC_SUPABASE_URL=/supabase` keeps browser traffic same-origin, so remote users only need access to the `agy` app URL. Server-side routes still talk directly to the local Supabase API through `SUPABASE_SERVER_URL`.

### Local Supabase

The repository includes `supabase/config.toml` and checked-in migrations under `supabase/migrations/`.

Start the local stack with:

```bash
npx supabase@latest start
```

Useful local endpoints after startup:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

This runs a local Docker-backed Supabase instance for development only. It does not modify the hosted project unless you explicitly run remote-targeting commands.

### Run

```bash
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/wall`
- `http://localhost:3000/page`
- `http://localhost:3000/decks`
- `http://localhost:3000/settings`
- `http://localhost:3000/help`

Authenticated routes redirect to `/login` when no signed-in user is available, except published snapshot views.

### Windows Local Runtime

This repo includes Windows helpers for a local self-hosted setup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\start-agy-stack.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\status-agy-stack.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\stop-agy-stack.ps1
```

To start the app and a public LocalXpose tunnel together:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\start-agy-stack.ps1 -WithTunnel
```

The tunnel startup also launches a LocalXpose watchdog. It checks the public URL every few minutes, restarts the tunnel when the free URL expires, and publishes the latest URL here:

- `.logs/runtime/agy.localxpose.url.txt`
- `.logs/runtime/agy.localxpose.state.json`
- `.logs/runtime/agy.localxpose.state.html`

You can inspect the current state at any time with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\status-agy-stack.ps1
```

The runtime scripts expect:

- `SUPABASE_PLATFORM_ROOT` to point at the local `supabase-platform` checkout, or the default `E:\supabase-platform`
- `LOCALXPOSE_ACCESS_TOKEN` in your user environment if you want the public tunnel

Install Windows login-time autostart with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\install-agy-autostart.ps1
```

That startup entry launches the local Supabase stack first, then `agy`, then the LocalXpose tunnel.

## Validation

Minimum validation for meaningful changes:

```bash
npm run lint
npm run build
```

Additional checks when relevant:

```bash
npm run check:types
npm run test:unit
npm run test:e2e
npm run check:styles:duplicates
npm run check:regressions
npm run baseline:capture
```

Manual validation lives in `docs/qa.md`.

## Repository Shape

Key paths:

- `src/app/`: Next.js app routes
- `src/components/`: shared UI and workspace components
- `src/features/wall/`: wall domain types, commands, storage, and sync helpers
- `src/features/page/`: page editor state and persistence
- `src/features/decks/`: deck study logic and data helpers
- `src/lib/`: shared utilities
- `docs/`: product, architecture, feature, API, runbook, and release documentation
- `supabase/`: local Supabase config and migrations

## Main Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Documentation

Use the docs folder as the canonical source of truth for product and engineering detail:

- `docs/product/overview.md`: current product surface
- `docs/architecture/overview.md`: system overview
- `docs/architecture/frontend-architecture.md`: frontend structure and responsibilities
- `docs/architecture/state-and-storage.md`: persistence and data flow
- `docs/features/`: feature-specific behavior and constraints
- `docs/api/`: API contracts
- `docs/runbooks/`: debugging and recovery procedures
- `docs/contributing/development-workflow.md`: contributor workflow
- `docs/releases/changelog.md`: release history
- `.codex/skills/idea-wall-documentation/SKILL.md`: documentation rules for this repo

## Notes

- This repository is local-first in day-to-day use.
- Published wall snapshots are intentionally read-only.
- Storage-related changes should be validated against `src/features/wall/storage.ts` and related migrations before shipping.
