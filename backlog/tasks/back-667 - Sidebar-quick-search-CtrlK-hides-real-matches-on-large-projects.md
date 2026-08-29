---
id: BACK-667
title: Sidebar quick search (Ctrl+K) hides real matches on large projects
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 13:51'
updated_date: '2026-08-29 13:53'
labels: []
dependencies: []
ordinal: 302000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The sidebar quick-search filters results to score <= 0.45 before display. Fuse.js computes that score as a weighted blend across multiple keys (title, bodyText, id, idVariants, dependencyIds, modifiedFiles); a result that matches well on one field but poorly on others gets a blended score well above 0.45 even for an exact substring hit in the title. On a small demo project this rarely bites (short text keeps blended scores low), but on a project the size of the tracker (170+ tasks with long descriptions) a plain single-word search for a task's own title (e.g. "Local" against "Local control API") scores 0.54 - filtered out, hidden. The server (Fuse's own threshold: 0.35) has already decided these are matches by including them in the response at all; the client's extra absolute cutoff only ever removes results the server found relevant, and the result list is already capped by sort+slice(0,5), so the filter is redundant at best.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A single-word search for text that appears verbatim in a task title returns that task in the sidebar quick-search results on a large project corpus
- [x] #2 Result ordering (best score first) and the 5-result cap are unchanged
- [x] #3 A query with no real matches still shows the empty-results state
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove the score <= 0.45 filter in SideNavigation.tsx unifiedSearchResults; keep the sort-by-score and slice(0, 5).
2. Verify against the tracker's real corpus: a plain title-word search that was previously hidden now appears; sort order and cap unchanged; a nonsense query still yields zero results (the server already gates that).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed pre-existing upstream code (git log shows the 0.45 filter predates this fork by ~150+ commits) - not something this fork introduced, just surfaced by a project the size of the tracker (170+ tasks, long descriptions). Root cause: Fuse.js blends several weighted keys (title 0.35, bodyText 0.3, id 0.2, idVariants 0.1, modifiedFiles 0.15) into one score; a strong title hit dragged down by weak/no match on the other keys can land well above 0.45 even for an exact substring - verified via curl: query "Local" scored BW-94 (title literally "Local control API...") at 0.54, filtered out entirely, while a coincidental unrelated match at 0.43 was shown instead. The server's own Fuse threshold:0.35 is the real relevance gate (a true non-match returns zero results, verified), so the client filter was redundant at best and actively hid the best matches at worst. Verified live against the tracker after the fix: "Local" now shows BW-94 (46%) and BW-95 (57%) both, correctly ordered; "checkbox" shows BW-124 (65%) first; a nonsense query still renders the "No matching results" empty state. No other component uses a similar score cutoff (grepped).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the sidebar quick-searchs client-side score<=0.45 cutoff, which Fuses multi-key weighted scoring could push a genuine title match well past on a large, text-heavy project - hiding most real results, matching the reported "always no matches" experience. The server's own threshold already gates relevance; sort+slice(0,5) is unchanged. Verified against the tracker's real corpus.
<!-- SECTION:FINAL_SUMMARY:END -->
