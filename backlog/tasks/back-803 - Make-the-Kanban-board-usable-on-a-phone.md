---
id: BACK-803
title: Make the Kanban board usable on a phone
status: Done
assignee:
  - '@claude'
created_date: '2026-11-14T21:32:00Z'
updated_date: '2026-11-14T21:48:00Z'
labels: []
dependencies: []
type: feature
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On a 390px-wide phone the browser board is hard to use: the sidebar starts open and covers 320 of the 390 pixels; with it folded, the header crams the project name, 'powered by' and the sync notice together, the four board filters fill half of the first screen, each column is 16rem wide with the next one cut off at the edge, and cards change status only by mouse drag-and-drop, which phones do not reliably offer. Users who open the board from a phone (for example inside BeeWriter) need to read and move tasks there.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Below phone width the sidebar starts as the icon strip, and opening it lays it over the page instead of narrowing the board
- [x] #2 Below phone width the header shows the project name without the 'powered by' line, and the board filters fold behind one Filters button
- [x] #3 Below phone width each board column fills the screen width, swiping sideways snaps to the next column, and tabs with the column names jump to a column
- [x] #4 A task's status can be changed from its card without dragging, by choosing the target column
- [x] #5 At desktop width the board, sidebar, header and filters look and behave as before
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phone width = below Tailwind's sm breakpoint (40rem); layout changes are sm-scoped CSS so desktop classes stay as they are.
1. SideNavigation: below sm (matchMedia '(width < 40rem)', the max-sm query), start as the icon strip; the saved preference applies only at wider widths and phone toggles do not overwrite it; opened on a phone the panel is fixed over the page with a backdrop and a w-16 spacer holding the board in place; tapping the backdrop or navigating folds it.
2. Navigation: below sm, hide 'powered by Backlog.md', tighter padding, truncate the project name.
3. Board filters: below sm, a Filters button (with active-filter count) shows or hides the filter group.
4. New BoardColumns component used by the plain board and by milestone lanes: below sm, column-name tabs plus a snap-scrolling strip of full-width columns; at sm+ the existing flex row / lane grid.
5. TaskCard: below sm, a 'Move to' select under each movable card; Board moves the task through the same moveTasks request as the selection toolbar.
6. jsdom tests for the card move, the column tabs and the sidebar's phone start; Playwright check at 390px and 1440px for the CSS-only parts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: Playwright (Chromium 1140) against the source server on a scratch project. At 390px: sidebar 64px wide; opening it overlays the page and a backdrop tap folds it; 'powered by' hidden; filters hidden until Filters is tapped; tabs follow taps and swipes; Move to moved TASK-1 between columns; no horizontal page scroll; no page errors. Milestone lanes get the same tabs per lane. At 1440px: no tabs, Filters button or Move to controls; screenshots against upstream/main differ in 7 anti-aliased pixels only (plain board and milestone lanes).
Tests: new src/test/web-board-phone.test.tsx (3 of 5 fail without the change: card move, tabs, sidebar phone start). web-board-batch-move's selected-card helper now matches role=button cards, since the column tabs also carry aria-selected. Full suite 3299 + 413 pass; check:types clean apart from untracked scratch; Biome clean on src and scripts (it does not cover .tsx).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The browser board is usable on a phone (below the sm breakpoint, 40rem). The sidebar starts folded and opens over the page; the header drops 'powered by'; the filters fold behind a Filters button; columns fill the screen, snap on a sideways swipe and have name tabs (also inside milestone lanes); each card has a Move to choice that moves it through the same request as the selection toolbar. At desktop width nothing changes. Verified with jsdom tests and Playwright at 390px and 1440px; full suite passes. Drag-and-drop on touch is unchanged; Move to is the phone path.
<!-- SECTION:FINAL_SUMMARY:END -->
