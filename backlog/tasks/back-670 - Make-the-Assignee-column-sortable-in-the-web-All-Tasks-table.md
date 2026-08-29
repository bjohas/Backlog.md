---
id: BACK-670
title: Make the Assignee column sortable in the web All Tasks table
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 15:59'
updated_date: '2026-08-29 16:01'
labels: []
dependencies: []
ordinal: 305000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Assignee (and Labels) render as plain, non-sortable headers - never wired up, not a regression. Add Assignee sorting, comparing by the task's first assignee (case-insensitive, numeric-aware collator already used for title/milestone), with unassigned tasks sorting consistently to one end.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking the Assignee header sorts the table by assignee, ascending by default, with the same asc/desc toggle as other columns
- [x] #2 Unassigned tasks sort together, consistently at one end regardless of direction
- [x] #3 Sorting by Assignee round-trips through the URL and localStorage the same way other columns already do
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add "assignee" to TaskSortColumn and TASK_SORT_COLUMNS.
2. Comparator case using the existing collator on task.assignee[0] ?? "", mirroring the milestone case.
3. Swap the plain Assignee <th> for renderSortableHeader("Assignee", "assignee").
4. Headless: click Assignee header, verify order and URL/localStorage persistence; verify unassigned tasks group together.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed root cause first: Assignee (and Labels) simply had a plain <th>, never wired to renderSortableHeader - not a regression, a gap in the original column set. Verified live on the tracker (184 tasks, 181 unassigned): clicking Assignee sets ?sort=assignee&dir=asc; the 181 unassigned rows (shown as "—") group fully contiguously at the start ascending and at the end descending, with assigned tasks (initials shown) at the other end; URL updates to sort=assignee&dir=desc on the second click; a plain /tasks reload afterward restores Assignee as the active sort from localStorage, confirming it round-trips through both BACK-669 (URL) and BACK-650 (localStorage) unchanged. tsc clean; build succeeds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Assignee is now a sortable column (first assignee, case-insensitive, unassigned tasks grouped consistently at one end), wired through the same renderSortableHeader/URL/localStorage machinery as every other column. Verified against the tracker's real 184-task corpus in both directions.
<!-- SECTION:FINAL_SUMMARY:END -->
