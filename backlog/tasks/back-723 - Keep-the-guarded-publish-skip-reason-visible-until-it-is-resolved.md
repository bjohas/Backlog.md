---
id: BACK-723
title: Keep the guarded-publish skip reason visible until it is resolved
status: To Do
assignee: []
created_date: '2026-09-09 18:48'
labels: []
dependencies: []
ordinal: 317000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When guarded publishing cannot run, withTaskMutationTransaction catches the failure, records the reason and degrades the mutation to a local commit. That reason then reaches the user through consumeTaskPublishSkipReason(), which clears it on read, and the TUI renders it as a six-second footer flash. The condition it describes is not transient: the worktree stays dirty, or the branch stays diverged, until someone acts. A user who is not looking at the footer in that six-second window is never told again that their work stopped being published, and the board looks identical to a healthy one. This was observed in a real project where task files sat modified and unpublished for roughly eighteen hours.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The skip reason survives being read and is cleared only when the condition that produced it no longer holds
- [ ] #2 The TUI shows the outstanding reason persistently rather than as a timed flash, and it disappears once publishing succeeds again
- [ ] #3 The reason states what blocks publishing and what the user can do about it
- [ ] #4 Tests cover a reason outliving a first read, clearing on recovery, and not reappearing after the condition is fixed
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
