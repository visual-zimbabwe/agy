# Idea-Wall Product Improvements

## Core Product Roadmap
1. AI-assisted clustering and labeling
- Auto-suggest cluster names/themes from note content, then let users accept/edit.
2. Smart links between notes (Done)
- Create directional links (cause/effect, dependency, idea to execution) and visualize graph paths.
3. Time-based views (Done)
- Add timeline mode, recently changed heatmap, and playback of wall evolution.
4. Multi-select workflows (Done)
- Box select plus bulk move/color/tag/export plus align/distribute actions.
5. Better structure primitives (Done)
- Add tags, lightweight templates, and collapsible zone groups.
6. Faster capture (Done)
- Quick-capture command bar and paste-to-note parsing.
7. Stronger recall (Done)
- Saved searches, smart filters (zone/tag/date), and jump to stale/high-priority notes.
8. Undo/redo history (Done)
- Full command stack with keyboard shortcuts and recovery safety.
9. Share/export upgrades (Done)
- PDF export, presentation mode, and one-click publish of a read-only wall snapshot.
10. Optional collaboration mode
- Single-file local-first sync via CRDT (LAN/peer-to-peer first, then cloud).

## Frontend Milestones (Completed)
1. Baseline + Guardrails (Done)
- Baseline capture flow and route checklist established in `docs/qa.md`.
2. Design System Foundation (Done)
- Shared tokens and core UI primitives in `src/app/globals.css` and `src/components/ui/`.
3. Wall UI Decomposition (Done)
- `WallCanvas` split into wall subcomponents and behavior hooks under `src/components/wall/`.
4. Interaction Polish (Done)
- Unified motion/focus polish and cleaner wall chrome interactions.
5. Aesthetic Pass Across Routes (Done)
- Landing/auth/wall now share one visual system and consistent layout behavior.
6. Hardening + Documentation (Done)
- Hardening checks run (`lint`, `check:regressions`, `build`) and architecture guidance documented.

## Frontend Completion Criteria
1. Architecture boundaries documented in `docs/frontend-architecture.md`.
2. Shared design tokens and primitives are the default for new route/chrome surfaces.
3. Hardening checks pass:
- `npm run lint`
- `npm run check:regressions`
- `npm run build`
4. QA baseline artifacts exist in `docs/baselines/2026-02-11/`.
5. Manual verification remains governed by `docs/qa.md` for interactive behavior checks.
