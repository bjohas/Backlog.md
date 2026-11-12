---
id: BACK-35043
title: Repair fork task IDs that collide with upstream after the 2026-11 merge
status: Done
assignee:
  - '@claude'
created_date: '2026-11-12T16:42:00Z'
updated_date: '2026-11-12T20:03:00Z'
labels: []
dependencies: []
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Merging upstream/main at 52b4ea3b (commit f8817c83 on merge/upstream-2026-11) left 27 duplicate task ID groups, BACK-686..725: the 2026-09 `backlog doctor --fix` renumbered fork and upstream records into BACK-686+, a range upstream has since used for its own tasks. Until they are repaired, `backlog task list`, `backlog search` and `backlog board export` exit with an error on the merged tree, so the merge cannot land on main yet. `backlog doctor --fix` is not acceptable as-is: it chooses which file of each pair to renumber by its own rule (about half are upstream-owned records), allocates from BACK-801, which upstream PR #1195 already uses, and bundles a move of all 585 backlog/completed files into backlog/archive/tasks that upstream has not made in its own repository. Of the fork records in the range, 22 are fork-owned and 18 are copies of upstream records that upstream still holds as BACK-642..677. Any ID allocated as max+1 will collide again with upstream at the next sync, so the repair needs a scheme in which upstream records keep their upstream IDs permanently. Project rules forbid hand-renaming task files, so the mechanism (doctor/allocator support, or an explicitly approved scripted exception) is part of the decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Upstream-owned task records keep the IDs they have in upstream/main
- [x] #2 Fork-owned task records move to IDs that upstream will not allocate, and references to them in other records are updated
- [x] #3 backlog doctor reports no duplicate task IDs on the merged tree
- [x] #4 backlog/completed and backlog/archive/tasks match upstream/main layout (no completed-folder migration ahead of upstream)
- [x] #5 FORK.md records the ID scheme and how future fork tasks are numbered
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved scheme (user, 2026-11-12): fork-only tasks get their own range starting at BACK-35001; tasks for upstream PRs are created on a branch made from upstream/main so they carry upstream numbers.
1. One-off script scripts/fork-renumber-tasks.ts compares the tree with upstream/main. A task file at an upstream path is upstream-owned and untouched. A fork-only file with the same slug as an upstream record missing from the tree is that record under a fork number (the 2026-09 doctor repair moved 18 of them to BACK-686+): it goes back to its upstream path and ID and must then equal upstream byte for byte. Every other fork-only task file moves to BACK-35001+ in old-ID order.
2. References in fork tasks and FORK.md are rewritten from fork-main numbering; ranges (BACK-686…725, BACK-686+), subtask IDs, branch names and upstream records are left alone. This task's own text names the colliding numbers and is not rewritten.
3. Dry run reviewed by the user, then --write.
4. Verify: doctor, task list/search, tree vs upstream/main, checks and tests.
5. FORK.md "Task IDs" section with the rules and the old-to-new table.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This task itself was allocated BACK-801 by the CLI, the same ID upstream PR #1195 uses for its own task; it will collide when #1195 merges and must be covered by the same repair.

Applied in c1b676f0 on merge/upstream-2026-11: 18 upstream records returned (687→642 … 721→677), 43 fork tasks moved to BACK-35001…35043 (this task was BACK-801), 38 reference lines rewritten.
Verification: backlog doctor reports no duplicate task IDs in the tree; its "possible cross-branch collisions (diagnostic only)" list pairs main with this branch only and resolves when the branch is merged. task list and search exit 0. Against upstream/main: 0 upstream task files missing, 0 with different content, 0 differences under backlog/completed and backlog/archive, and every fork-only task file is in the 35000 range.
Checks: bun run check clean; bun run check:types clean for tracked code (the only error is in the gitignored stale pr-list-new-task/ copy). Tests (CI split, ./-anchored): parallel 3371 pass / 1 fail, DOM 411 pass / 3 fail. The 3 DOM failures are the known web-task-details-modal-final-summary conflict with the fork's comment-from-preview button (BACK-35008), failing on main too. The parallel failure was cli-timestamps "preserves historical creation values" at 10.4 s against the 10 s limit under load average ~10; the test uses its own temp directory, passed at the pre-repair commit, and passed twice on the repaired tree.
Limits: notes written before 2026-09 may use older numbers the script cannot recognise; branch names, commit messages and open upstream PR titles keep old numbers (table in FORK.md).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fork and upstream shared one BACK- counter, so every sync produced duplicate task IDs. The fork now numbers its own tasks from BACK-35001 and creates tasks for upstream PRs on branches made from upstream/main (FORK.md, "Task IDs"). scripts/fork-renumber-tasks.ts applied the scheme on merge/upstream-2026-11: 18 upstream records returned to their upstream paths and IDs (byte-identical to upstream/main), 43 fork tasks moved to BACK-35001…35043, references in fork tasks and FORK.md updated. doctor shows no duplicates in the tree and task list/search work again. Types and Biome are clean; tests pass except the 3 known preview-comment DOM tests that also fail on main (DoD #3 left unchecked for that reason). The branch still needs the go-ahead to merge into main.
<!-- SECTION:FINAL_SUMMARY:END -->
