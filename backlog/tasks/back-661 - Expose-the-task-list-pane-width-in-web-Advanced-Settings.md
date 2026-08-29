---
id: BACK-661
title: Expose the task list pane width in web Advanced Settings
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-29 08:25'
updated_date: '2026-08-29 08:25'
labels: []
dependencies: []
ordinal: 296000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
taskListPaneWidth can only be set from the CLI. Add it to the web Settings dialog under Advanced Settings, beside Max Column Width, with the same 10-90 validation the CLI applies and the existing default when unset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Advanced Settings offers a Task List Pane Width field showing the configured value, or the 40 default when unset
- [ ] #2 Saving persists it to config.yml as task_list_pane_width and the CLI reads back the same value
- [ ] #3 Values outside 10-90 are rejected with an inline message and block the save, matching the CLI rule
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Field in the Advanced Settings block bound to config.taskListPaneWidth, defaulting the display to 40.
2. Range check in validateConfig with an inline error, mirroring the CLI 10-90 rule.
3. Headless: set a value, save, read it back through the CLI and the reopened dialog; check an out-of-range value blocks the save.
<!-- SECTION:PLAN:END -->
