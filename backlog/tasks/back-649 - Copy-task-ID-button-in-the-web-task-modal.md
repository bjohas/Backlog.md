---
id: BACK-649
title: Copy task ID button in the web task modal
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 21:28'
updated_date: '2026-08-27 21:29'
labels: []
dependencies: []
ordinal: 284000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a copy button in the task details modal header actions, left of Demote/Complete, that copies the task ID to the clipboard. Must work over plain http (meshnet) where navigator.clipboard is unavailable, via the execCommand fallback, and give brief visual feedback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 In preview mode the modal header shows a copy button left of the demote/complete actions that copies the task ID
- [x] #2 Copying works over non-secure http origins (execCommand fallback)
- [x] #3 The button gives brief feedback after copying
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add copiedId state + handleCopyId in TaskDetailsModal: navigator.clipboard when secure context, hidden-textarea execCommand fallback otherwise; 2s feedback reset.
2. Icon button (copy icon, check icon while copied) first in the actions row, preview mode and not create mode.
3. Headless verification over http: click button, assert clipboard/fallback path succeeded and feedback shows.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification with isSecureContext forced false (simulating the plain-http meshnet origin): dialog button order is Copy TASK-4 / Move task to drafts / Edit / close; clicking copies exactly the task id via the execCommand fallback (spied); check-icon feedback appears and resets after 2s; no page errors. Secure contexts take navigator.clipboard.writeText. tsc clean; dist rebuilt; tracker restarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a copy-ID icon button as the leftmost modal header action; copies via clipboard API or execCommand fallback (works on the http meshnet origin) with brief visual confirmation. Verified headless including the forced non-secure-context path.
<!-- SECTION:FINAL_SUMMARY:END -->
