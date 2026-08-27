---
id: BACK-645
title: Add a full screen toggle to the web All Tasks table
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 20:48'
updated_date: '2026-08-27 20:57'
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
- [x] #1 A button in the All Tasks toolbar toggles the task table into browser full screen and back
- [x] #2 In full screen the table scrolls vertically and keeps its sticky header and background in light and dark mode
- [x] #3 Esc exits full screen and the button state follows (icon/title reflect current state)
- [x] #4 Button is not shown when there are no tasks to display
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add tableContainerRef + isTableFullscreen state to TaskList.tsx, synced via fullscreenchange.
2. Toggle via requestFullscreen/exitFullscreen on the table container div.
3. Icon button in the toolbar controls group (Clean Up button styling); hidden when currentCount is 0.
4. Fullscreen container gets overflow-y-auto + explicit bg for both themes.
5. Verify with headless playwright: click toggles fullscreenElement, container fills viewport, dark/light bg present; tsc/biome.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified with headless Chromium (playwright) against the built binary: toolbar button enters fullscreen (fullscreenElement = table container, 1280x800 = viewport, rows present, scrollable); floating in-panel button exits and toolbar button returns; state follows document.exitFullscreen() (the Esc path - headless shell does not implement Esc browser UI itself); dark scheme gives html.dark and fullscreen bg gray-900; with zero matching tasks the button is not rendered. Screenshots tmp/fs-active.png / fs-dark.png. Key design finding: the toolbar is outside the fullscreened element and thus invisible in fullscreen, so the exit control must live inside the container. tsc passes; biome does not cover .tsx (biome.json includes src/**/*.ts only). dist/backlog rebuilt and backlog-browser-tracker restarted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Full screen toggle to the web All Tasks toolbar: requests browser fullscreen on the table container; a floating exit button inside the panel (plus Esc) leaves it; fullscreen panel scrolls with sticky header and explicit light/dark backgrounds; hidden when no tasks. Verified end-to-end with headless-browser click-through against the built binary.
<!-- SECTION:FINAL_SUMMARY:END -->
