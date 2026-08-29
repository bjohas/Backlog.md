---
id: BACK-660
title: Apply checkbox toggles to freshly fetched task text
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 07:54'
updated_date: '2026-08-29 07:58'
labels: []
dependencies: []
ordinal: 295000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A checkbox toggle sends the whole description (or notes) section, so a page whose copy is stale - socket dropped while the phone slept, before the catch-up refresh lands - overwrites edits made on disk meanwhile. Verified: an out-of-band description edit was lost when a stale page ticked a box, while the same race with a comment was safe because comments append server-side. Re-read the task immediately before the write and apply the toggle to that text; the existing offset check already refuses when no span starts at the offset, so a shifted document writes nothing instead of guessing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Toggling re-fetches the task and applies the change to the freshly fetched section text
- [x] #2 An edit made on disk while the page was stale survives a subsequent toggle
- [x] #3 When the fresh text no longer has a checkbox span at that offset the write is skipped, the modal refreshes, and the reader is told to try again
- [x] #4 Toggling still works normally when nothing changed underneath
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In handleToggleCheckboxSpan, fetch the task via apiClient before computing the new text and use the fetched section as the base.
2. Keep toggleCheckboxSpanAt as the guard: a null result means the document moved - refresh the modal state from the fetched task and surface a brief notice instead of writing.
3. Verify with the stale-page race that previously clobbered, plus the normal path and the shifted-document path.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Re-ran the same three-scenario probe that found the bug. Before: stale-page tick lost the on-disk edit. After: socket-alive tick still applies and the other edit survives; stale-page tick preserves the other edit and declines to write; the comment path stays safe (it appends server-side). Follow-up check: the amber notice appears, the refreshed text is shown, and tapping again ticks the box with the other edit intact. The notice needed its own state because a data refresh clears `error`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Checkbox toggles now re-read the task and apply to the fresh section text, so a stale page can no longer overwrite on-disk edits; a moved document declines the write, refreshes and prompts a retry. Verified with the race that previously clobbered.
<!-- SECTION:FINAL_SUMMARY:END -->
