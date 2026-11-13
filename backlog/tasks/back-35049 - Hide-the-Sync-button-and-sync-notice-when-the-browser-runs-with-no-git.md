---
id: BACK-35049
title: Hide the Sync button and sync notice when the browser runs with --no-git
status: Done
assignee:
  - '@claude'
created_date: '2026-11-13T16:03:00Z'
updated_date: '2026-11-13T16:06:00Z'
labels: []
dependencies: []
type: bug
ordinal: 411000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With backlog browser --no-git the server never syncs, but the page still calls POST /api/sync on load and on focus, shows 'Guarded task sync is disabled.' and offers a Sync button that can only say so. Reported from BeeWriter, where every board runs with --no-git.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With --no-git (or filesystem_only: true) the navigation bar shows neither the Sync button nor a sync message
- [x] #2 With --no-git the page sends no POST /api/sync
- [x] #3 When the server uses Git the Sync button and messages are unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Report filesystemOnly in GET /api/status (true under --no-git through the config overlay). App reads it with the initialization status, skips automatic sync and passes no onSync to Layout/Navigation, which then render no Sync button or message.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GET /api/status now carries filesystemOnly (from the config the server uses, so --no-git sets it). The page reads it before its first automatic sync; when true it never calls /api/sync and the navigation bar has no Sync button or sync message. A project with filesystem_only: true gets the same, since sync can do nothing there either. Tests: web-sync.test.tsx (no button, no message, no sync call; fails before the change), browser-no-git.test.ts (status reports filesystemOnly true with --no-git, false without). Checks: types clean apart from untracked scratch; Biome clean on changed files.
<!-- SECTION:FINAL_SUMMARY:END -->
