---
id: BACK-644
title: Refresh the board task popup after external editor edits
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 18:11'
updated_date: '2026-08-27 18:17'
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
- [x] #1 After editing a task from the board popup and exiting the editor, the open popup shows the updated content without closing it manually (verified via pty with a scripted editor)
- [x] #2 Popup key handlers act on the updated task after an edit (e.g. complete confirmation shows the new title)
- [x] #3 Board behind the popup still reflects the edit as before
- [x] #4 No-change editor exits leave the popup open and unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract the board popup creation (body of the Enter handler) into a local openTaskPopup(task) function.
2. Change openTaskEditor to return the updated Task (result.task) on change, null otherwise.
3. In the popup E handler: await openTaskEditor; on change, close the popup and re-open via openTaskPopup(updatedTask), re-binding all key handlers to the fresh task.
4. Verify via pty: board popup + EDITOR script that rewrites the title; popup shows new title without manual close. tsc/biome/board tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified via pty with EDITOR pointed at a scripted editor (EDITOR env wins over config.defaultEditor per resolveEditor): popup opened showing 'TASK-2 - Sample task two' (capture byte 3538), pressed e alone, popup re-rendered showing 'TASK-2 - EDITED BY SCRIPT' (byte 13463) with the board row behind also updated; a second run with a no-op editor left the popup unchanged with 'No changes detected' footer and no reopen. Handlers rebind to the updated task via popup reopen. tsc/biome/board tests pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extracted openTaskPopup on the board and made openTaskEditor return the updated task; the popup E handler now closes and reopens the popup with the edited task, so content and key handlers refresh immediately after the external editor exits. Verified with scripted-editor pty captures (title updates in-place; no-change edits leave the popup untouched).
<!-- SECTION:FINAL_SUMMARY:END -->
