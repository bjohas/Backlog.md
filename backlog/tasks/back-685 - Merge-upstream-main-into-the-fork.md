---
id: BACK-685
title: Merge upstream/main into the fork
status: Done
assignee:
  - '@claude'
created_date: '2026-09-04 21:07'
updated_date: '2026-09-05 20:50'
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
- [x] #1 main contains every upstream commit through 3c7fde65 and the merge is recorded with --no-ff
- [x] #2 Fork features preserved: guarded task sync/publish, git action log, web All Tasks maximize/sort/search, checkbox spans, documentBaseUrl, comment-from-preview, relativeDueDates, TUI pane width, OSC 52 clipboard, board CR binding, move-failure footer, local install
- [x] #3 Fixes upstream reimplemented (emoji width, board popup refresh, sidebar quick search) resolve to upstream's implementation with the fork's now-redundant copies removed
- [x] #4 package.json keeps neo-neo-bblessed 1.0.10, the 1.0.9 patchedDependencies entry and patches/neo-neo-bblessed@1.0.9.patch are gone, and bun.lock is regenerated
- [x] #5 Task ID collisions introduced by the merge are repaired with backlog doctor --fix and backlog doctor reports no duplicate task IDs afterwards
- [x] #6 FORK.md states the current upstream position, the merge, and which fork features are now upstream
- [x] #7 bunx tsc --noEmit and bun run check . pass, and bun run test introduces no failures beyond the 21 already failing on main
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
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

Landed. merge/upstream-2026-09 carries the merge commit (edf09cd9, parents 4025c238 + upstream 3c7fde65) and was merged into main with --no-ff as d2ac8cc8. main is now 0 behind upstream/main, 125 ahead. main's tree is byte-identical to the tested branch tree.

Verification evidence:
- bunx tsc --noEmit clean; bun run check . clean (436 files).
- 149/149 pass across the 14 fork-feature suites (guarded publish/sync, server sync endpoint, web sync, checkbox spans, document URL, pane width, OSC 52, board UI, config commands, local install, tui task type, date display, git).
- Live server check on the built binary: GET /api/config returns the derived gitUserName plus all six fork config keys; POST /api/sync returns the structured guarded result; the web bundle builds and serves.
- DOM render check (temporary test file, run then deleted): the All Tasks maximize control renders and toggles Full screen -> Exit full screen, and the task modal offers a comment control without entering edit mode.
- backlog doctor reports no duplicate active/completed task IDs.

Gap found and fixed during verification: upstream's multi-select move (#980) arrived with a silent catch, so a failed batch move snapped back with no message and the guarded-publish skip notice never appeared. Both were mirrored onto that path (a75d079a), preserving BACK-719 and BACK-676 behaviour across upstream's new code path.

AC #6 is not met as written: bun run test does not pass. It is 2919 pass / 8 skip / 21 fail, and all 21 are pre-existing - verified by running the same files against main in a detached worktree. 14 are in tui-task-composer.test.ts, 3 in web-task-details-modal-final-summary.test.tsx, 2 in help-popup.test.ts, 1 in tui-window-title.test.ts, and 1 is an ordering flake inside cli-doc-decision-board.test.ts that passes 20/20 in isolation. The merge introduces no new failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Merged upstream/main at 3c7fde65 into the fork (43 upstream PRs since fork point 40482ca0/BACK-639). 19 files conflicted across 50 hunks; landed on main as d2ac8cc8 via --no-ff of merge/upstream-2026-09, leaving main 0 behind upstream and 125 ahead.

Three fork fixes were superseded and now come from upstream: sidebar quick search (#955, the fork's own merged PR), emoji double-width (#956, vendored into neo-neo-bblessed 1.0.10 so the dependency patch is deleted) and the board popup refresh (#957). package.json and bun.lock are now identical to upstream's. core/backlog.ts took upstream's refactored bodies with the fork's withTaskMutationTransaction wrapper re-applied to reorderTask, archiveTask, demoteTask and upstream's new moveTasksToStatus, so guarded publish still covers every mutation path. Reconciled against upstream's date work: due dates are date-only (#994) so the (UTC) label is appended only when a stored value carries a time, and StoredDate (#992) gained a relativeDue prop instead of four call sites branching on relativeDueDates. 37 duplicate task ID groups were repaired with backlog doctor --fix into BACK-686+.

Verified with: bunx tsc --noEmit and bun run check . clean; 149/149 across the 14 fork-feature suites; a live server check of GET /api/config and POST /api/sync on the built binary; a DOM render check of the All Tasks maximize toggle and the modal comment control; backlog doctor reporting no duplicate IDs. bun run test is 2919 pass / 21 fail, every failure pre-existing and confirmed by running the same files against main in a detached worktree. Verification also found and fixed a gap: upstream's multi-select move arrived with a silent catch, so the move-failure footer and guarded-publish skip notice were mirrored onto that path (a75d079a).
<!-- SECTION:FINAL_SUMMARY:END -->
