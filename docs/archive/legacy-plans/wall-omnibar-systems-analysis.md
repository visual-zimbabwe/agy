# Wall Omnibar Systems Analysis

## Context

The current `/wall` dock presents a search bar affordance, but the actual interaction is:

`click fake input -> open separate global palette -> search there`

That creates a model mismatch.

The deeper product problem is broader than redundant UI:

The wall lacks a single, first-class control surface for retrieval and navigation.

The intended bar should:

- find notes by content
- filter by tags
- filter by note type
- trigger wall actions
- open tools
- open details
- act as the main command surface for `/wall`

That means this is not just search UI. It is the wall's universal interaction bus.

## 1. Core Problem

The current interaction duplicates search intent across two surfaces:

- a dock element that looks like a usable search field
- a separate modal palette that contains the real input

This creates unnecessary indirection for the primary user goal of finding and navigating notes. The system needs one first-class omnibar that supports retrieval, filtering, and wall actions without forcing a mode switch into a second UI.

## 2. Assumptions

- The main user intent on `/wall` is retrieval and navigation, not command execution.
- Search needs to feel direct and immediate, not modal-first.
- Filters should persist visibly while searching.
- Commands like opening Tools and Details belong in the same surface, but should not dominate note retrieval.
- The wall can hold enough notes that search and filtering need to be fast and legible.
- Mobile and desktop both matter.
- Existing keyboard shortcut behavior like `Ctrl/Cmd + K` is still valuable.

## 3. Constraints And Unknowns

### Constraints

- `/wall` already has separate state for search modal, tools panel, and details panel.
- Visible notes and filtered notes already drive other parts of the wall.
- Private notes are intentionally excluded from search.
- The wall already has heavy spatial UI, so any new control must avoid covering critical canvas interactions.
- Overlay visibility and clipping constraints are explicitly part of repo QA expectations.

### Unknowns

- Should search affect only viewport-visible notes or the full wall dataset?
- Should filtering hide non-matches on canvas, dim them, or only list matches in results?
- Should queries persist in URL, local storage, or only session state?
- How much syntax complexity is acceptable: chips only, natural language, or command tokens?
- Should tools and details be commands, toggles, tabs, or actions within the same bar?

## 4. Sub-Problems

### 1. Input model

The bar must support plain text search, structured filters, and actions without becoming confusing.

### 2. Result model

The system must distinguish:

- search matches
- active filters
- executable actions
- panel toggles

### 3. State model

The wall needs a unified query state instead of separate search modal state and scattered filter controls.

### 4. Visual model

The dock has to remain compact by default but expand when active without feeling like a mode switch.

### 5. Performance model

Search and filtering must remain responsive as notes scale.

### 6. Selection and navigation model

Choosing a result should focus, select, and reveal the note predictably.

## 5. Three Approaches

## Approach 1: Inline Smart Search Bar With Expandable Results

The dock itself becomes a real input. On focus, it expands into a structured panel below or above the bar.

Capabilities:

- type free text immediately
- tag chips and note-type chips appear inline or in the expanded panel
- top area shows active filters
- lower area shows matching notes and actions
- actions like `Open Tools`, `Open Details`, and `Create Note` live in a secondary section

Behavior:

- click bar -> cursor appears in the same bar
- type -> live filtering starts
- arrow keys navigate
- enter opens selected result
- filter chips persist until cleared

This is effectively Spotlight, but integrated into the dock.

## Approach 2: Query Builder + Results Drawer

The bottom dock becomes a persistent control panel with explicit fields:

- search input
- tags filter
- note type dropdown
- toggles for Tools and Details
- results drawer or side rail

Behavior:

- less command-palette-like
- more dashboard/filter-panel-like
- better for clarity, worse for speed

This is strong for explicitness but weaker for fast universal interaction.

## Approach 3: Hybrid Omnibar With Query Tokens

The bar accepts text plus structured tokens:

- `tag:project`
- `type:quote`
- `tool:details`
- `is:pinned`

As the user types, autocomplete suggests tokens, tags, note types, and actions.

Behavior:

- power users get one grammar
- beginners rely on suggestions and chips
- results include notes and actions in grouped sections

This is the most scalable model conceptually, but also the hardest to make approachable.

## 6. Tradeoffs

## Approach 1: Inline Smart Search

Pros:

- fixes the fake-input problem directly
- most natural for click-and-type behavior
- keeps retrieval primary
- easy to mix filters and actions without forcing syntax
- visually compatible with the current dock metaphor

Cons:

- needs careful UI design to avoid becoming cluttered
- requires a unified search and filter state refactor
- can grow into a mini-workspace if not constrained

## Approach 2: Query Builder

Pros:

- explicit and easy to understand
- low ambiguity
- straightforward for tags, types, and toggles

Cons:

- feels heavier and less fluid
- worse keyboard ergonomics
- less elegant as a universal interaction surface
- likely to consume too much persistent screen space

## Approach 3: Tokenized Omnibar

Pros:

- most extensible long-term
- strongest one-bar-can-do-anything model
- excellent for advanced workflows

Cons:

- highest learning curve
- easiest to over-engineer
- requires stronger parsing, suggestion ranking, and UX polish to avoid confusion

## 7. Best Approach

Approach 1 is the best v1.

Reasoning:

- It solves the current mismatch immediately.
- It aligns with the primary use case: find notes first.
- It still allows filters and actions in the same surface.
- It is easier to learn than a token grammar.
- It creates a clean path to evolve into Approach 3 later.

The recommended direction is:

A real omnibar dock that is directly editable, expands on focus, prioritizes note retrieval, and includes structured filters and wall actions in one unified surface.

## 8. Step-By-Step Execution

1. Define a unified wall query model.
   Include:
   - text query
   - selected tags
   - selected note types
   - scope flags if needed
   - selected result index
   - open and closed state
2. Replace the fake button with a real input.
   The existing dock should contain an actual input element, not a button styled like one.
3. Expand in place on focus.
   Use an anchored panel with:
   - top: search input
   - next: active filter chips
   - next: quick filter controls for tags and note type
   - next: grouped results
4. Separate result groups by intent.
   Use fixed sections:
   - Notes
   - Filters or suggested filters
   - Actions
5. Make actions explicit but secondary.
   Actions like `Open Tools` and `Open Details` should exist, but not compete visually with note matches.
6. Unify search and filtering pipeline.
   One derivation layer should produce:
   - filtered note set for wall state
   - ranked result list for the omnibar
   - visible active filters for UI
7. Decide wall effect behavior.
   Recommended v1:
   - search results list drives navigation
   - filters affect wall visibility or dimming
   - plain text search does not immediately hide everything unless the user commits a filter or search mode
8. Preserve keyboard workflow.
   - `Ctrl/Cmd + K` focuses the omnibar
   - `Esc` collapses it if empty, otherwise clears selection or closes the panel
   - arrow keys navigate results
   - enter activates result
   - backspace removes the last chip if input is empty
9. Update panel toggles into omnibar actions.
   Tools and Details remain separate panels, but can be opened from the omnibar.
10. Remove the modal palette.
    Once the inline omnibar is stable, delete the separate search modal path instead of maintaining two competing systems.

## 9. Failure Points

- Mixed intent confusion
  Users may not understand whether typing searches notes, filters notes, or triggers actions.
  Mitigation: grouped results, note-first ranking, explicit labels.
- Overloaded UI
  Trying to expose every capability at once can turn the dock into a control monster.
  Mitigation: compact default state, progressive disclosure on focus.
- Poor ranking
  If actions outrank notes, the bar becomes irritating.
  Mitigation: rank notes first by default; actions only rise for exact intent.
- Filter and search ambiguity on wall
  If typing instantly hides most of the wall, users may feel lost.
  Mitigation: distinguish between preview results and committed filters.
- State sprawl
  If omnibar state, wall filter state, and panel state remain separate, behavior will drift.
  Mitigation: centralize into one query controller.
- Mobile usability
  An expanded omnibar can clash with limited screen space.
  Mitigation: on mobile, expand into a sheet anchored from bottom while keeping the same model.

## 10. Improvements After V1

- Add token suggestions gradually.
  Examples: `tag:`, `type:`, `is:`, `has:`
- Add saved searches.
  Useful for recurring wall contexts and retrieval workflows.
- Add semantic ranking.
  Weight title, tags, note type, recency, pinned and highlighted status.
- Add result previews.
  Show note type, tags, and last edited date where useful.
- Add query persistence.
  Remember the last active query and filter set per wall session if that fits usage.
- Add command aliases.
  `details`, `open details`, and `inspector` should resolve to the same action.
- Add search mode vs filter mode clarity only if needed.
  Avoid adding modes prematurely.

## Recommendation

Treat this as an omnibar redesign, not a search tweak. The current palette architecture can still inform the result engine, but the interaction should move from modal-first to dock-first.
