# Agy

Agy is a visual thinking studio for capturing, organizing, and interacting with ideas across multiple work surfaces.

The current product includes:

- `/wall`: the spatial wall for notes, links, zones, timeline review, export, and published read-only snapshots
- `/page`: a block-based infinite page editor for structured documents, embeds, uploads, and comments
- `/decks`: a study workspace for decks, cards, browsing, custom study sessions, and stats
- `/settings`: account, appearance, keyboard, and workspace preferences

This repository is local-first in day-to-day interaction and cloud-backed when signed in. IndexedDB is used for fast client persistence and Supabase provides authentication, storage, and account-scoped sync.

## Core Capabilities

### Wall

- Infinite canvas with pan and zoom
- Rich note types including standard, quote, canon, journal, vocabulary, Eisenhower, APOD, bookmark, and Poetry workflows
- Tags, wiki-style links, directional links, zones, zone groups, and note groups
- Search, quick capture, recall, timeline view, presentation mode, and multiple export paths
- Cloud sync and published read-only snapshot links

### Page Editor

- Infinite, pannable block canvas
- Slash commands for text, headings, lists, tables, quotes, code, dividers, bookmarks, embeds, media blocks, and page cover insertion
- File uploads, external embeds, Unsplash image search, comments, block menus, drag and nesting behavior
- Local and cloud-backed page snapshots

### Decks

- Nested decks
- Study, browse, stats, and custom study modes
- Note types, import presets, tags, and scheduler support
- Dedicated API surface for deck management and review flows

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Zustand
- Dexie + IndexedDB
- Supabase Auth, Postgres, Storage, and RLS
- Konva + react-konva for wall rendering
- Vitest and Playwright for automated validation

## Routes

- `/`: landing page
- `/wall`: main wall workspace
- `/wall?snapshot=...`: read-only published wall snapshot
- `/page`: block page editor workspace
- `/decks`: deck study workspace
- `/settings`: account and workspace settings
- `/login`, `/signup`: auth flows

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- Supabase project for authenticated and cloud-backed flows

### Install

```bash
npm install
```

The repository includes [`.nvmrc`](/C:/Dev/products/idea-wall/.nvmrc) to pin the expected Node.js major version.

### Environment

Copy [`.env.example`](/C:/Dev/products/idea-wall/.env.example) to `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
CURRENCY_API_KEY=your-currencyapi-com-api-key
# or, if you already use CurrencyAPI's naming
CURRENCYAPI_API_KEY=your-currencyapi-com-api-key
```

If you are setting up a fresh environment, apply the required Supabase migrations from `supabase/migrations/`.

### Local Supabase

This repo now includes the standard local Supabase CLI config at [`supabase/config.toml`](/C:/Dev/products/idea-wall/supabase/config.toml).

To start the local stack without installing the CLI globally:

```bash
npx supabase@latest start
```

Useful local endpoints after startup:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

This starts a local Docker-backed Supabase instance for development only. It does not modify your remote Supabase project unless you explicitly run remote-targeting CLI commands.

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

Authenticated routes redirect to `/login` when no signed-in user is available, except published snapshot views.

## Validation Commands

```bash
npm run lint
npm run check:types
npm run test:unit
npm run build
```

Additional project checks:

```bash
npm run check:styles:duplicates
npm run check:regressions
npm run baseline:capture
```

Manual validation lives in `docs/qa.md`.

## Project Structure

### App Routes

- `src/app/page.tsx`: landing page
- `src/app/wall/page.tsx`: wall route and auth gate
- `src/app/page/page.tsx`: block page editor route
- `src/app/decks/page.tsx`: decks workspace route
- `src/app/settings/page.tsx`: settings route
- `src/app/api/`: API routes for walls, decks, page files, account settings, conversion, and related workflows

### UI

- `src/components/WallCanvas.tsx`: wall composition root
- `src/components/wall/`: wall-specific surfaces, layers, hooks, panels, and controls
- `src/components/page-editor/PageEditor.tsx`: page editor workspace
- `src/components/decks/DecksWorkspace.tsx`: decks workspace
- `src/components/settings/SettingsWorkspace.tsx`: settings UI

### Domain

- `src/features/wall/`: wall types, commands, storage, cloud sync, migrations, and feature helpers
- `src/features/page/`: page types, storage, and cloud persistence
- `src/features/decks/`: deck note-type and scheduling logic

## Data and Persistence

### Wall

Persisted wall state includes:

- notes
- zones
- zone groups
- note groups
- links
- camera
- last-used color

Wall notes can also carry richer payloads such as canon content, vocabulary review state, Eisenhower data, quote metadata, APOD metadata, PoetryDB poem state, image URLs, text formatting, highlight state, and the permanent currency widget state.

### Page

Persisted page state includes:

- blocks
- block comments
- embedded file metadata
- optional page cover metadata
- camera
- update timestamp

### Cloud

Supabase is used for:

- authentication
- wall records and wall snapshots
- decks, notes, cards, and deck stats
- page file storage and file signing
- account settings and profile state

## Documentation

Canonical documentation now lives under `docs/`:

- `docs/product/overview.md`
- `docs/contributing/development-workflow.md`
- `docs/decisions/0001-local-first-with-cloud-sync.md`
- `docs/architecture/overview.md`
- `docs/architecture/frontend-architecture.md`
- `docs/features/timeline-view.md`
- `docs/features/wall-notes.md`
- `docs/features/search-and-retrieval.md`
- `docs/features/quick-capture.md`
- `docs/features/page-editor.md`
- `docs/features/decks.md`
- `docs/features/settings.md`
- `docs/features/file-conversion.md`
- `docs/features/published-snapshots.md`
- `docs/features/vocabulary-review.md`
- `docs/features/eisenhower-notes.md`
- `docs/api/walls.md`
- `docs/api/decks.md`
- `docs/api/account.md`
- `docs/api/convert.md`
- `docs/api/page.md`
- `docs/architecture/state-and-storage.md`
- `docs/architecture/decks-data-model.md`
- `docs/architecture/wall-rendering-model.md`
- `docs/runbooks/sync-debugging.md`
- `docs/runbooks/page-file-storage-debugging.md`
- `docs/runbooks/local-storage-reset-and-recovery.md`
- `docs/releases/changelog.md`
- `docs/qa.md`

Documentation rules and standards are defined in `.codex/skills/idea-wall-documentation/SKILL.md`.

Contributor workflow guidance is available at [CONTRIBUTING.md](/C:/Dev/products/idea-wall/CONTRIBUTING.md) and [docs/contributing/development-workflow.md](/C:/Dev/products/idea-wall/docs/contributing/development-workflow.md).







