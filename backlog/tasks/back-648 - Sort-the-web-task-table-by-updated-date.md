---
id: BACK-648
title: Sort the web task table by updated date
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 21:24'
updated_date: '2026-08-27 21:25'
labels: []
dependencies: []
ordinal: 283000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The All Tasks table sorts by Created but has no Updated column. Add a sortable Updated column (compact date like Created), sorting by updatedDate with createdDate as the effective value for never-edited tasks so they order sensibly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The table shows an Updated column rendering the task's last-change date (creation date when never edited)
- [x] #2 Clicking the Updated header sorts by that date, defaulting to newest first, with the same asc/desc toggle as other columns
- [x] #3 Existing columns and sorts are unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend TaskSortColumn with updated; default direction desc like created.
2. Append a 6rem width for the Updated column; update the width-order comment.
3. Comparator case updated using updatedDate ?? createdDate.
4. Header cell via renderSortableHeader after Created; body cell with compact-formatted effective date.
5. Headless verification: click Updated header, assert row order matches effective updated dates both directions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification: header row now ID/Title/Status/Priority/Ordinal/Labels/Assignee/Milestone/Created/Updated with Updated sortable; first click sorts desc and row order matches the API-derived updatedDate-with-createdDate-fallback order exactly; second click reverses (undated fixture task stays last both ways); no page errors. tsc clean; dist rebuilt; tracker restarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a sortable Updated column (effective value = updatedDate, falling back to createdDate) to the web All Tasks table, defaulting to newest first. Verified by headless click-through against the built binary.
<!-- SECTION:FINAL_SUMMARY:END -->
