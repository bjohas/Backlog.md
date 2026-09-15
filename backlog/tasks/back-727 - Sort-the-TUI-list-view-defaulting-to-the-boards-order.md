---
id: BACK-727
title: 'Sort the TUI list view, defaulting to the board''s order'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-15 13:59'
updated_date: '2026-09-15 14:00'
labels: []
dependencies: []
ordinal: 320000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TUI list view renders the identity corpus without re-sorting it, so tasks appear in task-ID order. The board orders by ordinal, which is what drag-and-drop and the reorder commands maintain. Tabbing between the two views therefore reshuffles the same tasks with no explanation, and the ordering a user has deliberately arranged on the board is not available in the list at all. The CLI already exposes the choice through `backlog task list --sort` and `sortTasks()` already implements ordinal, id and priority ordering, so the list view is the only surface with no way to ask for an order. Upstream did not decide on ID order here; it fell out of the corpus being rendered as-is, as the comment added in upstream PR 985 notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The list view orders tasks by ordinal by default, matching the board
- [ ] #2 A key binding cycles the order between ordinal, ID and priority, and the footer names the order currently in effect
- [ ] #3 Ordering goes through the shared sortTasks helper rather than a comparator written for this view
- [ ] #4 Switching order keeps the selected task selected rather than jumping to a different row
- [ ] #5 The help popup lists the new binding
- [ ] #6 Tests cover each order and the selection being preserved across a change
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. footer-content.ts: getTaskListFooterContent takes the active sort and renders an [O] Sort segment naming it.
2. task-viewer-with-search.ts: add LIST_SORT_FIELDS (ordinal, id, priority) and listSortField defaulting to ordinal; sort inside applyFilters() through sortTasks() before the task limit is applied, so a limit keeps the first N in the chosen order.
3. Bind o/O to cycle the field and call applyFilters(); selection survives because applyFilters already restores by task id.
4. help-popup.ts: list the binding.
5. Tests: one per order, plus selection preserved across a change and the limit interacting with order.
<!-- SECTION:PLAN:END -->
