# Development Workflow

## Purpose

This document defines the current contributor workflow for making changes in the Agy repository.

## Scope

This covers setup, coding workflow, validation, documentation expectations, and commit behavior for contributors working in this repo.

## Setup

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- Supabase environment for authenticated and cloud-backed flows

### Install

```bash
npm install
```

### Local Supabase

The repo includes [`supabase/config.toml`](/C:/Dev/products/idea-wall/supabase/config.toml) and checked-in migrations under [`supabase/migrations/`](/C:/Dev/products/idea-wall/supabase/migrations).

Start the local stack from the repository root with:

```bash
npx supabase@latest start
```

This creates or reuses a local Docker-backed development database on `127.0.0.1:54322` and local API services on `127.0.0.1:54321`. It does not affect the hosted Supabase project unless you intentionally run remote commands.

### Run

```bash
npm run dev
```

Key routes during development:

- `/wall`
- `/page`
- `/decks`
- `/settings`

## Working Rules

- Keep changes focused.
- Prefer updating the canonical file for a topic instead of creating duplicates.
- Follow the documentation rules in `.codex/skills/idea-wall-documentation/SKILL.md`.
- Treat docs as part of shipping, especially when changing user-visible behavior, routes, storage shape, APIs, or contributor workflow.
- Keep the repository root intentional: only core project config, lockfiles, contributor instructions, and a small number of canonical entry-point docs should live there.
- Move loose plans, discovery notes, and superseded status documents into `docs/archive/` unless they are the active source of truth for a current workflow.

## Coding Conventions

- Use TypeScript + React + Tailwind CSS.
- Keep components in PascalCase filenames.
- Keep feature/domain modules concise and type-driven.
- Prefer explicit domain types in `src/features/*/types.ts`.
- Keep route files thin and move workspace logic into components.

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
npm run check:styles:duplicates
npm run check:regressions
npm run baseline:capture
```

Manual validation should use `docs/qa.md`.

When behavior changes, add or update QA steps in `docs/qa.md`.

## Documentation Workflow

Before making documentation changes:

- check whether a canonical doc already exists
- update the canonical doc instead of making a parallel one
- keep current-state, proposals, and open questions clearly separated

Common canonical locations:

- `README.md`
- `docs/product/`
- `docs/architecture/`
- `docs/features/`
- `docs/api/`
- `docs/decisions/`
- `docs/runbooks/`
- `docs/releases/`

## Repository Root

The repository root should stay small and predictable. Contributors should expect these categories at the top level:

- package manager files such as `package.json` and `package-lock.json`
- framework and tool configuration such as Next.js, TypeScript, ESLint, Playwright, and Vitest config
- top-level contributor guidance such as `README.md` and `AGENTS.md`
- stable project folders such as `src/`, `docs/`, `public/`, `scripts/`, `e2e/`, and `supabase/`

Avoid leaving one-off planning documents or historical notes at the root. Move them into the appropriate canonical doc area or archive them under `docs/archive/`.

## Commits

- Use Conventional Commit style such as `feat:`, `fix:`, or `docs:`
- Keep commits focused and atomic
- Create a local git commit after repository changes so work is recoverable

## Pull Requests

PRs should include:

- summary of user-visible changes
- affected paths
- validation evidence
- screenshots or GIFs for UI changes when helpful

## Notes

The repo may contain unrelated local changes or experimental assets. Do not assume they are safe to remove unless they are clearly part of your task.

## Related Docs

- `.codex/skills/idea-wall-documentation/SKILL.md`
- `README.md`
- `docs/releases/changelog.md`
- `docs/qa.md`

