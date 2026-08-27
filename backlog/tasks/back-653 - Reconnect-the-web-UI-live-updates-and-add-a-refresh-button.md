---
id: BACK-653
title: Reconnect the web UI live updates and add a refresh button
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 21:54'
updated_date: '2026-08-27 21:54'
labels: []
dependencies: []
ordinal: 288000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The web UI auto-refreshes via a tasks-updated WebSocket push (verified live: an external CLI title edit appeared in the open table within ~2s). But ws.onclose never reconnects, so after any disconnect (phone sleep, server restart) the page silently stops updating until a manual browser reload - which is awkward in the maximized/fullscreen view. Add automatic WebSocket reconnection with a catch-up refresh on reopen, plus a manual refresh button next to the maximize toggle.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After the WebSocket drops (e.g. server restart) the page reconnects automatically and external edits update the view again without a browser reload
- [ ] #2 Reconnecting triggers a catch-up data refresh so changes made while disconnected appear
- [ ] #3 A refresh button next to the maximize toggle refetches data on demand and is usable in the maximized view
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Restructure the App.tsx WebSocket effect into a connect() loop: onclose schedules reconnect after 3s (unless disposed); onopen after a previous connection triggers refreshData() to catch up.
2. Refresh icon button in TaskList next to the maximize toggle calling onRefreshData with a spinning state while awaiting.
3. Headless verification: kill/restart the server under an open page, make an external CLI edit, assert it appears without reload; click refresh button and assert refetch.
<!-- SECTION:PLAN:END -->
