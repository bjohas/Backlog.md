---
id: BACK-685
title: Merge upstream/main into the fork
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-04 21:07'
updated_date: '2026-09-04 21:38'
labels: []
dependencies: []
ordinal: 314000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The fork is 122 commits ahead of and 90 behind upstream/main (fork point BACK-639, 40482ca0). Upstream shipped 43 PRs between 2026-08-29 and 2026-09-02, three of which reimplement fixes this fork already carries, and several of which (web in-place updates #981, local time display #992, date-only due dates #994, core search consolidation #958/#959) sit directly on top of fork work. A trial merge conflicts in 19 files / 50 hunks / ~1270 lines; a rebase would replay variants of the same conflicts across 32 fork commits, so a merge is the chosen route. Left alone the gap only widens and the fork's open PRs become harder to rebase.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 main contains every upstream commit through 3c7fde65 and the merge is recorded with --no-ff
- [ ] #2 Fork features preserved: guarded task sync/publish, git action log, web All Tasks maximize/sort/search, checkbox spans, documentBaseUrl, comment-from-preview, relativeDueDates, TUI pane width, OSC 52 clipboard, board CR binding, move-failure footer, local install
- [ ] #3 Fixes upstream reimplemented (emoji width, board popup refresh, sidebar quick search) resolve to upstream's implementation with the fork's now-redundant copies removed
- [ ] #4 package.json keeps neo-neo-bblessed 1.0.10, the 1.0.9 patchedDependencies entry and patches/neo-neo-bblessed@1.0.9.patch are gone, and bun.lock is regenerated
- [ ] #5 Task ID collisions introduced by the merge are repaired with backlog doctor --fix and backlog doctor reports no duplicate task IDs afterwards
- [ ] #6 bunx tsc --noEmit, bun run check . and bun run test all pass
- [ ] #7 FORK.md states the current upstream position, the merge, and which fork features are now upstream
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Enable rerere; create scratch branch merge/upstream-2026-09 off main.
2. Run git merge --no-ff upstream/main; expect 19 conflicted files / 50 hunks.
3. Resolve the three superseded areas by taking upstream: emoji width (upstream #956 + neo-neo-bblessed 1.0.10), board popup refresh (#957), sidebar quick search (#955, already the fork's own merged PR).
4. Resolve src/core/backlog.ts (703 lines, 6 hunks): take upstream's refactored bodies (resolveTasksForBoardMove, crossBranchMoveReason, normalizeTargetMilestone) and re-wrap each in the fork's withTaskMutationTransaction.
5. Resolve TUI conflicts (board.ts 10 hunks, task-viewer-with-search.ts 6, unified-view.ts, footer-content.ts, cli.ts): keep the fork's R sync binding, BOARD_ENTER_KEYS, move-failure footer and pane width on top of upstream's multi-select move, list sort comparator and Windows input fix.
6. Resolve web conflicts (App.tsx, Board.tsx, Layout.tsx, MilestonesPage.tsx, Navigation.tsx, SideNavigation.tsx, TaskCard.tsx, TaskColumn.tsx, TaskDetailsModal.tsx, TaskList.tsx, date-display.ts/.test.ts): keep fork maximize/sort/search/Sync button over upstream in-place updates (#981), acceptance-criteria ring (#995) and local-time display (#992); reconcile relativeDueDates with upstream date-only due dates (#994).
7. Fix package.json: keep neo-neo-bblessed 1.0.10, drop the patchedDependencies entry and delete patches/neo-neo-bblessed@1.0.9.patch; regenerate bun.lock via bun i.
8. Run backlog doctor, then backlog doctor --fix to repair the ~38 back-641..678 ID collisions; re-run doctor to confirm clean.
9. Verify: bunx tsc --noEmit, bun run check ., bun run test.
10. Update FORK.md; merge the scratch branch into main with --no-ff.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merge resolved on branch merge/upstream-2026-09 (staged, not yet committed). All 19 conflicted files resolved: 50 hunks, ~1270 lines. bunx tsc --noEmit and bun run check . both pass.

Key decisions: superseded fork fixes (emoji width, board popup refresh, sidebar quick search) resolved to upstream's implementations; src/core/backlog.ts took upstream's refactored bodies with the fork's withTaskMutationTransaction wrapper re-applied to reorderTask, moveTasksToStatus, archiveTask and demoteTask; StoredDate gained a relativeDue prop so all four web due-date sites keep going through upstream's single date component; formatDueDateForDisplay now appends the (UTC) label only when the stored value carries a time, because upstream #994 made due dates date-only.

Blocked: bun i cannot run because /home/bjohas/.bun is read-only in the sandbox. Added to .twrw, which needs a session restart. See RESUME.md for the remaining steps, including the open question of which side (fork or upstream) should give up the colliding BACK-641..678 IDs before running backlog doctor --fix.

Test baseline established. Full suite on the merge: 2919 pass, 8 skip, 21 fail (2948 tests, 295 files, 491s).

All 21 failures are pre-existing, none caused by the merge:
- 14 in src/test/tui-task-composer.test.ts (canonical persistence / git hooks) reproduce identically on main in a detached worktree.
- 3 in src/test/web-task-details-modal-final-summary.test.tsx, 2 in src/test/help-popup.test.ts, 1 in src/test/tui-window-title.test.ts also reproduce on main.
- 1 in src/test/cli-doc-decision-board.test.ts ('Created document doc-5' instead of doc-1) is a full-suite ordering flake: the file passes 20/20 in isolation on both main and the merge branch.

Caveat: node_modules still holds the patched neo-neo-bblessed 1.0.9 because bun i is blocked by the read-only /home/bjohas/.bun mount, so the suite has not yet run against the 1.0.10 the merged package.json specifies. Re-run after the sandbox restart.
<!-- SECTION:NOTES:END -->
