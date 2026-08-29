---
id: BACK-668
title: Rename the All Tasks panel search placeholder to describe what it matches
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 14:03'
updated_date: '2026-08-29 14:04'
labels: []
dependencies: []
ordinal: 303000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The panel search input (BACK-652) has the generic placeholder "Search", indistinguishable from the sidebar ⌘K search. It filters by task ID and title (substring, case-insensitive); rename the placeholder to say so.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The panel search placeholder describes exactly what it filters by (ID and title)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Panel search matches task.id and task.title substrings (checked source); placeholder now says exactly that. Verified live on the tracker: renders as "Filter by ID or title", sidebar ⌘K box unaffected.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All Tasks panel search placeholder changed from generic "Search" to "Filter by ID or title", matching what it actually filters and distinguishing it from the sidebar ⌘K search.
<!-- SECTION:FINAL_SUMMARY:END -->
