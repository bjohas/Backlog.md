---
id: BACK-35043
title: Repair fork task IDs that collide with upstream after the 2026-11 merge
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-12T16:42:00Z'
updated_date: '2026-11-12T19:36:00Z'
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
- [ ] #1 Upstream-owned task records keep the IDs they have in upstream/main
- [ ] #2 Fork-owned task records move to IDs that upstream will not allocate, and references to them in other records are updated
- [ ] #3 backlog doctor reports no duplicate task IDs on the merged tree
- [ ] #4 backlog/completed and backlog/archive/tasks match upstream/main layout (no completed-folder migration ahead of upstream)
- [ ] #5 FORK.md records the ID scheme and how future fork tasks are numbered
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Approved scheme (user, 2026-11-12): fork-only tasks get their own range starting at BACK-35001; tasks for upstream PRs are created on a branch made from upstream/main so they carry upstream numbers.
1. One-off script (scripts/fork-renumber-tasks.ts) classifies each duplicate-ID file: same path in upstream/main = upstream-owned (untouched); fork file whose body matches an upstream record = copy (deleted, references point to the upstream ID); other fork file = fork-owned (renamed to BACK-35001+ in old-ID order, frontmatter id updated). BACK-801 itself moves into the range too.
2. References to old fork IDs are rewritten only in fork-only task files; upstream-owned files are not touched. FORK.md and other docs are listed for manual review.
3. Dry run first, shown to the user for approval; then apply with --write.
4. Verify: backlog doctor shows no duplicates, task list/search work, backlog/completed untouched, then checks and tests.
5. FORK.md: ID scheme, PR-task rule and old-to-new table.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This task itself was allocated BACK-801 by the CLI, the same ID upstream PR #1195 uses for its own task; it will collide when #1195 merges and must be covered by the same repair.
<!-- SECTION:NOTES:END -->
