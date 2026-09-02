---
id: BACK-677
title: Publish deferred task-only commits instead of trapping them locally
status: Done
assignee:
  - '@claude'
created_date: '2026-09-02 13:14'
updated_date: '2026-09-02 14:53'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BACK-676 made a blocked mutation commit locally rather than be abandoned. That leaves the branch one commit ahead of upstream, and prepareGuardedTaskPublish requires HEAD to equal upstream exactly:

    if (!head || !upstreamHead || head !== upstreamHead) throw ... 'publish or reconcile local commits first.'

So the next mutation fails the same check, degrades again, and adds another local commit. The state is self-perpetuating: deferred commits never drain without a manual git push.

'Clean and strictly ahead' is precisely the state a push resolves. The check is strict for a good reason - the original design deliberately refuses to push commits it did not author, so a task move never ships unrelated source commits - but it now traps Backlog's own commits too.

Fix: when the worktree is clean and the upstream is an ancestor of HEAD (fast-forwardable, not diverged), inspect the local-only commits. If every file they touch is inside the task directory, publish them. If any touches anything else, keep refusing with the existing message.

This preserves 'never push unrelated work' while letting deferred task commits publish at the next opportunity, which is what a user reasonably expects after seeing 'Saved locally, not published'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A clean branch whose local-only commits touch only the task directory publishes them and proceeds
- [x] #2 A clean branch with a local-only commit touching anything outside the task directory still refuses, with the existing message
- [x] #3 A diverged branch still refuses, unchanged
- [x] #4 The self-perpetuating case is covered: a mutation deferred by BACK-676 publishes on the next mutation once the worktree is clean
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In prepareGuardedTaskPublish, replace the strict head===upstreamHead check: if upstream is an ancestor of HEAD (clean, not diverged), list the local-only commits' changed files.
2. Publish only when every changed path is inside the task directory; otherwise throw the existing message unchanged.
3. Derive the task directory from the existing backlog-directory resolution rather than hardcoding 'backlog'.
4. Add tests: task-only local commits publish; a mixed/unrelated local commit still refuses; diverged still refuses; and the BACK-676 deferral drains on the next clean mutation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified live on kitty: a move with a dirty worktree reported 'saved locally, not published'; after removing the stray file the next move published both, and 'git rev-list --count origin/main..HEAD' printed 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
prepareGuardedTaskPublish no longer requires HEAD to equal upstream. When the branch is clean and strictly ahead, localCommitsTouchOnlyTasks inspects 'git diff --name-only upstream..HEAD' and publishes only when every changed path is inside the configured backlog directory (derived from config.backlogDirectory via normalizeProjectBacklogDirectory, defaulting to DEFAULT_DIRECTORIES.BACKLOG); anything else still throws the original message. This lets commits deferred by BACK-676 drain at the next opportunity while preserving the rule that a task mutation never publishes unrelated work. Verified: guarded-task-publish suite 7 pass/0 fail, including a new test that blocks a mutation with a dirty file, cleans it, and asserts 'git rev-list --count origin/main..HEAD' is 0 afterwards, plus a new diverged-branch test. tsc --noEmit clean, biome clean, git/board suites 38 pass/0 fail.
<!-- SECTION:FINAL_SUMMARY:END -->
