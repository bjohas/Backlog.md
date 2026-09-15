---
id: BACK-728
title: Create tasks from the TUI list view with N
status: Done
assignee:
  - '@claude'
created_date: '2026-09-15 14:35'
updated_date: '2026-09-15 14:46'
labels: []
dependencies: []
ordinal: 321000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The board binds N to the task composer; the list view has no way to create a task, so the only route from the list is to leave the TUI. The binding was written and submitted upstream as PR 963 on 2026-08-30, but that branch was deliberately kept off this fork, so the feature has never worked locally. Upstream has merged no community PR since 2026-08-30, so waiting on review is costing the fork a feature it already has the code for. The branch is now 67 commits behind upstream/main and conflicts with main, so this re-applies the change against current main rather than merging it; the PR branch stays untouched so its diff against upstream stays clean.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 N, n or Shift-N opens the task composer from the list view and the created task appears in the list
- [x] #2 A watcher update arriving while the composer is open is applied but not rendered until it closes, and the created task is never duplicated
- [x] #3 Creating a draft, or a task hidden by the active filters, reports that outcome instead of silently appearing to do nothing
- [x] #4 The new task is selected and the detail pane follows it, through the same path arrow-key navigation uses
- [x] #5 The footer and the help popup both advertise the binding
- [x] #6 Tests cover the created task appearing, the draft and filtered-out outcomes, and the deferred-update guard
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Re-applied PR 963 against current main rather than merging the branch, which is 67 commits behind upstream/main and conflicts with files this fork has since changed. The PR branch is untouched.

One deliberate difference from the PR: the watcher guard sits after the data assignments rather than before them, so allTasks, statuses, labels and the search index are all applied while the composer is open and only the rebuild is deferred. The PR's early return skipped the later assignments, which did not match its own comment.

Verified: the five tests from PR 963 pass unmodified against this implementation (src/test/tui-task-list-new-task-binding.test.ts, ported verbatim); bunx tsc --noEmit and bun run check . clean; full suite 2939 pass / 8 skip / 20 fail, the same known pre-existing set with no new failures. Built and confirmed the strings are present in dist/backlog, which ~/.local/bin/backlog resolves to.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The TUI list view can now create tasks with N, matching the board.

The binding was written as upstream PR 963 on 2026-08-30 and deliberately kept off this fork, so it had never worked locally; with upstream having merged no community PR since that date, it was re-applied against current main instead of waiting. Beyond the keybinding it carries the taskCreationOpen/taskCreationPendingUpdate guard: a watcher update arriving while the composer is open applies its data but defers the list rebuild, and the created task is upserted by id so a deferred update that already delivered it cannot list it twice. Draft creations and tasks hidden by active filters report that outcome rather than appearing to do nothing, and a visible new task is selected through the same path arrow-key navigation uses so the detail pane follows.

Verified by porting PR 963's five tests unmodified and having them pass, plus tsc, biome, and a full suite at 2939 pass / 20 fail with the failure set unchanged from before the work.
<!-- SECTION:FINAL_SUMMARY:END -->
