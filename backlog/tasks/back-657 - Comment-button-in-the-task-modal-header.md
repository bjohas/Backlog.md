---
id: BACK-657
title: Comment button in the task modal header
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-28 22:40'
updated_date: '2026-08-28 22:41'
labels: []
dependencies: []
ordinal: 292000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reaching the comment composer means scrolling to the bottom of the task modal. Add a Comment action in the header next to Edit that opens the composer and puts the cursor in it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Preview mode shows a Comment button immediately right of Edit in the modal header
- [ ] #2 Clicking it reveals the comment composer, scrolls it into view and focuses the body field
- [ ] #3 The button is hidden in edit/create mode and for cross-branch tasks
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Header Comment button after the Edit ternary, same preview-only guard and secondary styling.
2. Ref on the composer textarea; effect on composingComment scrolls it into view and focuses it, so the header button and the inline Add comment button behave alike.
3. Headless: click from the header, assert composer visible, focused and scrolled into view; assert absent in edit mode.
<!-- SECTION:PLAN:END -->
