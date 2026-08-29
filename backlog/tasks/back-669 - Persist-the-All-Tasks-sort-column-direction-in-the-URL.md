---
id: BACK-669
title: Persist the All Tasks sort column/direction in the URL
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 14:13'
updated_date: '2026-08-29 14:15'
labels: []
dependencies: []
ordinal: 304000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sort state (BACK-650) is remembered in localStorage but not reflected in the URL, so a link to /tasks cannot capture "sorted by Updated desc" the way it already captures status/priority/label/milestone filters. Add sort and dir query params, following the same syncUrl rebuild pattern the filters already use: URL wins over localStorage on initial load when present and valid, localStorage remains the fallback for a plain /tasks visit, and the base id/desc default keeps the URL clean by omitting both params.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Changing the sort column or direction updates the URL with sort and dir params (both present together, or both absent at the default id/desc sort)
- [x] #2 Loading a URL with valid sort/dir params applies that sort on open, taking priority over the localStorage value
- [x] #3 An invalid or partial sort/dir param falls back to localStorage, then the id/desc default
- [x] #4 Existing filter params (status, priority, label, milestone) are unaffected by a sort change and vice versa
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a URL-aware initial-sort resolver: sort/dir params (validated against the known column/direction unions) win over localStorage, which wins over the id/desc default.
2. Extend syncUrl to accept sortColumn/sortDirection and include both sort+dir together only when not at the id/desc default; update all 6 existing call sites to pass current sort values so they are not wiped on a filter change.
3. Call syncUrl from handleSortChange with the newly computed column/direction alongside the current filters.
4. Headless: default url clean; click Updated -> url gets sort=updated&dir=desc; reload with a crafted url wins over a different localStorage value; malformed params fall back; changing a filter afterward preserves the sort params and vice versa.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification against the tracker: default /tasks URL carries no sort params; clicking Updated sets ?sort=updated&dir=desc, clicking again flips to dir=asc, both reflected live in the URL; opening ?sort=title&dir=asc applies Title/ascending even though localStorage held updated/asc from the prior steps, confirming URL priority; opening ?sort=bogus&dir=sideways falls back to the localStorage value (Title/ascending) rather than erroring or defaulting outright; applying a status filter afterward preserves the sort params in the same URL (status=To+Do&sort=updated&dir=desc) and vice versa, confirming the two axes do not clobber each other via syncUrls full-rebuild. tsc clean; build succeeds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sort column/direction now round-trip through the URL (sort/dir params), following the same syncUrl pattern the existing status/priority/label/milestone filters use: URL wins on load when valid, falls back to the existing localStorage persistence, and the id/desc default keeps the URL clean by omitting both params together. Verified headless including the URL-over-localStorage precedence and coexistence with filter params.
<!-- SECTION:FINAL_SUMMARY:END -->
