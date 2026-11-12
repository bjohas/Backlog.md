---
id: BACK-35044
title: >-
  Integrate the 2026-09 origin/main work into the fork after the upstream
  v1.55.3 merge
status: Done
assignee:
  - '@claude'
created_date: '2026-11-12T20:23:00Z'
updated_date: '2026-11-12T20:45:00Z'
labels: []
dependencies: []
ordinal: 408000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub origin/main (bjohas/Backlog.md, tip 59146dd3, 2026-09-15) has 10 commits that this machine's main never had: its own merge of upstream v1.52.0 and a BACK-686 collision repair, fork tasks BACK-727 (an O key in the TUI list view that cycles ordinal/id/priority order, defaulting to the board's order, with selection kept on the same task) and BACK-728 (N in the list view opens the task composer), and removal of two Setup Guide documents that were test output. Local main meanwhile merged upstream v1.55.3 and moved fork tasks to BACK-35001+ (BACK-35043), and was pushed to origin as branch local-main-2026-11 (5ab70daa). main cannot be pushed until origin/main is merged in (no force-push). The merge conflicts in src/ui/footer-content.ts and src/ui/task-viewer-with-search.ts: upstream has since rewritten the list view with its own sort and sections (sortTasks with options.sort, sectionTasks) and removed the Complete key, so the two features have to be ported onto that code rather than resolved line by line. origin's BACK-726 file is upstream's BACK-686 record renumbered by its repair, and its BACK-727/728 numbers are upstream's, so they need the FORK.md "Task IDs" rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 origin/main is merged into main with --no-ff and main is pushed to origin without force
- [x] #2 The TUI list view offers the O sort cycle and N task creation on top of upstream's list view, with the footer showing the order in effect and no Complete key
- [x] #3 origin's fork tasks BACK-727 and BACK-728 move to the fork range and its BACK-726 copy of an upstream record is resolved so upstream records keep their upstream IDs; backlog doctor reports no duplicate IDs
- [x] #4 Tests cover the ported sort cycle, selection preservation and list-view task creation
- [x] #5 FORK.md records the sync and lists the features under the TUI stage
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Merge origin/main into a task branch made from main.
2. Port BACK-727/728 onto upstream's list view: O cycles upstream's --sort orders (default, id, priority) from the --sort the list opened with; rows keep upstream's status sections; N opens the existing task composer; footer shows N and Sort:<order>, no Complete key.
3. Task IDs via scripts/fork-renumber-tasks.ts (made rerunnable).
4. Types, Biome, tests, a real TUI run; FORK.md; then merge into main with --no-ff and push main.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged in c7a32e70. The O cycle uses upstream's --sort values instead of origin's ordinal/id/priority list: undefined (task list's default order: ordinal, priority, ID, sectioned by status) is the board's order, so the separate "ordinal" step was dropped; a --sort outside the cycle (ordinal) steps back to the default. origin's tests that re-tested sortTasks were removed (upstream covers it); the cycle test now checks default -> id -> priority -> default.
Verification: bun run check clean; check:types clean for tracked code (only the stale pr-list-new-task/ copy errors); the 3 ported test files pass (12) and all 24 test files touching the list view, footer or help pass (178). Full suite: parallel 3383 pass / 1 fail, DOM 411 pass / 3 fail, the same known failures as on main (3 preview-comment DOM tests, cli-timestamps timing at 10.7 s under load). Real TUI in tmux on a scratch project: footer shows [N] New and [O] Sort:default; O reordered to Sort:id and Sort:priority (high, medium, low); N opened the composer, and submitting created TASK-4, listed and announced "Created TASK-4.".
background doctor: no duplicate IDs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
origin/main (2026-09-15, pushed from another checkout) is merged into main, and main is pushed to origin without force (5d8c29b6). Its two TUI list-view features are ported onto upstream v1.55.3's rewritten list view: O steps through task list's --sort orders (default, id, priority) with the order named in the footer and the selection kept, and N opens the task composer. Task IDs follow the FORK.md scheme (BACK-726 back to upstream's BACK-686, BACK-727/728 now BACK-35045/35046); doctor is clean. Types, Biome and the related tests pass, and both keys were exercised in a real TUI. The full suite has only the known failures that main also has, so DoD #3 stays unchecked. UPSTREAM-RESUME.md is removed; its notes are in FORK.md "Next sync".
<!-- SECTION:FINAL_SUMMARY:END -->
