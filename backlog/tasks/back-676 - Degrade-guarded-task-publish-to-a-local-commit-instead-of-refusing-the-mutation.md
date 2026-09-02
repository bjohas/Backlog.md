---
id: BACK-676
title: >-
  Degrade guarded task publish to a local commit instead of refusing the
  mutation
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-02 12:50'
updated_date: '2026-09-02 12:50'
labels: []
dependencies: []
priority: high
type: enhancement
ordinal: 311000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When guardedTaskPublish cannot publish, prepareGuardedTaskPublish throws and the whole mutation is abandoned: the task is never written. An unrelated stray file at the repo root is enough to block every board edit, even though the cleanliness check exists only to protect the subsequent 'git merge --ff-only' step, and commitFiles stages explicit paths so unrelated dirt is never swept into a task commit.

Decision (Bjoern, 2026-09-02): apply the mutation and commit the task file locally, skip fetch/ff-merge/push, and tell the user it is not published.

Rationale: the dangerous state is an unpublished *uncommitted write*, not a refusal. On 2026-09-02 Backlog wrote bh-15's description on one machine, the publish preflight threw, and roughly 25 lines of research sat uncommitted and invisible for hours - recoverable only because it was found by chance. Committing locally means nothing can be lost; only sharing is deferred, and that gap becomes visible instead of silent.

Note the push-failure path already behaves this way: the existing test 'rejects a raced push while retaining the local task commit' asserts the task commit is retained. This change makes the preflight-failure paths consistent with it.

Two existing tests in src/test/guarded-task-publish.test.ts encode the old contract and must be rewritten:
- 'refuses a task mutation when the checkout has local modifications'
- 'refuses to publish unrelated local commits'
Both currently assert the task is not written at all.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A task mutation blocked by a dirty worktree is still applied and committed locally, with no push
- [ ] #2 A task mutation blocked by a branch ahead of or diverged from its upstream behaves the same way
- [ ] #3 The reason publishing was skipped is surfaced to the user rather than swallowed
- [ ] #4 The TUI board shows that reason after a move that succeeded locally but was not published
- [ ] #5 A successful guarded publish still fetches, fast-forwards, commits and pushes as before
- [ ] #6 The two tests encoding the old refuse-outright contract are rewritten to assert the new behaviour
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. GitOperations: keep prepareGuardedTaskPublish throwing (its messages are the value); add nothing there.
2. Core.getTaskMutationCommitMode: catch the preflight throw, record the reason, and return { autoCommit: true, guardedPublish: false } so the mutation proceeds and commits locally without pushing.
3. Core: expose the recorded reason via a consume-once accessor so a caller reads it exactly once per mutation.
4. board.ts performTaskMove: after a successful move, surface any recorded reason in the footer as a warning (yellow), distinct from BACK-675's red failure message.
5. Rewrite the two tests in guarded-task-publish.test.ts to assert the task is written, committed locally, and not pushed.
6. Verify tsc, biome on touched files, and the guarded-publish + board suites.
<!-- SECTION:PLAN:END -->
