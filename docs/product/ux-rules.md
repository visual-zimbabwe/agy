# UX Rules

## Purpose

This document records durable UX and visual-system rules for Agy surfaces.

## Scope

Covers shared product tokens, the wall Digital Atelier palette, typography expectations, and overlay visibility rules that apply across workspaces.

## Token Layers

Agy uses two related but distinct token layers:

| Layer | Source | Used by |
|-------|--------|---------|
| Product tokens | `:root` in `src/app/globals.css` (`--color-*`, `--radius-*`, `--motion-*`) | Landing, auth, settings, shared UI primitives |
| Digital Atelier palette | `src/components/wall/atelier-palette.ts` + `.wall-atelier-shell` CSS vars | Wall HTML preview cards, timeline stream shell, atelier page background |

Konva canvas notes use the related values in `src/components/wall/spatial/notes/note-style.ts` (`atelierPalette`). Values are intentionally aligned with the HTML palette but may use canvas-specific casing or alpha helpers.

## Digital Atelier Palette

The wall workspace uses a warm editorial palette distinct from generic product tokens:

| Token | Value | Role |
|-------|-------|------|
| `--atelier-paper` / `paper` | `#fffdfa` | Card surfaces, preview backgrounds |
| `--atelier-warm` / `warm` | `#fcf9f4` | Stream shell, page wash |
| `--atelier-wash` / `wash` | `#f6f3ee` | Secondary panels, chip fills |
| `--atelier-terracotta` / `terracotta` | `#a33818` | Primary accent, selection rings, play controls |
| `--atelier-forest` / `forest` | `#4d6356` | Secondary accent, meta labels |
| `--atelier-gold` / `gold` | `#755717` | Tertiary accent |
| `--atelier-ink` / `ink` | `#1c1c19` | Primary text |
| `--atelier-muted` / `muted` | `#5b463f` | Body secondary text |
| `--atelier-quiet` / `quiet` | `#8b716a` | Eyebrows, timestamps, helper copy |
| `--atelier-line` / `line` | `rgba(223,192,184,0.6)` | Borders, axis lines |

### Intentional divergence

- Timeline stream and HTML note previews **always** use the Digital Atelier palette, even when global theme preference is dark. The stream is a read/review surface with fixed warm-paper presentation.
- Generic `--timeline-*` tokens on `.wall-timeline-shell` serve the legacy horizontal scrubber chrome; the vertical stream (`WallTimelineView`) uses `timelineStreamShellStyles` from `atelier-palette.ts`.
- Note-kind reserved colors (Poetry `#B73A3A`, Economist `#F6EFE2`, Throne dark stone, code charcoal) stay in note-specific renderers and are documented in `docs/features/wall-notes.md`.

## Typography

| Surface | Display / title | Body |
|---------|-----------------|------|
| Wall atelier cards | `Newsreader` (serif, often italic) | `Manrope` for standard notes; kind-specific stacks elsewhere |
| Wall chrome | Shared wall chrome classes | Product body stack |
| Landing / auth | `--font-display` | `--font-body` |

Prefer existing font decisions in note renderers over introducing new per-component stacks.

## Spatial and Overlay Rules

From the repository quality gate (`AGENTS.md`, `docs/qa.md`):

1. Tooltips, menus, popovers, floating bars, and side panels must remain fully visible in the viewport.
2. Overlays must not hide critical controls or obscure primary content.
3. Leave breathing room around floating UI in default desktop and mobile wall layouts.

## Related Docs

- `docs/architecture/frontend-architecture.md`
- `docs/architecture/wall-rendering-model.md`
- `docs/features/wall-notes.md`
- `docs/features/timeline-view.md`
