# Idea-Wall Documentation Standard

## 1. Title and Purpose

Idea-Wall is brain RAM: a visual workspace for capturing, organizing, and interacting with thoughts, notes, and ideas across wall, timeline, and related views.

Documentation is part of product quality. It is not cleanup work after coding. For Idea-Wall, documentation must make the product easier to onboard, maintain, debug, trust, and scale. Good docs reduce ambiguity, preserve decisions, and keep the project credible as it grows into a public-facing product.

This file is the operating manual for how documentation is created, updated, reviewed, and maintained in this repository.

## 2. Documentation Principles

- Documentation is part of shipping. Work is not complete if the code changed but the important docs did not.
- Docs must match reality. If the code and docs disagree, the docs are wrong and must be fixed quickly.
- Prefer clarity over cleverness. Use direct language and concrete examples.
- Short is good, but incomplete is bad. Compress aggressively, but do not omit decisions, constraints, or behavior that matter.
- Examples beat abstraction. Show a note flow, wall behavior, schema example, or command sequence when it helps.
- Every major feature should be understandable by a new contributor without reverse-engineering the codebase.
- Update docs in the same change whenever possible. Split-brain updates create stale documentation.
- One source of truth per topic. Link to the canonical doc instead of duplicating the same explanation in multiple places.
- Separate facts from plans. Current behavior, proposed changes, and open questions must not blur together.

## 3. What Production-Style Documentation Means Here

Production-style documentation in this repository means:

- It describes the current product and codebase, not an imagined future state.
- It is structured so a new contributor can find the right answer quickly.
- It uses stable naming, clear ownership, and durable file locations.
- It explains behavior, constraints, and tradeoffs, not just intent.
- It is specific enough to support implementation, debugging, support, and release work.
- It is credible to an external reader. No placeholders, vague claims, abandoned drafts presented as truth, or hidden setup assumptions.

This standard should work for a solo builder today and a distributed team later.

## 4. Required Documentation Types

Idea-Wall should maintain the following documentation categories.

### `README.md`

Use `README.md` for the public-facing project overview:

- what Idea-Wall is
- core capabilities
- local setup
- environment requirements
- how to run, build, and validate
- links to deeper docs

`README.md` should stay concise. It is the front door, not the full manual.

### `docs/product/`

Use for product behavior and UX intent:

- product vision and positioning
- user problems and use cases
- information model for notes, note types, metadata, uploads, links, zones, timeline concepts
- user flows such as capture, organize, search, review, export, publish
- UX rules and interaction expectations

### `docs/architecture/`

Use for system design and implementation-level concepts:

- frontend architecture
- rendering model
- state model
- storage model
- sync model
- data flow
- performance constraints
- security boundaries

### `docs/features/`

Use for feature-specific documentation when a feature needs its own durable explanation:

- quick capture
- search and retrieval
- timeline view
- uploads and file conversion
- collaboration or sharing features
- note links and graph behavior

Each feature doc should describe what the feature does, how it behaves, key edge cases, and any important implementation boundaries.

### `docs/api/`

Use when Idea-Wall exposes or depends on explicit contracts:

- route contracts
- sync payload shapes
- import or export schemas
- webhook formats
- public API expectations if introduced later

If no API exists yet, keep this folder minimal or absent. Do not create hollow docs.

### `docs/decisions/`

Use for architecture decision records (ADRs):

- why a notable technical or product decision was made
- what alternatives were considered
- what consequences follow from that decision

Create a decision record when the reasoning will matter later.

### `docs/runbooks/`

Use for operational and debugging guides:

- local environment recovery
- sync failures
- IndexedDB corruption handling
- auth issues
- export failures
- migration troubleshooting

Runbooks are for action under pressure. They should be procedural and easy to scan.

### `docs/contributing/`

Use for contributor workflows:

- setup expectations beyond the README
- coding standards
- testing and QA expectations
- documentation workflow
- branch, commit, and PR conventions

### `docs/releases/`

Use for release notes and change communication:

- release summaries
- notable user-facing changes
- migrations or upgrade notes
- breaking changes
- deprecations

## 5. Folder Structure Standard

The target documentation tree for this repository is:

```text
README.md
SKILL.md
docs/
  product/
    overview.md
    user-flows.md
    information-model.md
    ux-rules.md
  architecture/
    overview.md
    frontend-architecture.md
    rendering-model.md
    state-and-storage.md
    sync-model.md
  features/
    quick-capture.md
    search-and-retrieval.md
    timeline-view.md
    exports.md
  api/
    sync-contracts.md
    export-formats.md
  decisions/
    0001-local-first-with-cloud-sync.md
    0002-konva-canvas-rendering.md
  runbooks/
    local-setup-recovery.md
    sync-debugging.md
    storage-reset-and-recovery.md
  contributing/
    development-workflow.md
    documentation-standard.md
  releases/
    changelog.md
    2026-03.md
  baselines/
    2026-02-11/
      README.md
      wall-desktop.png
```

This tree is the standard going forward. Existing flat files in `docs/` should be migrated into these folders as they are touched or consolidated. Do not perform churn for its own sake, but do move documents toward this structure when editing them meaningfully.

## 6. Naming Conventions

- Use lowercase kebab-case filenames.
- Keep one topic per file.
- Name files after the subject, not the meeting, author, or date, unless the date is the subject.
- Use index-style files only where they materially improve navigation. Prefer `overview.md` to generic `index.md` unless an index page is genuinely needed.
- Use numbered prefixes only for ordered records such as ADRs.
- Avoid vague or disposable names such as `notes.md`, `misc.md`, `temp.md`, `new-plan.md`, `final-notes-v2.md`, or `updated-doc.md`.
- Date-based release files should use `YYYY-MM.md` or `YYYY-MM-DD.md` when the date is the organizing key.

Examples:

- Good: `docs/features/timeline-view.md`
- Good: `docs/architecture/state-and-storage.md`
- Good: `docs/decisions/0003-note-link-model.md`
- Bad: `docs/timeline stuff.md`
- Bad: `docs/final-architecture-v2.md`
- Bad: `docs/joana-notes.md`

## 7. Documentation Writing Standard

Write documentation to be useful during real work.

### Required writing rules

- Start with context and purpose. State what the document covers and why it exists.
- Define scope. Say what is in and out of scope when ambiguity is likely.
- State assumptions. Include environment assumptions, product assumptions, or known constraints.
- Use concrete examples when they clarify behavior.
- Describe user-visible behavior precisely for UX and feature docs.
- Mention important edge cases, failure modes, and exceptions.
- State known limitations honestly.
- Use headings consistently so sections are easy to scan.
- Prefer short paragraphs and flat bullet lists.
- Use tables only when comparison or reference is clearer in table form.
- Avoid marketing language in technical docs.
- Distinguish clearly between:
  - Facts
  - Proposals
  - Open questions

### Document states

When needed, label uncertain sections explicitly:

- `Current State`
- `Proposed Change`
- `Open Questions`
- `Known Limitations`

Do not present proposals as shipped behavior.

### Idea-Wall-specific expectations

When relevant, docs should describe behavior for concepts such as:

- note creation and editing
- note types and metadata
- wall view and timeline view
- pan, zoom, selection, and focus behavior
- rendering and layering
- uploads and file conversion behavior
- sync and persistence behavior
- export and publish behavior

If a behavior would matter to a user, support engineer, or future maintainer, document it.

## 8. Where Docs Should Live

Use the narrowest stable location that fits the topic.

- Put broad product entry points in `README.md` and `docs/product/overview.md`.
- Put cross-cutting technical concepts in `docs/architecture/`.
- Put deep behavior for a specific feature in `docs/features/`.
- Put decisions with lasting tradeoffs in `docs/decisions/`.
- Put procedural recovery steps in `docs/runbooks/`.
- Put contributor process and standards in `docs/contributing/`.
- Put release communication in `docs/releases/`.

Do not store critical project knowledge only in:

- pull request descriptions
- issue comments
- commit messages
- chat threads
- temporary scratch files at repo root

If it matters later, it belongs in a maintained document.

## 9. Documentation Templates

Use these templates as defaults. Keep them short unless the topic requires more depth.

### Feature Doc Template

```md
# Feature Name

## Purpose
What problem this feature solves and who it is for.

## Scope
What this doc covers and what it does not.

## Behavior
- Primary user flow
- Important states
- Key interactions and shortcuts

## Data and State
- Relevant entities, fields, or persisted state

## Edge Cases
- Important exceptions or tricky behavior

## Limitations
- Current constraints or known gaps

## Related Docs
- Links to architecture, API, decisions, or runbooks
```

### Architecture Doc Template

```md
# Topic Name

## Purpose
Why this part of the system exists.

## Scope
Boundaries of this document.

## Design
Core components, data flow, and control flow.

## Constraints
Performance, security, platform, or product constraints.

## Failure Modes
What can go wrong and how the system behaves.

## Related Decisions
- Links to ADRs or feature docs
```

### Decision Record Template

```md
# 000X Decision Title

## Status
Accepted | Superseded | Proposed

## Context
What problem required a decision.

## Decision
What was chosen.

## Alternatives Considered
- Option A
- Option B

## Consequences
- Benefits
- Costs
- Follow-on constraints
```

### Runbook Template

```md
# Runbook Name

## When to Use
Symptoms or triggers.

## Preconditions
Required access, tools, or environment state.

## Steps
1. First action
2. Verification step
3. Recovery step

## Expected Outcome
What success looks like.

## Escalation
What to do if the runbook does not resolve the issue.
```

### Release Note Template

```md
# Release YYYY-MM-DD

## Summary
Short description of the release.

## Added
- New user-visible capability

## Changed
- Behavior change or improvement

## Fixed
- Bug fix with user impact

## Migration or Upgrade Notes
- Any required action

## Known Issues
- Important unresolved problems, if any
```

## 10. Update Rules

Documentation must be updated when any of the following happens:

- before merging feature work that changes user-visible behavior
- when UI or UX behavior changes
- when schemas, contracts, or persisted state shape change
- when commands, setup steps, or contributor workflow change
- when a bug fix changes expected behavior
- when architecture changes invalidate prior explanations
- when a decision makes an older document wrong or misleading
- when screenshots, diagrams, or examples are no longer representative

Update docs in the same change as the code whenever possible. If that is genuinely not possible, create an explicit follow-up immediately and keep the gap short.

If a document becomes stale and no longer provides value, either:

- correct it
- archive it clearly
- remove it

Stale docs are worse than missing docs when they mislead contributors.

## 11. Release and Change Documentation Expectations

Idea-Wall should maintain visible change history as the product evolves.

### Minimum release documentation

For any meaningful release or milestone, record:

- what changed
- who the change affects
- whether behavior is additive, modified, or breaking
- any migration, reindex, cache reset, or manual recovery steps
- any known follow-up issues

### Change categories that require explicit release notes

- new features
- removals
- renamed user-facing concepts
- changed shortcuts or workflows
- storage or sync changes
- import or export format changes
- auth or permission model changes
- breaking or potentially confusing UX changes

Use `docs/releases/changelog.md` as the running history and date-based release files for fuller notes when needed.

## 12. Contributor Rules

Contributors should treat documentation as part of the implementation.

### Before making changes

- read the relevant existing docs
- identify the current source of truth for the topic
- avoid creating a new doc if the existing one should be updated instead

### When writing or editing docs

- write for the next contributor, not just for the current author
- keep the language direct and operational
- link related docs rather than duplicating them
- leave enough detail for debugging and maintenance

### When introducing a new feature or subsystem

- update `README.md` if the project overview or setup changed
- add or update a feature doc if the behavior needs durable explanation
- add or update architecture docs if the system design changed
- add an ADR if the decision carries lasting tradeoffs
- update runbooks if support or recovery steps changed
- update release docs for user-visible changes

## 13. AI Agent Rules

AI coding agents working in this repository must follow these rules.

- Always check for related docs before making changes.
- Update docs when changing behavior, structure, naming, flows, APIs, storage shape, or developer workflow.
- Prefer editing an existing canonical doc over creating a new scattered file.
- Do not create duplicate docs that cover the same topic with slightly different wording.
- Keep docs aligned with the current codebase and current product behavior.
- Do not invent architecture, workflows, constraints, or capabilities that are not supported by the code or an accepted decision.
- If uncertain, add a clearly marked `TODO` or `Open Questions` section instead of pretending certainty.
- If a code change invalidates an example, screenshot, or setup step, update or remove it in the same change.
- If a document conflicts with code and the correct answer is clear, fix the doc.
- If a document conflicts with code and the correct answer is not clear, flag the conflict explicitly and avoid reinforcing the wrong version.
- Keep documents consolidated. Favor a few strong canonical docs over many shallow fragments.

AI agents should leave the documentation system cleaner than they found it.

## 14. Public-Readiness Standard

Idea-Wall documentation is public ready only when all of the following are true:

- the project overview is clear and accurate
- setup instructions work from a clean environment
- screenshots or product descriptions reflect the current product
- architecture is explained at a level useful to contributors
- the major feature set is documented
- contributor expectations are documented
- release history or changelog exists and is understandable
- there are no internal-only references that confuse external readers
- there are no misleading placeholders, fake examples, or implied capabilities that do not exist

Public-ready does not mean exhaustive. It means credible, current, and usable.

## 15. Definition of Done for Documentation

A feature or system change is documentation-complete when:

- the relevant existing docs were reviewed
- outdated statements were corrected or removed
- changed behavior is documented in the right canonical location
- setup or workflow changes are reflected in `README.md` or contributor docs
- architecture docs were updated if the technical design changed
- release notes were updated for user-visible changes
- screenshots, flows, examples, and commands still match reality
- open questions are explicitly marked instead of hidden
- no duplicate or conflicting doc was introduced

If these checks fail, the documentation is not done.

## 16. Anti-Patterns

Do not do the following:

- do not leave outdated screenshots in active docs
- do not document imaginary features as shipped
- do not scatter critical knowledge across random files
- do not duplicate conflicting setup or workflow instructions
- do not hide important setup steps only in PR comments, issues, or chat
- do not use vague titles
- do not preserve dead docs just because they already exist
- do not mix roadmap ideas into current-state docs without labeling them
- do not write architecture docs that are only diagrams with no explanation
- do not create one-off planning files at the repo root for durable topics

## 17. Maintenance Cadence

Keep documentation review lightweight but regular.

### Ongoing expectations

- review key docs whenever related code changes
- verify `README.md` and setup steps whenever onboarding or environment requirements change
- verify feature docs after major UI or workflow changes
- review architecture docs after notable data flow, rendering, sync, or storage changes
- archive, rewrite, or remove obsolete docs promptly

### Suggested cadence

- review `README.md` and contributor docs monthly during active development
- review feature and architecture docs at each significant milestone or release
- review screenshots and baseline artifacts whenever the product UI meaningfully changes

Good maintenance is routine correction, not periodic documentation overhauls.
