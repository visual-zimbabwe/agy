# Help / Docs Upgrade Plan

## Purpose

Define a systems-level plan for upgrading the `Help / Docs` entry in the profile dropdown from a duplicate shortcuts overlay into a centralized self-serve help system.

## Scope

This document covers:

- the core product problem
- assumptions
- constraints and unknowns
- decomposition into sub-problems
- three possible approaches
- tradeoff analysis and a recommended direction
- a step-by-step execution plan
- failure points
- post-v1 improvements

This document does not define final implementation code or final UI copy.

## Core Problem

The current `Help / Docs` entry is not a help system. It is a duplicate trigger for the keyboard shortcuts modal. That means the product promises a place to find answers and solve problems independently, but instead returns a narrow utility reference.

The actual problem is not just missing content. The product lacks a centralized in-product answer layer for:

- task guidance
- troubleshooting
- workflow discovery
- recovery when users get stuck

## Assumptions

- Most users open help when blocked, not to browse long-form documentation casually.
- The highest-value help content is task-oriented and problem-oriented.
- Keyboard shortcuts are useful, but they are only one subsection of help.
- The help system should work without forcing users to leave the wall for routine questions.
- Documentation will continue to evolve, so content ownership and update workflow matter as much as the UI.

## Constraints And Unknowns

### Constraints

- `Help / Docs` currently launches from the profile dropdown, so entry should remain lightweight.
- The wall already contains dense floating UI, so help cannot introduce clipping, overlap, or obstruction regressions.
- The repository documentation model prefers one canonical source of truth per topic.
- User-visible behavior changes should update canonical docs and QA guidance in the same change.

### Unknowns

- Should help be wall-first in v1 or product-wide across Wall, Page, Decks, and Settings?
- Does v1 need keyword search, or is browse-first acceptable?
- Should usage analytics be tracked for help opens, article clicks, and unresolved exits?
- Should troubleshooting include account, sync, and storage recovery from existing runbooks?

## Sub-Problems

Break the problem into six sub-systems:

1. Information architecture
   - What content types exist and how they are grouped.
2. Entry UX
   - Whether help opens as a modal, panel, route, or hybrid.
3. Content model
   - Whether content lives in static config, docs-backed files, or another structured format.
4. Search and navigation
   - Whether users browse categories, search by keyword, or both.
5. Contextual relevance
   - Whether help is generic or can recommend answers based on current route and state.
6. Governance
   - How help stays aligned with shipped behavior over time.

## Three Approaches

### 1. Expanded Modal

Replace the current shortcuts overlay with a richer tabbed modal containing:

- overview
- shortcuts
- how-to guides
- troubleshooting

### 2. Dedicated Help Center Route

Open a full `/help` route from `Help / Docs` with:

- categories
- article pages
- search
- links into related product surfaces

### 3. Hybrid Help System

Keep a lightweight in-product help entry for quick answers, but back it with deeper canonical help content and route-based article browsing.

## Tradeoffs

### Expanded Modal

Pros:

- fastest to ship
- lowest engineering cost
- minimal routing and navigation work

Cons:

- weak long-term scalability
- easy to turn into another dumping ground
- poor fit for deep troubleshooting or article discovery

### Dedicated Help Center Route

Pros:

- strongest long-term information architecture
- cleanest support for search and article depth
- easier to scale across all product surfaces

Cons:

- higher implementation cost
- more user friction for quick in-context answers
- weaker for users who want immediate guidance without leaving the wall

### Hybrid Help System

Pros:

- balances quick answers with durable knowledge architecture
- supports in-context help without sacrificing depth
- matches the repo's preference for canonical docs rather than duplicate UI copy

Cons:

- requires more deliberate content modeling
- needs both a lightweight help surface and a deeper browsing experience

## Recommended Approach

Choose the hybrid help system.

This is the best fit because:

- the current issue is both a UX problem and a system-design problem
- users need a fast answer layer while working
- the product also needs a durable and maintainable help repository
- a hybrid model allows shortcuts to remain useful without pretending they are the entire help system

## Step-By-Step Execution

### 1. Define The V1 Help Jobs

V1 should answer:

- How do I do X?
- Why did Y happen?
- How do I recover from Z?

### 2. Define V1 Content Sections

Recommended sections:

- getting started
- core workflows
- keyboard shortcuts
- troubleshooting
- settings and account help

### 3. Define Canonical Ownership

Add a canonical feature doc for the help surface and link to deeper docs and runbooks rather than duplicating every explanation inline.

### 4. Define The Content Model

Each help article should define:

- `id`
- `title`
- `summary`
- `category`
- `keywords`
- `body`
- `relatedLinks`
- optional route or context tags

### 5. Build Two Presentation Layers

Use:

- a quick help modal or panel launched from the profile menu
- a deeper route-based help center for full article browsing

### 6. Reframe Shortcuts As A Section

Keep keyboard shortcuts, but move them under the broader help system instead of treating them as the same thing as help.

### 7. Seed High-Value V1 Content

Start with the most common user tasks and issues:

- creating notes
- finding tools, details, and search
- import and export basics
- account and settings basics
- local storage and sync recovery

### 8. Add Contextual Entry Points Later

After the base help surface exists, add targeted entry points from:

- empty states
- error messages
- failed actions
- relevant settings sections

### 9. Update Docs And QA Together

Treat help as a real feature with canonical docs and updated QA coverage.

### 10. Measure Usefulness

Track:

- help opens
- article clicks
- searches
- exits without interaction
- unresolved help loops

## Failure Points

High-risk failure points:

- Help becomes another duplicate content island instead of using canonical docs.
- The quick surface turns into a long, unscannable wall of text.
- Content is organized by internal feature names instead of user tasks and problems.
- Troubleshooting content is too shallow to resolve real issues.
- The help system goes stale because there is no ownership or update trigger.
- Search gets added later to a content model that was not designed for categorization and keywords.
- The help UI obscures important wall controls or fails viewport visibility requirements.

The main product risk is solving for labels rather than user outcomes. Renaming the menu item is easy. Building a reliable self-serve support system is the actual requirement.

## Improvements After V1

Improve in this order:

1. Add search
   - Support synonyms, task phrasing, and problem phrasing.
2. Add context-aware recommendations
   - Suggest relevant help based on route, panel state, or recent action.
3. Add action links inside help
   - For example, open Settings or Export directly from an article.
4. Track unresolved searches
   - Use failed queries to drive article creation.
5. Deepen troubleshooting coverage
   - Reuse existing runbooks for sync, storage, and recovery guidance.
6. Connect onboarding and help
   - Link product tour recovery states to relevant help articles.
7. Unify discovery systems over time
   - Move toward one support and discovery system spanning onboarding, help, and troubleshooting.

## Related Docs

- [Overview](overview.md)
- [Settings](../features/settings.md)
- [Wall Product Tour Design](wall-product-tour-design.md)
- [QA Checklist](../qa.md)
