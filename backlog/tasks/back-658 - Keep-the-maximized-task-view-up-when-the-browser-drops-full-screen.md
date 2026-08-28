---
id: BACK-658
title: Keep the maximized task view up when the browser drops full screen
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-28 22:43'
updated_date: '2026-08-28 22:43'
labels: []
dependencies: []
ordinal: 293000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The maximize overlay is torn down whenever browser full screen ends, and mobile browsers exit full screen whenever the page loses focus (app switch, screen lock, a connectivity interruption). Coming back therefore lands on the normal cramped layout, with the collapsed state also persisted. Make the overlay independent of the browser full-screen state, and restore true full screen on the next interaction after the page comes back.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Losing browser full screen leaves the maximized overlay in place, including its persisted state
- [ ] #2 The maximize toggle and Escape still exit maximize
- [ ] #3 When full screen was lost while the page was hidden, the next interaction after returning re-enters browser full screen
- [ ] #4 Deliberately leaving full screen while the page is visible does not silently re-enter it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Drop the fullscreenchange->unmaximize coupling: the overlay is our own state.
2. Track full screen lost while document.hidden; on return arm a one-shot pointerdown that re-requests full screen, so the restore needs a real user gesture and only follows an involuntary exit.
3. Verify headless: simulate exitFullscreen while hidden then a tap restores it; overlay survives an exit; a visible-page exit arms nothing; toggle and Escape still exit.
<!-- SECTION:PLAN:END -->
