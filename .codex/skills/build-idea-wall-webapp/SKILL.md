---
name: build-idea-wall-webapp
description: "Build the Idea-Wall web app: an infinite spatial canvas of Post-it notes (create/edit/drag/resize/color/cluster/search/export), local-first persistence, and a clean Next.js + React + TypeScript implementation with clear milestones and definition-of-done checks."
license: Apache-2.0
compatibility: Requires Node.js 20+ and npm. Runs as a local web app (no backend required). Uses IndexedDB for persistence. Intended for Codex CLI in a git repo.
metadata:
  author: user
  version: "1.0"
  tags: [webapp, nextjs, react, canvas, sticky-notes, local-first]
---

# Build Idea-Wall (Web App)

## When to use this skill
Use this skill when the user asks to build **Idea-Wall** as a **web app** (browser-based) with an **infinite canvas** of Post-it notes that can be created, edited, dragged, resized, colored, searched, clustered, and exported—**persisting locally** across sessions.

Do NOT use for:
- Native Windows shell replacement, Explorer extensions, or desktop context menu integration.
- Collaboration-first apps (real-time multi-user) unless explicitly requested.
- Heavy backend requirements unless explicitly requested.

## Product intent (north star)
Idea-Wall is a **spatial thinking surface** (not a task manager). It prioritizes:
- **Low-friction capture**
- **Spatial organization**
- **Persistence**
- **Fast recall**
- **Export for reflection**

## Default stack (use unless user overrides)
- Next.js (App Router) + React + TypeScript
- Tailwind CSS for styling
- Zustand for state
- Dexie (IndexedDB) for persistence
- react-konva + konva for canvas rendering, pan/zoom, drag, and export
- Fuse.js for search

If react-konva causes friction in the target environment, fall back to:
- DOM-based notes in an "infinite" pannable container with CSS transforms (still must support pan/zoom and export; export may use html-to-image).

## Repo setup conventions
Create the project at repo root, with a minimal, maintainable structure:

- `src/app/` (Next.js routes)
- `src/components/` (UI components)
- `src/features/wall/` (domain: notes, clusters, commands)
- `src/lib/` (storage, utils)
- `src/styles/`
- `docs/` (short docs: shortcuts, data model)

Use strict TypeScript and consistent formatting. Keep dependencies minimal.

---

# Milestones (execute in order)

## Milestone 0 — Scaffold & run (Definition of Done)
**Goal:** a running app with a landing view and a basic wall route.

**Do:**
1. Scaffold Next.js + TS + Tailwind.
2. Create routes:
   - `/` (simple marketing/description page)
   - `/wall` (the interactive wall)
3. Add basic layout, top bar, and responsive styling.
4. Add ESLint + prettier (optional, but recommended).

**DoD checks:**
- `npm install`
- `npm run dev` opens `/` and `/wall` without errors.

---

## Milestone 1 — Notes MVP (Create/Edit/Drag/Persist)
**Goal:** Post-it notes on a pannable surface with persistence.

**Required behaviors:**
- Create note:
  - Button “New note”
  - Shortcut: `N` (or `Ctrl/⌘ + N`)
  - Note spawns at center of viewport
- Edit note:
  - Click note to focus
  - Inline editing (textarea), autosave (debounced)
- Drag note:
  - Drag to reposition
- Persist:
  - Notes restore on refresh (IndexedDB)
  - Store: `id`, `text`, `x`, `y`, `w`, `h`, `color`, `createdAt`, `updatedAt`

**Implementation guidance:**
- Use a command layer: `createNote()`, `updateNote()`, `moveNote()`, `deleteNote()`.
- Use debounced writes to IndexedDB (e.g., 250–500ms).
- Keep UI snappy even with 200+ notes.

**DoD checks:**
- Create 5 notes, refresh page, all return to correct positions.
- Dragging does not cause jank on typical hardware.

---

## Milestone 2 — Pan/Zoom + Infinite Wall
**Goal:** The wall behaves like an infinite workspace.

**Required behaviors:**
- Pan via:
  - Space + drag, or middle mouse drag, or trackpad pan
- Zoom via:
  - Ctrl/⌘ + mouse wheel (zoom toward cursor)
- A “Reset view” button returns to 100% zoom centered on current content bounds.

**Coordinate rules:**
- Maintain a world coordinate system (note positions are world coords).
- View transform (pan/zoom) is separate from note coordinates.

**DoD checks:**
- Notes stay in correct relative positions while zooming/panning.
- Create note at viewport center, then pan away and back—note is where expected.

---

## Milestone 3 — Resize, Color, Delete, Duplicate
**Goal:** Make notes feel like real Post-its.

**Required behaviors:**
- Resize note via handles (min size enforced)
- Color picker (few curated colors + “last used” default)
- Delete with confirmation (or Undo; see Milestone 6)
- Duplicate note (Shift+D or context menu)

**UX rules:**
- Selection: one active note at a time.
- Esc clears selection.
- Keyboard:
  - `Delete/Backspace` deletes selected note (confirm or undo)
  - `Ctrl/⌘ + D` duplicates

**DoD checks:**
- Resized notes persist dimensions.
- Duplicate creates a note offset slightly from the original.

---

## Milestone 4 — Search, Filter, and Quick Jump (Recall)
**Goal:** Instant retrieval.

**Required behaviors:**
- Search palette: `Ctrl/⌘ + K`
- Typing filters notes by text (Fuse.js fuzzy search).
- Selecting a result zooms/pans the camera to center that note and flashes/highlights it briefly.
- Optional filters: by color, “recently edited”, “created today”.

**DoD checks:**
- With 100 notes, search results appear quickly (<200ms typical).
- Selecting a result reliably centers the note.

---

## Milestone 5 — Clusters / Zones (Spatial + Optional Named Areas)
**Goal:** Support both organic clustering and light structure.

Implement BOTH:
1. **Implicit clustering**: notes are naturally grouped by proximity; provide a “Detect clusters” view that outlines groups (no destructive changes).
2. **Named zones** (lightweight): user can create rectangular zone regions on the wall with a label (e.g., “Daily”, “Long-term”, “Ideas”).

**Zone rules:**
- Zones are draggable/resizable.
- Notes can overlap zones; a note can belong to multiple zones if overlapping.
- Store zones in IndexedDB: `id`, `label`, `x`, `y`, `w`, `h`, `color`, timestamps.

**DoD checks:**
- Create 2 zones, refresh, zones restore.
- “Detect clusters” draws outlines and does not modify note positions.

---

## Milestone 6 — Export & Reflection
**Goal:** Turn the wall into artifacts.

**Required exports:**
- Export entire wall to PNG.
- Export selected zone to PNG.
- Export selected notes to Markdown (download `.md`).

**Implementation guidance:**
- For Konva: use `stage.toDataURL({ pixelRatio: 2 })`.
- Handle large canvases: export current view OR export bounds of selected content.
- Provide a simple export modal with options:
  - Whole wall / current view / selection
  - Pixel ratio

**DoD checks:**
- Exported PNG matches visible notes and styling.
- Markdown export includes note text and metadata (optional headings per zone).

---

# Non-negotiable quality rules
- Must be keyboard-friendly (at least: create note, open search, delete note, focus note).
- Must not lose data on refresh.
- No modal spam; friction should be low.
- Keep main interactions at 60fps where possible (debounce persistence).
- Avoid over-engineering: no backend in v1.

---

# Data model (canonical)
Define types in `src/features/wall/types.ts`:

- `Note`:
  - `id: string`
  - `text: string`
  - `x: number`
  - `y: number`
  - `w: number`
  - `h: number`
  - `color: string`
  - `createdAt: number`
  - `updatedAt: number`

- `Zone`:
  - `id: string`
  - `label: string`
  - `x: number`
  - `y: number`
  - `w: number`
  - `h: number`
  - `color: string`
  - `createdAt: number`
  - `updatedAt: number`

- `WallState`:
  - `notes: Record<string, Note>`
  - `zones: Record<string, Zone>`
  - `camera: { x: number; y: number; zoom: number }`
  - `ui: { selectedNoteId?: string; selectedZoneId?: string; lastColor?: string }`

Persist notes and zones; optionally persist camera.

---

# Implementation steps (Codex execution checklist)
When invoked, follow this checklist in order:

1. **Inspect repo** (list files). If empty, scaffold as per Milestone 0.
2. Add dependencies (only what is needed for the current milestone).
3. Implement one milestone at a time.
4. After each milestone:
   - run `npm run lint` (if configured)
   - run `npm run build` (or at least `npm run dev` sanity)
   - verify DoD checks via manual steps documented in `docs/qa.md`
5. Commit in small increments with clear messages:
   - `feat(wall): create/edit/drag notes with persistence`
   - `feat(wall): add pan/zoom camera`
   - etc.

---

# UI requirements (minimum)
On `/wall`:
- Top bar with:
  - New Note
  - Search
  - Export
  - Reset View
- Subtle help hint: `?` opens shortcuts overlay

Visual style:
- Notes should look like Post-its:
  - rounded corners
  - soft shadow
  - readable font
  - slight padding
- Keep it minimal (no clutter).

---

# Files to produce
At minimum, the implementation should create/update:

- `src/app/page.tsx` (landing)
- `src/app/wall/page.tsx` (wall)
- `src/features/wall/`:
  - `types.ts`
  - `store.ts` (zustand)
  - `storage.ts` (dexie)
  - `commands.ts` (create/move/update/delete)
- `src/components/`:
  - `WallCanvas.tsx`
  - `NoteCard.tsx` (render/edit note)
  - `SearchPalette.tsx`
  - `ExportModal.tsx`
  - `ShortcutsHelp.tsx`
- `docs/qa.md` (manual DoD checklist)
- `README.md` (how to run, shortcuts)

---

# Manual QA script (write to docs/qa.md)
Include step-by-step verification for each milestone with expected outcomes and screenshots optional.

---

# If you must ask a question
Avoid questions unless blocked. If blocked, ask only one, and offer a safe default.
Examples of acceptable blockers:
- user wants a specific framework (Svelte, Vue, etc.)
- user requires collaboration/sync in v1

Otherwise proceed with defaults above.

---

# References (selection logic)
Follow the Agent Skills SKILL.md format requirements (frontmatter + markdown body). The skill metadata should be specific so Codex can select it reliably. :contentReference[oaicite:0]{index=0}
Codex uses progressive disclosure: it loads only name/description until it decides to invoke the skill, then reads full instructions. :contentReference[oaicite:1]{index=1}
