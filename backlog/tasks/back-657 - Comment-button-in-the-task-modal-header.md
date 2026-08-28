---
id: BACK-657
title: Comment button in the task modal header
status: Done
assignee:
  - '@claude'
created_date: '2026-08-28 22:40'
updated_date: '2026-08-28 22:43'
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
- [x] #1 Preview mode shows a Comment button immediately right of Edit in the modal header
- [x] #2 Clicking it reveals the comment composer, scrolls it into view and focuses the body field
- [x] #3 The button is hidden in edit/create mode and for cross-branch tasks
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Header Comment button after the Edit ternary, same preview-only guard and secondary styling.
2. Ref on the composer textarea; effect on composingComment scrolls it into view and focuses it, so the header button and the inline Add comment button behave alike.
3. Headless: click from the header, assert composer visible, focused and scrolled into view; assert absent in edit mode.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless: header buttons read Copy | Demote | Edit | Comment | Close; clicking Comment reveals the composer, focuses the body field and scrolls it fully into view; posting keeps preview mode; the button is absent in edit mode. No page errors.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Comment action right of Edit in the task modal header that opens the composer, scrolls to it and focuses it, sharing one reveal effect with the inline Add comment button. Verified headless.
<!-- SECTION:FINAL_SUMMARY:END -->
