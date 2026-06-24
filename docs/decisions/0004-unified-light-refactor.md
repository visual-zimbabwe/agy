# 0004 Unified Light Product Refactor

## Status

Accepted

## Context

Agy had grown into visually and behaviorally distinct surfaces: Wall (cream glass), Decks (rust gradient sidebar), Timeline (separate shell), and landing (custom token set). Dark/system theme support was incomplete (chrome could go dark while the canvas stayed warm cream). Wall carried overlapping study workflows (vocabulary SRS, Wall→Decks integration) that duplicated Decks. Basic/Advanced controls mode confused users without adding clarity. Smart Merge referenced removed workspaces.

Users needed one coherent light-mode product with Wall-first delivery, standalone Decks, and preserved content through explicit migrations.

## Decision

Refactor Agy in four phases:

1. **Wall** — light-only chrome, remove vocabulary/Smart Merge/Wall→Decks/Basic-Advanced/Tools rail; slim Details inspector; Structure menu + omnibar parity; unified Settings and Help.
2. **Timeline** — align overlay to unified product tokens; keep stream behavior.
3. **Decks** — full UI rebuild on shared tokens and header; feature parity; standalone data model (no Wall import).
4. **Landing + docs** — align `/` to unified tokens; update canonical documentation and QA.

Locked product rules:

| Topic | Decision |
|-------|----------|
| Theme | Light only; remove dark/system from UI and API |
| Wall vs Decks | Separate workflows; shared auth, header, tokens, Settings, Help only |
| Vocabulary notes | Client boot migration to standard note text; strip `vocabulary` payload; never delete notes |
| Details panel | Collapsed by default; selection inspector only |
| Context bar | On by default |
| Structure tools | Omnibar `tool:` + labeled Structure menu |
| Help | One Help center; `?` opens shortcuts tab |
| Settings | `SettingsShell` — modal on Wall, `/settings` route elsewhere |

## Alternatives Considered

### Keep dark mode and fix canvas mismatch

Rejected — incomplete dark styling across Konva/HTML layers would remain a maintenance tax for little user value.

### Retain vocabulary SRS on Wall

Rejected — duplicated Decks; vocabulary content migrates to standard notes instead.

### Incremental Decks reskin without rebuild

Rejected — rust-gradient shell and emoji settings were too far from unified tokens; parity features needed layout rework.

## Consequences

### Benefits

- One visual language across Wall, Timeline, Decks, landing, settings, and auth
- Clearer Wall chrome (omnibar + Structure own advanced actions)
- Decks is explicitly standalone; no cross-window deck presence on Wall
- Documentation and QA reflect shipped behavior

### Costs

- Large multi-phase diff; tunnel verification required per phase
- `account_settings.theme` and `controls_mode` deprecated (column drop in follow-up migration)
- Historical vocabulary-review doc archived; QA steps referencing Tools panel need periodic refresh

## Related Docs

- `docs/product/unified-agy-refactor-plan.md`
- `docs/product/overview.md`
- `docs/product/ux-rules.md`
- `docs/features/settings.md`
- `docs/features/decks.md`
- `docs/qa.md`
