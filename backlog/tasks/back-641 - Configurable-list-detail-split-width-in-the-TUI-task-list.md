---
id: BACK-641
title: Configurable list/detail split width in the TUI task list
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 15:50'
updated_date: '2026-08-27 16:14'
labels: []
dependencies: []
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TUI task list view hardcodes the left task-list pane at 40% of the terminal width with the detail pane taking the rest. Users on wide terminals or with long task titles cannot adjust the split. Add a config key (taskListPaneWidth, percentage, default 40) that controls the list/detail split in the TUI list view.

Upstream issue: https://github.com/MrLesk/Backlog.md/issues/946
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A config key taskListPaneWidth (percentage) controls the width of the task-list pane in the TUI list view, defaulting to current behavior (40) when unset
- [x] #2 The key is settable, gettable, and listed via `backlog config set/get/list` with validation rejecting values outside a sane range
- [x] #3 Summary truncation in the list pane respects the configured width
- [x] #4 Tests cover config validation and the width being applied
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add taskListPaneWidth?: number to BacklogConfig (src/types/index.ts).
2. Parse/serialize task_list_pane_width in src/file-system/operations.ts (parseConfig + serializeConfig).
3. Recognize task_list_pane_width in src/utils/config-watcher.ts (INTEGER_CONFIG_KEYS + 10-90 range check).
4. Wire CLI config get/set/list in src/cli.ts (CONFIG_GET_KEYS, CONFIG_SET_KEYS, CONFIG_AVAILABLE_KEYS, get/set cases with 10-90 validation, config list output).
5. Apply in TUI list view (src/ui/task-viewer-with-search.ts): read config.taskListPaneWidth (clamped, default 40), use for taskListPane.width, detailPane.left, and getTaskListSummaryWidth.
6. Tests: config set/get validation + width application in list rendering.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented taskListPaneWidth (10-90%, default 40): BacklogConfig type, task_list_pane_width parse/serialize in operations.ts, config-watcher integer validation, CLI config get/set/list with range validation, and TUI list view layout (pane widths + summary truncation) via resolveTaskListPaneWidth. Tests: CLI round-trip + rejection in config-commands.test.ts, resolver unit tests in task-list-pane-width.test.ts. tsc, Biome, and related test suites pass. Commit 0e26c17 on tasks/back-641-tui-list-pane-width.

Verification: drove the real TUI in a pty (script) at 100 cols - default renders the split at col 40; after 'backlog config set taskListPaneWidth 60' the split renders at col 60 (border pattern x[58C]xx[38C]x on all rows). CLI set/get/list verified live and by tests; invalid values (5/95/abc) rejected. bunx tsc --noEmit passes; Biome clean on all touched files (repo-wide 'bun run check .' has a pre-existing format drift in src/ui/components/task-composer.ts, present on main). Full suite: only pre-existing/environmental failures (tui-task-composer + window-title fail identically on main; 2 status-filtering flakes pass scoped).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added taskListPaneWidth config key (10-90%, default 40) controlling the task-list/detail split in the TUI list view: BacklogConfig type, task_list_pane_width parse/serialize, config-watcher validation, CLI config get/set/list with range validation, and viewer layout incl. summary truncation. Verified by unit/CLI tests and by rendering the real TUI in a pty at 100 cols, observing the split move from col 40 to col 60 after setting the key to 60.
<!-- SECTION:FINAL_SUMMARY:END -->
