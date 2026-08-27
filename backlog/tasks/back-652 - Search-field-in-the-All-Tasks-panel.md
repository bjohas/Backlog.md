---
id: BACK-652
title: Search field in the All Tasks panel
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 21:48'
updated_date: '2026-08-27 21:49'
labels: []
dependencies: []
ordinal: 287000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The global search lives in the side navigation, which the maximize overlay covers, so full-screen mode has no search. Add a quick-filter text input to the All Tasks filter row that narrows the table by task ID and title (case-insensitive substring), instantly on the client, available in normal and maximized mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A search input in the filter row narrows visible rows by ID or title substring, case-insensitive, as you type
- [x] #2 The input works while maximized
- [x] #3 The shown count reflects the narrowed rows and clearing the input restores the full list
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add searchText state; filter inside the sortedDisplayTasks memo on id+title lowercase substring.
2. Input first in the left filter group (h-10, styled like the selects) with placeholder Search.
3. Headless verification: type a title fragment, assert rows narrow and count updates, clear restores; repeat while maximized.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification: 'rocket' narrows to the matching title, 'task-2' matches the ID case-insensitively, count shows 'Showing 1 of 4 tasks', clearing restores all rows; same filtering works with the maximize overlay active; no page errors. tsc clean; dist rebuilt; tracker restarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a client-side quick-search input (ID + title substring) to the All Tasks filter row, usable in normal and maximized modes, with the shown count tracking the narrowed rows. Verified headless.
<!-- SECTION:FINAL_SUMMARY:END -->
