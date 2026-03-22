# Repository Guidelines

## Required Pre-Read
- Read the repository root `SKILL.md` before making any meaningful code changes.
- Treat `SKILL.md` as the documentation gate for implementation work: identify doc impact before coding and update canonical docs in the same change whenever possible.

## Project Structure & Module Organization
- App routes live in `src/app/`:
  - `src/app/page.tsx` (landing)
  - `src/app/wall/page.tsx` (interactive wall)
- Reusable UI components are in `src/components/` (canvas, modals, overlays).
- Wall domain logic is in `src/features/wall/`:
  - `types.ts`, `store.ts`, `commands.ts`, `storage.ts`, `constants.ts`
- Shared helpers live in `src/lib/`.
- Static assets are in `public/`.
- Manual QA checklist and product docs are in `docs/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server (Next.js) at `http://localhost:3000`.
- `npm run lint`: run ESLint checks.
- `npm run build`: create production build and run TypeScript checks.
- `npm run start`: serve the production build.

## Coding Style & Naming Conventions
- Language stack: TypeScript + React (App Router) + Tailwind CSS.
- Use 2-space indentation and keep files UTF-8/ASCII-friendly.
- Components: `PascalCase` filenames (e.g., `WallCanvas.tsx`).
- Feature modules/utilities: lowercase kebab or concise names (e.g., `wall-utils.ts`, `store.ts`).
- Prefer explicit types for domain entities in `src/features/wall/types.ts`.
- Run `npm run lint` before committing.

## Testing Guidelines
- No automated test suite is configured yet.
- Required quality gate is:
  1. `npm run lint`
  2. `npm run build`
  3. Manual validation using `docs/qa.md`
- For behavior changes, add or update QA steps in `docs/qa.md`.
- UI spatial/visibility gate for idea-wall:
  1. Tooltips, menus, popovers, floating bars, and side panels must remain fully visible in viewport (not clipped by edges/containers).
  2. Overlays must not be hidden behind existing UI or obscure critical controls/content.
  3. Leave enough breathing room around floating UI so interactions remain clear and unobstructed in default desktop and mobile wall layouts.

## Commit Guidelines
- Follow Conventional Commit style used in history, e.g.:
  - `feat: ...`
  - `fix: ...`
  - `docs: ...`
- Keep commits focused and atomic (one feature/fix per commit).
- Always create a local git commit after making repository changes so work is recoverable and easy to roll back.
- Repository work is complete when the requested changes are committed locally, unless the user explicitly asks for additional git workflow steps.
- Final handoff for repository work must state:
  - current branch name
  - commit hash

## Security & Configuration Tips
- App is local-first; persistence uses IndexedDB via Dexie.
- Do not commit secrets or local environment credentials.
- Validate data model changes against persistence migrations in `src/features/wall/storage.ts`.
