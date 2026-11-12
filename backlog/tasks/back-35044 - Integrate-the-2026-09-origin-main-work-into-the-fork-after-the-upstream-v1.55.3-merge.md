---
id: BACK-35044
title: >-
  Integrate the 2026-09 origin/main work into the fork after the upstream
  v1.55.3 merge
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-12T20:23:00Z'
updated_date: '2026-11-12T20:29:00Z'
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
- [ ] #1 origin/main is merged into main with --no-ff and main is pushed to origin without force
- [ ] #2 The TUI list view offers the O sort cycle and N task creation on top of upstream's list view, with the footer showing the order in effect and no Complete key
- [ ] #3 origin's fork tasks BACK-727 and BACK-728 move to the fork range and its BACK-726 copy of an upstream record is resolved so upstream records keep their upstream IDs; backlog doctor reports no duplicate IDs
- [ ] #4 Tests cover the ported sort cycle, selection preservation and list-view task creation
- [ ] #5 FORK.md records the sync and lists the features under the TUI stage
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
