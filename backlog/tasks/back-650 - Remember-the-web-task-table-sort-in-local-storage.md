---
id: BACK-650
title: Remember the web task table sort in local storage
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 21:42'
updated_date: '2026-08-27 21:43'
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
- [x] #1 Changing the sort column or direction persists across a page reload
- [x] #2 Invalid or missing stored values fall back to the ID/desc default
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Initialize sortColumn/sortDirection from localStorage (backlog-tasklist-sort, JSON {column,direction}) with validation against the known column/direction unions.
2. Persist on change via useEffect.
3. Headless verification: click Updated header, reload, assert sort still Updated/desc; corrupt the stored value, reload, assert ID/desc default.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification: default ID/descending; clicking Updated stores {column:updated,direction:desc} and survives reload (aria-sort still descending on Updated); corrupting the stored JSON to bogus values falls back to ID/descending on reload; no page errors. tsc clean; dist rebuilt; tracker restarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Table sort (column + direction) now persists in localStorage with validated restore and ID/desc fallback. Verified headless incl. the corrupt-value path.
<!-- SECTION:FINAL_SUMMARY:END -->
