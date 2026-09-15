---
id: BACK-728
title: Create tasks from the TUI list view with N
status: To Do
assignee:
  - '@claude'
created_date: '2026-09-15 14:35'
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
- [ ] #1 N, n or Shift-N opens the task composer from the list view and the created task appears in the list
- [ ] #2 A watcher update arriving while the composer is open is applied but not rendered until it closes, and the created task is never duplicated
- [ ] #3 Creating a draft, or a task hidden by the active filters, reports that outcome instead of silently appearing to do nothing
- [ ] #4 The new task is selected and the detail pane follows it, through the same path arrow-key navigation uses
- [ ] #5 The footer and the help popup both advertise the binding
- [ ] #6 Tests cover the created task appearing, the draft and filtered-out outcomes, and the deferred-update guard
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
