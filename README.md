# Idea-Wall

Idea-Wall is a local-first web app for spatial brainstorming. It provides an infinite canvas of sticky notes with fast capture, lightweight structure, and export tools for reflection.

## Tech Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Zustand (state)
- Dexie + IndexedDB (local persistence)
- Konva + react-konva (canvas rendering)
- Fuse.js (fuzzy search)
- Supabase (Auth + Postgres + RLS)

## Features
- Infinite wall with pan/zoom camera
- Email/password authentication (`/login`, `/signup`)
- Account-scoped cloud sync with Supabase Postgres
- Sync status UX (`Sync now`, last synced time, error banner)
- Create notes (`N` / `Ctrl+N`) at viewport center
- Inline note editing with debounced autosave
- Drag and resize notes
- Note tags (add/remove chips, searchable via fuzzy search)
- Automatic tag groups for tags used by 2+ notes (outlined on canvas + quick-jump list)
- Color swatches with last-used color memory
- Duplicate note (`Ctrl/Cmd + D` or `Shift + D`)
- Delete selected note or zone (`Delete` / `Backspace`)
- Search palette (`Ctrl/Cmd + K`) with jump-to-note + flash highlight
- Named zones (create, drag, resize, persist)
- Non-destructive proximity cluster outlines (`Detect Clusters`)
- Smart directional links between notes:
  - Cause -> Effect
  - Dependency
  - Idea -> Execution
- Right-click context menu on links (delete, change relation type)
- Graph path visualization (select a note to highlight connected upstream/downstream paths)
- Lightweight templates:
  - Brainstorm
  - Retro
  - Strategy Map
- Collapsible zone groups with quick assignment from selected zone
- Multi-select workflows:
  - Box select mode for selecting many notes at once
  - Bulk move, color, tag, and export selected notes
  - Align/distribute actions (left/center/right/top/middle/bottom + horizontal/vertical)
- Faster capture:
  - Quick-capture command bar for rapid line-by-line note creation
  - Paste-to-note parsing (bullets/lines to individual notes)
  - Voice-to-note input (Web Speech API in supported browsers)
- Stronger recall:
  - Saved searches for recurring retrieval workflows
  - Smart filters by zone, tag, and recency date window
  - Jump actions for stale notes and high-priority notes
- Time-based views:
  - Timeline mode with scrub/playback
  - Recently changed heatmap overlay
  - GitHub-style calendar heatmap (click a day to jump timeline)
  - Playback of wall evolution from persisted snapshots
- Share/export upgrades:
  - PDF export (whole/view/zone/selection)
  - Presentation mode for focused read-only walkthroughs
  - One-click publish of a read-only wall snapshot link
- Export to PNG (whole wall, current view, selected zone)
- Export notes to Markdown
- Undo/redo history stack with keyboard shortcuts and safe bounded history
- Keyboard shortcuts overlay (`?`)

## Getting Started
### Prerequisites
- Node.js 20+
- npm

### Install
```bash
npm install
```

### Supabase Environment
Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mklfzifmupjzgfuamtzv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Use `supabase/migrations/202602110001_user_accounts.sql` in your Supabase SQL editor to create tables, indexes, and RLS policies.

### Run Development Server
```bash
npm run dev
```

Open:
- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/wall` (requires sign-in unless using published snapshot link)

### Lint
```bash
npm run lint
```

### Production Build
```bash
npm run build
npm run start
```

## Project Structure
- `src/app/page.tsx`: Landing page
- `src/app/wall/page.tsx`: Wall route
- `src/components/WallCanvas.tsx`: Main interactive canvas and toolbar
- `src/components/SearchPalette.tsx`: Search command palette
- `src/components/ExportModal.tsx`: Export UI
- `src/components/ShortcutsHelp.tsx`: Shortcut overlay
- `src/features/wall/types.ts`: Canonical data types
- `src/features/wall/store.ts`: Zustand store
- `src/features/wall/storage.ts`: Dexie persistence
- `src/features/wall/commands.ts`: Command layer (create/update/move/delete/duplicate)
- `src/lib/wall-utils.ts`: Clustering, bounds, markdown helpers
- `docs/qa.md`: Milestone-based manual QA checklist

## Data Persistence
Data is stored in:
- Local IndexedDB (`idea-wall-db`) for fast/offline cache
- Supabase Postgres for account-backed sync across devices

Persisted entities:
- Notes
- Zones
- Zone groups
- Links
- Camera transform
- Last-used note color

Auth is handled by Supabase Auth, and row-level security enforces user isolation in Postgres tables.

## Keyboard Shortcuts
- `N` or `Ctrl/Cmd + N`: New note
- `Q` or `Ctrl/Cmd + J`: Toggle quick capture bar
- `Ctrl/Cmd + Enter`: Capture quick-capture lines into notes
- `Ctrl/Cmd + K`: Open search
- `P`: Toggle presentation mode
- `Ctrl/Cmd + L`: Start a directional link from selected note
- `Ctrl/Cmd + A`: Select all visible notes
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
- `T`: Toggle timeline mode
- `H`: Toggle heatmap overlay
- `Delete` / `Backspace`: Delete selected note, zone, link, or zone group
- `Ctrl/Cmd + D` or `Shift + D`: Duplicate selected note
- `Space + Drag`: Pan canvas
- `Ctrl/Cmd + Mouse Wheel`: Zoom toward cursor
- `Esc`: Clear selection / close overlays
- `?`: Toggle shortcuts help

## QA
Use `docs/qa.md` for milestone-by-milestone verification.
