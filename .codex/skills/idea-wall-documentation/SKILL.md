---
name: idea-wall-documentation
description: Create, update, restructure, review, or gate documentation work for the Idea-Wall repository. Use when Codex needs to write or maintain production-style docs for this project, or when making code changes that may affect README, features, architecture, APIs, runbooks, contributor workflow, or release notes.
---

# Idea-Wall Documentation Skill

## Purpose

Document Idea-Wall as a serious product.

Treat documentation as part of shipping quality, not follow-up cleanup. Keep docs accurate enough for onboarding, maintenance, debugging, release communication, and eventual public/open-source use.

Idea-Wall is brain RAM: a visual system for capturing, organizing, and interacting with notes, thoughts, and ideas across wall, timeline, search, export, and related workflows.

## Must Read Before Code Changes

Read this skill before making meaningful code changes in this repository.

This is not only a writing skill. It is also the documentation gate for implementation work.

Before changing code, contributors and AI agents must:

1. check the canonical docs for the affected area
2. identify what documentation would become stale if the change ships
3. update the affected docs in the same change whenever possible

If a code change would alter behavior, structure, naming, routing, storage, APIs, setup, debugging flow, or contributor workflow, this skill applies.

## Use This Skill To

- update `README.md`
- add or revise product docs
- add or revise architecture docs
- document a feature or subsystem
- record an architectural or product decision
- write a debugging or recovery runbook
- write release notes or changelog entries
- clean up duplicate, stale, or scattered docs
- assess doc impact before or during code changes

## Core Rules

- Make docs match the current codebase and shipped behavior.
- Update docs in the same change as the code whenever possible.
- Prefer editing the canonical doc over creating a new file.
- Keep one source of truth per topic.
- Prefer clarity over cleverness.
- Keep docs concise, but do not omit behavior, constraints, or failure cases that matter.
- Use examples when they make behavior easier to understand.
- Mark uncertain items explicitly as `Open Questions`, `TODO`, or `Proposed Change`.
- Do not invent unsupported architecture claims, workflows, or shipped features.

## Documentation Standard

Production-style documentation in this repo means:

- current, not aspirational
- structured for fast navigation
- stable in naming and placement
- specific about behavior and constraints
- credible to an external reader
- usable by both humans and coding agents

## Canonical Doc Map

Use these locations by default.

- `README.md`: public project overview, setup, run/build/validate, key links
- `docs/product/`: product vision, user flows, UX rules, information model
- `docs/architecture/`: system design, rendering, state, storage, sync, data flow
- `docs/features/`: durable feature-specific behavior and constraints
- `docs/api/`: explicit contracts, payload shapes, import/export formats
- `docs/decisions/`: ADRs and durable decision records
- `docs/runbooks/`: operational debugging and recovery procedures
- `docs/contributing/`: contributor workflow and repo standards
- `docs/releases/`: changelog and release notes
- `docs/baselines/`: dated screenshots or baseline artifacts with brief context
- `docs/archive/`: preserved historical material that is not current source of truth

If a topic already has a canonical doc, update it instead of creating a parallel file.

## Naming Rules

- Use lowercase kebab-case filenames.
- Keep one topic per file.
- Use descriptive subject names such as `timeline-view.md` or `state-and-storage.md`.
- Use numbered filenames only for ordered records such as ADRs: `0001-local-first-sync.md`.
- Use date-based names only when the date is the organizing key, such as `2026-03.md`.
- Do not create vague files such as `notes.md`, `misc.md`, `final-v2.md`, or `updated-plan.md`.

## Writing Rules

Start with context and scope. Then explain behavior, constraints, edge cases, and known limitations.

Prefer this section order when it fits:

1. Purpose
2. Scope
3. Current Behavior or Design
4. Data and State
5. Edge Cases or Failure Modes
6. Limitations
7. Related Docs

Additional rules:

- Distinguish facts from proposals.
- Use headings that make scanning easy.
- Prefer short paragraphs and flat lists.
- Use tables only when comparison is clearer in table form.
- Avoid marketing language in technical docs.
- Document user-visible behavior precisely.
- Include commands, examples, screenshots, or flows only when they improve understanding.

## Idea-Wall Coverage Expectations

When relevant, document behavior for:

- note creation, editing, movement, and selection
- note types, metadata, tags, and links
- wall view, timeline view, and search flows
- pan, zoom, focus, layering, and overlays
- storage, sync, export, publish, and recovery behavior
- uploads, parsing, or conversion behavior
- keyboard shortcuts and power-user workflows

## Update Triggers

Update documentation when any of the following changes:

- user-visible feature behavior
- UI or UX flows
- setup steps or environment requirements
- schemas, contracts, or persisted state
- naming, routing, or information architecture
- architecture or data flow
- debugging or recovery procedures
- release behavior, migration needs, or known issues

If a document becomes stale, correct it, archive it clearly, or remove it.

## Pre-Change Doc Impact Check

Before coding, ask these questions:

- Which canonical doc owns the area I am about to change?
- What statement in the docs becomes wrong if this ships?
- Does this change affect product behavior, API behavior, storage shape, setup, or recovery?
- Does `README.md` need to change?
- Does `docs/qa.md` need new or updated steps?
- Does the changelog need an entry?

If the answer to any of these is yes or maybe, documentation work is part of the task.

## Workflow

Follow this sequence when doing documentation work or code changes with documentation impact.

1. Inspect the existing docs for the topic.
2. Identify the canonical file that should own the change.
3. Read the relevant code if behavior is unclear.
4. Update the canonical doc instead of creating a duplicate.
5. Add a new doc only when the topic lacks a stable home.
6. Link related docs rather than repeating the same explanation.
7. Remove or rewrite stale statements discovered during the change.
8. Update release docs if the change is user-visible.
9. Update `docs/qa.md` if validation behavior changed.

## Preferred Structure for This Repo

Use this tree as the target shape over time:

```text
README.md
.codex/
  skills/
    idea-wall-documentation/
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
    state-and-storage.md
    wall-rendering-model.md
    decks-data-model.md
  features/
    quick-capture.md
    search-and-retrieval.md
    timeline-view.md
    wall-notes.md
    page-editor.md
    decks.md
    settings.md
  api/
    walls.md
    decks.md
    page.md
    account.md
    convert.md
  decisions/
    0001-local-first-with-cloud-sync.md
  runbooks/
    sync-debugging.md
    page-file-storage-debugging.md
    local-storage-reset-and-recovery.md
  contributing/
    development-workflow.md
  releases/
    changelog.md
  archive/
    README.md
```

Move existing flat docs toward this structure when touching them meaningfully. Do not churn files without a reason.

## Templates

### Feature Doc

```md
# Feature Name

## Purpose

## Scope

## Behavior

## Data and State

## Edge Cases

## Limitations

## Related Docs
```

### Architecture Doc

```md
# Topic Name

## Purpose

## Scope

## Design

## Constraints

## Failure Modes

## Related Docs
```

### Decision Record

```md
# 000X Decision Title

## Status
Accepted | Proposed | Superseded

## Context

## Decision

## Alternatives Considered

## Consequences
```

### Runbook

```md
# Runbook Name

## When to Use

## Preconditions

## Steps
1. First step
2. Verify
3. Recover

## Expected Outcome

## Escalation
```

### Release Note

```md
# Release YYYY-MM-DD

## Summary

## Added

## Changed

## Fixed

## Migration or Upgrade Notes

## Known Issues
```

## Definition of Done

Documentation work is done when:

- the relevant canonical docs were reviewed
- changed behavior is documented in the right place
- stale or conflicting statements were corrected or removed
- setup and workflow docs still match reality
- architecture docs were updated if design changed
- release docs were updated for user-visible changes
- examples, screenshots, and commands remain accurate
- open questions are clearly marked instead of implied away
- `docs/qa.md` was updated when validation behavior changed

## Anti-Patterns

- do not document planned work as shipped
- do not duplicate conflicting instructions
- do not scatter critical knowledge across random files
- do not leave important setup steps only in PR comments or chat
- do not keep outdated screenshots in active docs
- do not create disposable file names
- do not preserve dead docs that now mislead contributors in active doc folders

## AI Agent Rules

- Read this skill before making meaningful code changes in the repo.
- Check for related docs before making code or doc changes.
- Prefer updating existing docs over adding new scattered ones.
- Keep docs aligned with the current repository state.
- If code and docs conflict and the answer is clear, fix the doc.
- If the answer is not clear, call out the conflict explicitly.
- Run the pre-change doc impact check before implementation.
- Leave the doc system cleaner than you found it.
