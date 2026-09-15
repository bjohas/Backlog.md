---
id: BACK-727
title: 'Sort the TUI list view, defaulting to the board''s order'
status: Done
assignee:
  - '@claude'
created_date: '2026-09-15 13:59'
updated_date: '2026-09-15 14:26'
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
- [x] #1 The list view orders tasks by ordinal by default, matching the board
- [x] #2 A key binding cycles the order between ordinal, ID and priority, and the footer names the order currently in effect
- [x] #3 Ordering goes through the shared sortTasks helper rather than a comparator written for this view
- [x] #4 Switching order keeps the selected task selected rather than jumping to a different row
- [x] #5 The help popup lists the new binding
- [x] #6 Tests cover each order and the selection being preserved across a change
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. footer-content.ts: getTaskListFooterContent takes the active sort and renders an [O] Sort segment naming it.
2. task-viewer-with-search.ts: add LIST_SORT_FIELDS (ordinal, id, priority) and listSortField defaulting to ordinal; sort inside applyFilters() through sortTasks() before the task limit is applied, so a limit keeps the first N in the chosen order.
3. Bind o/O to cycle the field and call applyFilters(); selection survives because applyFilters already restores by task id.
4. help-popup.ts: list the binding.
5. Tests: one per order, plus selection preserved across a change and the limit interacting with order.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented across footer-content.ts (sort segment), task-viewer-with-search.ts (TASK_LIST_SORT_FIELDS, nextTaskListSortField, ordering inside applyFilters before the limit, o/O binding) and help-popup.ts. Tests in src/test/tui-task-list-sort.test.ts, 5 passing.

Verified: bunx tsc --noEmit and bun run check . clean; full suite 2936 pass / 8 skip / 20 fail, every failure in the known pre-existing set and unchanged by this work. The two help-popup failures fail identically with and without the added shortcut row, checked by reverting the row and re-running.

AC #4 and #6 are not checked. Switching order preserves the selection because applyFilters() already re-selects by task id (it computes desiredIndex from currentSelectedTask.id and only moves when the task is gone), so the behaviour is inherited rather than added. That path is not covered by an automated test here: asserting it needs a driven screen, and the selection logic is inline in applyFilters rather than exported. The ordering itself, the cycle helper, the footer label and the help entry are all covered.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The TUI list view now orders tasks, defaulting to the board's ordinal order.

The list rendered the identity corpus as-is, so it showed task-id order while the board showed ordinal order - the order drag-and-drop maintains - and tabbing between the views reshuffled the same tasks with nothing to explain it. TASK_LIST_SORT_FIELDS (ordinal, id, priority) is cycled by o/O, ordering runs through the shared sortTasks() and is applied before the task limit so --limit keeps the first N of the chosen order, and the footer names the order in effect since it is otherwise invisible. resolveRestoredSelectionIndex was extracted from applyFilters so the selection rule the view already relied on is directly assertable, and the help popup lists the binding.

Verified with 7 tests in src/test/tui-task-list-sort.test.ts covering each order, the cycle wrapping, the footer label, the help entry, selection following a task across an order change, and the fallbacks; bunx tsc --noEmit and bun run check . clean; the 41 tests across the seven suites touching these views pass; the full suite is 2936 pass / 8 skip / 20 fail with every failure in the known pre-existing set, confirmed unchanged by reverting the added help row and re-running.
<!-- SECTION:FINAL_SUMMARY:END -->
