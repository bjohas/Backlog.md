---
id: BACK-644
title: Refresh the board task popup after external editor edits
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 18:11'
updated_date: '2026-08-27 18:12'
labels: []
dependencies: []
ordinal: 279000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In the board TUI, pressing E inside the task popup launches the external editor; on return, openTaskEditor updates currentTasks and re-renders the board behind the popup, but the popup content itself is never refreshed and its key handlers (y/c/a) keep the stale task object. The user must close and re-open the popup to see the edit. Fix by having the popup re-open itself with the updated task after a successful edit.

Symptom reported with emacs as editor; list view is unaffected (its E handler re-renders both panes via applyFilters).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After editing a task from the board popup and exiting the editor, the open popup shows the updated content without closing it manually (verified via pty with a scripted editor)
- [ ] #2 Popup key handlers act on the updated task after an edit (e.g. complete confirmation shows the new title)
- [ ] #3 Board behind the popup still reflects the edit as before
- [ ] #4 No-change editor exits leave the popup open and unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract the board popup creation (body of the Enter handler) into a local openTaskPopup(task) function.
2. Change openTaskEditor to return the updated Task (result.task) on change, null otherwise.
3. In the popup E handler: await openTaskEditor; on change, close the popup and re-open via openTaskPopup(updatedTask), re-binding all key handlers to the fresh task.
4. Verify via pty: board popup + EDITOR script that rewrites the title; popup shows new title without manual close. tsc/biome/board tests.
<!-- SECTION:PLAN:END -->
