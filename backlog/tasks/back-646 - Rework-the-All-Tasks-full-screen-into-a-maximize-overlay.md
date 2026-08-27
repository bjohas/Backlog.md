---
id: BACK-646
title: Rework the All Tasks full screen into a maximize overlay
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 21:05'
updated_date: '2026-08-27 21:05'
labels: []
dependencies: []
ordinal: 281000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Feedback on BACK-645: the floating exit button overlapped filter menus, the whole panel (filters included) should expand rather than just the table, and tasks could not be opened while fullscreen because the task modal renders outside the fullscreened element. Replace the native Fullscreen API with a CSS maximize overlay (fixed inset-0 below the modal z-index) on the whole All Tasks view so filters stay usable and modals stack above.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The maximize toggle expands the whole All Tasks panel (header, filters, table) to fill the viewport, covering side navigation and app chrome
- [ ] #2 Filter dropdowns and selects remain usable while maximized
- [ ] #3 Clicking/tapping a task while maximized opens the task modal above the overlay
- [ ] #4 The toolbar toggle is always visible (also with zero matching tasks) and flips icon/title; no floating overlay button
- [ ] #5 Escape exits maximize without breaking modal Escape behavior
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove Fullscreen API code (tableContainerRef effect, requestFullscreen, floating exit button) from TaskList.tsx.
2. Add isMaximized state; root page-shell div becomes fixed inset-0 z-40 overflow-y-auto with explicit bg + padding when maximized.
3. Toolbar toggle always rendered; icon/title flip with state.
4. Escape listener exits maximize only when no modal is open (guard via stopPropagation/defaultPrevented from Modal, verify Modal Esc behavior).
5. Verify with headless playwright: maximize covers viewport incl. filters, dropdown opens, row click opens modal above overlay, Esc closes modal first then maximize; light+dark bg; rebuild + restart tracker.
<!-- SECTION:PLAN:END -->
