---
id: BACK-647
title: Persist and harden the All Tasks maximize mode
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 21:21'
updated_date: '2026-08-27 21:21'
labels: []
dependencies: []
ordinal: 282000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-ups on BACK-646: persist the maximize state in localStorage; couple maximizing with a browser fullscreen request on the document so Android gets true full screen (CSS overlay remains the layout mechanism, so modals still stack correctly); move the toggle button to sit directly before the All Tasks heading so it cannot overlap the filter controls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Maximize state survives a page reload via localStorage (overlay restored without a fullscreen request, which browsers disallow without a gesture)
- [ ] #2 Toggling maximize on requests browser fullscreen on the document and toggling off exits it; leaving browser fullscreen (Esc/system gesture) also exits maximize
- [ ] #3 The toggle button renders immediately before the All Tasks heading and no longer sits in the filter/actions row
- [ ] #4 Task modal still opens above the maximized panel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Init isMaximized from localStorage key backlog-tasklist-maximized (try/catch); persist on change.
2. On maximize: document.documentElement.requestFullscreen().catch (fails silently on restore without gesture); on unmaximize: exitFullscreen if active. fullscreenchange with no fullscreenElement while maximized-and-entered -> unmaximize.
3. Move toggle button before the All Tasks h1 (left group in the title row); remove it from the actions group.
4. Re-run headless verification (overlay, modal stacking, toggle, reload persistence).
<!-- SECTION:PLAN:END -->
