# Wall Product Tour Design

## Purpose

Define a systems-level design for onboarding users to `/wall` through a product tour that includes step-by-step walkthroughs and interactive tooltips.

## Scope

This document covers:

- the core onboarding problem on `/wall`
- assumptions, constraints, and unknowns
- decomposition into sub-problems
- three possible product-tour strategies
- tradeoff analysis and a recommended direction
- a step-by-step execution plan
- failure modes
- post-v1 improvements

This document does not define final implementation code or final UI copy. It is a planning and design artifact for the current `/wall` experience.

## Core Problem

New users land in `/wall` and face a dense spatial workspace with many affordances but weak orientation. They need to understand:

- what the wall is for
- how to create a first note
- where `Tools` lives
- how `Details` changes based on selection
- how the omnibar works
- how to recover when lost using zoom and fit controls

The actual problem is not simply adding tooltips. The problem is reducing time-to-first-success without slowing repeat users, cluttering the wall, or blocking core interactions.

## Assumptions

- Most first-time users will not read instructions before interacting.
- The first 60-90 seconds determine whether `/wall` feels powerful or confusing.
- Users learn faster by doing than by reading.
- Spatial products fail onboarding when they hide state transitions such as `no selection` versus `note selected`.
- Tours must be dismissible, resumable, and non-blocking.
- Mobile and smaller desktop layouts need different anchoring behavior.
- Existing tooltip and floating UI patterns should be reused where possible.

## Constraints And Unknowns

### Constraints

- Floating UI must remain inside the viewport and avoid clipping or overlap regressions.
- Tour UI cannot block panning, zooming, dragging, typing in the omnibar, or panel access.
- `/wall` supports many note kinds, but onboarding should not depend on all of them.
- The wall is local-first, so tour progress should persist locally and may later support sync.
- Keyboard-heavy users should be able to complete the tour without mouse-only traps.

### Unknowns

- Whether the first-run wall is empty, seeded, or personalized
- Whether onboarding is first-visit-only or also used for feature discovery
- Whether analytics are desired for step completion, skip points, and confusion loops
- Whether tours should adapt based on the user's first behaviors
- Whether published or read-only wall variants need separate handling

## Sub-Problems

Break the problem into six sub-systems:

1. Triggering: when the tour appears and when it stays out of the way
2. Targeting: which UI elements and wall states each step depends on
3. Teaching model: passive coachmarks versus guided tasks
4. State orchestration: how steps react to selection, note creation, zoom, and panel state
5. Persistence: how dismissed, completed, paused, and versioned tour state is stored
6. Measurement: how onboarding success is evaluated

## Three Approaches

### 1. Linear Coachmark Tour

A classic fixed sequence such as:

- welcome overlay
- omnibar
- tools
- create note
- details
- zoom
- finish

### 2. Interactive Task-Based Walkthrough

Users complete guided actions such as:

- create a note
- open details
- edit or tag a note
- use search
- fit the wall

### 3. Hybrid Progressive Tour

Start with a short guided spine, then transition into contextual prompts:

- 3-4 critical intro steps
- a small number of action-based first-success steps
- behavior-triggered tooltips later
- optional advanced tours for power features

## Tradeoffs

### Linear Coachmark Tour

Pros:

- fast to ship
- deterministic and easy to QA
- simple mental model

Cons:

- low retention
- easy to skip without learning
- brittle in a spatial UI
- more likely to feel like interruption

### Interactive Task-Based Walkthrough

Pros:

- strongest learning outcome
- aligns with actual activation
- teaches by doing

Cons:

- higher state complexity
- harder recovery when users deviate
- more implementation risk

### Hybrid Progressive Tour

Pros:

- balances guidance and autonomy
- fits a dense workspace better than a long linear tour
- supports both first-run onboarding and later feature discovery

Cons:

- requires stronger step modeling
- needs more event and state coordination than a simple coachmark tour

## Recommended Approach

Choose the hybrid progressive tour.

This is the best fit for `/wall` because:

- the current workspace is too rich for a one-pass static walkthrough
- a pure mission system is heavier than necessary for v1
- a hybrid model teaches the critical operating model early, then gets out of the way

Recommended v1 structure:

- Phase 1: short guided orientation
- Phase 2: first-success action prompts
- Phase 3: contextual nudges after relevant behavior
- Phase 4: replayable on-demand tour entry point

## Step-By-Step Execution

### 1. Define Success Criteria

Activation should mean the user has completed a meaningful first loop, not just viewed steps.

Recommended activation definition:

- create one note
- select it
- open either `Details` or `Tools`
- use either the omnibar or zoom controls

### 2. Define The Core Tour Path

Recommended initial path:

1. orient the user to the wall canvas
2. highlight the bottom omnibar as the primary command and search surface
3. point to `Tools` for note creation
4. guide the user to create a standard note
5. explain that selection changes the available context
6. point to `Details` for note-specific editing
7. show zoom and fit controls as recovery and navigation tools
8. end with optional advanced guidance later

### 3. Separate Step Types

Use three step categories:

- informational steps: anchored tooltip with simple explanation
- action-required steps: wait for user event completion
- recovery steps: offer fallback when the expected target is not available

### 4. Define A Step State Model

Each step should define:

- `id`
- `trigger`
- `target`
- `preconditions`
- `completionEvent`
- `skipBehavior`
- `fallbackBehavior`
- `mobileVariant`
- `copy`
- `placementPriority`

### 5. Create `/wall`-Specific Targeting Rules

Examples:

- If the `Tools` panel is closed, target the `Tools` button instead of a panel interior element.
- If no note is selected, do not show note-detail editing instructions.
- If a tooltip collides with the dock, sidebar, or zoom rail, flip or reposition it.
- For canvas explanation, use a virtual center-of-viewport anchor instead of an arbitrary note.

### 6. Keep The First-Run Tour Short

Recommended v1 limit:

- 4 intro coachmarks
- 2 action-required steps
- 1 completion state

### 7. Add Contextual Follow-Up Prompts

Examples:

- After first note creation: explain double-click to edit
- After first selection: explain that `Details` now reflects the selected note
- After first omnibar use: explain `tag:`, `type:`, `is:`, and `tool:` tokens
- After repeated navigation thrash: surface `Fit`

### 8. Add Persistence And Versioning

Persist:

- dismissed state
- completed state
- last seen step
- tour version
- contextual tips already shown

### 9. Instrument Analytics

Track:

- tour started
- step viewed
- step completed
- step skipped
- tour abandoned
- time to first note
- time to first meaningful action
- replay usage

### 10. QA Against Wall-Specific Constraints

Validate across:

- desktop and mobile
- panels open and closed
- note selected and unselected
- zoomed in and zoomed out
- empty and populated walls
- published or read-only variants if applicable

## Failure Points

High-risk failure points:

- Tooltips anchor to UI that is conditionally hidden.
- The tour blocks panning, dragging, or typing.
- Action-required steps dead-end when the user takes a different route.
- The tour assumes a fresh wall, but the user already has many notes.
- The user dismisses once and cannot easily replay the tour.
- The system teaches advanced note kinds too early.
- Mobile placement collides with the dock, side panels, or zoom rail.
- The copy explains controls but not the operating model.

The most important product risk is teaching chrome instead of teaching the underlying model:

- canvas for thinking
- omnibar for finding and commanding
- tools for creating
- details for refining
- zoom and fit for orientation recovery

## Improvements After V1

Improve in this order:

1. Adaptive entry
   - Skip steps the user has already demonstrated through behavior.
2. Role-based tours
   - Offer different flows for creators, organizers, or research-heavy users.
3. Feature tours
   - Add optional tours for bookmarks, private notes, media notes, timeline, and backlinks.
4. Smarter nudges
   - Trigger only when users hesitate or repeat inefficient behavior.
5. Tour authoring system
   - Move step definitions into configuration so feature teams can add tours without hardcoding logic into the wall root.
6. Analytics-driven pruning
   - Remove or rewrite low-value steps with high abandonment.

## Recommended V1 Tour Script

Use this as the initial script baseline:

1. `This is your wall.`
   - Pan, zoom, and place ideas anywhere. It is spatial, not linear.
2. `Start from the dock.`
   - Use the bottom omnibar to search, filter, or run actions.
3. `Create your first note.`
   - Open `Tools` and add a note.
   - Completion: note created
4. `Selection unlocks context.`
   - Click a note to reveal actions and editing context.
   - Completion: note selected
5. `Refine in Details.`
   - Open `Details` to change note settings, metadata, and type.
   - Completion: details opened with note selected
6. `Use Fit if you get lost.`
   - The zoom rail helps reset your view instantly.
   - Completion: fit used or step dismissed
7. `You are ready.`
   - Advanced guidance can appear later when relevant.

## Related Docs

- [Overview](overview.md)
- [Wall Notes](../features/wall-notes.md)
- [Frontend Architecture](../architecture/frontend-architecture.md)
- [QA Checklist](../qa.md)
## Implemented V1 (2026-03-26)

The current `/wall` implementation ships the hybrid progressive tour with these behaviors:

- first-run local tour persistence keyed by versioned browser storage
- a 5-step guided spine covering wall orientation, canvas model, omnibar, first note creation, and fit-to-wall recovery
- automatic anchoring to live wall chrome for the omnibar, tools panel, details sidebar, zoom rail, and canvas surface
- contextual follow-up tips for selection-driven `Details` behavior and omnibar token discovery
- replay entry points from the wall header and the omnibar command palette

The implementation intentionally stays non-blocking:

- the wall remains interactive during the tour
- action-required steps wait for real user behavior instead of forcing a modal wizard
- dismiss and completion state persist locally so repeat users are not interrupted on every visit

