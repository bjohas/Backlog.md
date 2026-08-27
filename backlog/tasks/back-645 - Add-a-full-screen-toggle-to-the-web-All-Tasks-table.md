---
id: BACK-645
title: Add a full screen toggle to the web All Tasks table
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 20:48'
updated_date: '2026-08-27 20:48'
labels: []
dependencies: []
ordinal: 280000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The All Tasks web view wastes space around the scrolling task table. Add a full screen button to the toolbar that expands just the table panel to fill the screen via the browser Fullscreen API, with Esc (or the button again) exiting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A button in the All Tasks toolbar toggles the task table into browser full screen and back
- [ ] #2 In full screen the table scrolls vertically and keeps its sticky header and background in light and dark mode
- [ ] #3 Esc exits full screen and the button state follows (icon/title reflect current state)
- [ ] #4 Button is not shown when there are no tasks to display
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add tableContainerRef + isTableFullscreen state to TaskList.tsx, synced via fullscreenchange.
2. Toggle via requestFullscreen/exitFullscreen on the table container div.
3. Icon button in the toolbar controls group (Clean Up button styling); hidden when currentCount is 0.
4. Fullscreen container gets overflow-y-auto + explicit bg for both themes.
5. Verify with headless playwright: click toggles fullscreenElement, container fills viewport, dark/light bg present; tsc/biome.
<!-- SECTION:PLAN:END -->
