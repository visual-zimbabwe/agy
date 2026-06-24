# UX Rules

## Purpose

This document records durable UX and visual-system rules for Agy surfaces.

## Scope

Covers shared product tokens, the wall Digital Atelier palette, typography expectations, and overlay visibility rules that apply across workspaces.

## Token Layers

Agy uses one **unified light** product token layer in `:root` (`src/app/globals.css`: `--background`, `--color-surface*`, `--color-text*`, `--radius-*`, `--motion-*`, `--shadow-*`). Landing, auth, settings, Decks, Timeline overlay chrome, and shared UI primitives all consume these tokens.

Wall note cards and HTML previews still use the **Digital Atelier** palette for editorial card surfaces:

| Layer | Source | Used by |
|-------|--------|---------|
| Product tokens | `:root` in `globals.css` | Landing, auth, settings, Decks shell, timeline chrome, shared primitives |
| Digital Atelier palette | `atelier-palette.ts` + `.wall-atelier-shell` CSS vars | Wall HTML preview cards, Konva note accents |

Konva canvas notes use aligned values in `note-style.ts` (`atelierPalette`). Terracotta `#a33818` is the primary CTA and active-nav accent across product chrome.

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

- Timeline stream **chrome** (search, day jump, detail rail) uses unified product tokens via `.wall-timeline-shell`. Stream note previews still use Digital Atelier card surfaces where they mirror wall renderers.
- Note-kind reserved colors (Poetry `#B73A3A`, Economist `#F6EFE2`, Throne stone, code charcoal) stay in note-specific renderers and are documented in `docs/features/wall-notes.md`.
- Dark mode and route-specific dark shells were removed; `html { color-scheme: light; }` is fixed.

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
