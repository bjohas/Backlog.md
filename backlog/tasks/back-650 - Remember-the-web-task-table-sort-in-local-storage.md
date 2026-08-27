---
id: BACK-650
title: Remember the web task table sort in local storage
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 21:42'
updated_date: '2026-08-27 21:42'
labels: []
dependencies: []
ordinal: 285000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The All Tasks table resets to ID/desc on every load. Persist the selected sort column and direction in localStorage (validated against known columns) so the sort survives reloads, matching the maximize-state persistence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Changing the sort column or direction persists across a page reload
- [ ] #2 Invalid or missing stored values fall back to the ID/desc default
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Initialize sortColumn/sortDirection from localStorage (backlog-tasklist-sort, JSON {column,direction}) with validation against the known column/direction unions.
2. Persist on change via useEffect.
3. Headless verification: click Updated header, reload, assert sort still Updated/desc; corrupt the stored value, reload, assert ID/desc default.
<!-- SECTION:PLAN:END -->
