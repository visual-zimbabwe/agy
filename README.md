# Idea-Wall

Idea-Wall is a local-first web app for spatial brainstorming. It provides an infinite canvas of sticky notes with fast capture, lightweight structure, and export tools for reflection.

## Tech Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Zustand (state)
- Dexie + IndexedDB (local persistence)
- Konva + react-konva (canvas rendering)
- Fuse.js (fuzzy search)

## Features
- Infinite wall with pan/zoom camera
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
- Time-based views:
  - Timeline mode with scrub/playback
  - Recently changed heatmap overlay
  - Playback of wall evolution from persisted snapshots
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

### Run Development Server
```bash
npm run dev
```

Open:
- `http://localhost:3000/`
- `http://localhost:3000/wall`

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
Data is stored locally in IndexedDB database `idea-wall-db`.

Persisted entities:
- Notes
- Zones
- Zone groups
- Links
- Camera transform
- Last-used note color

No backend is required for v1.

## Keyboard Shortcuts
- `N` or `Ctrl/Cmd + N`: New note
- `Ctrl/Cmd + K`: Open search
- `Ctrl/Cmd + L`: Start a directional link from selected note
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
