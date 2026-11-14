---
id: BACK-803
title: Make the Kanban board usable on a phone
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-14T21:32:00Z'
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
- [ ] #1 Below phone width the sidebar starts as the icon strip, and opening it lays it over the page instead of narrowing the board
- [ ] #2 Below phone width the header shows the project name without the 'powered by' line, and the board filters fold behind one Filters button
- [ ] #3 Below phone width each board column fills the screen width, swiping sideways snaps to the next column, and tabs with the column names jump to a column
- [ ] #4 A task's status can be changed from its card without dragging, by choosing the target column
- [ ] #5 At desktop width the board, sidebar, header and filters look and behave as before
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
