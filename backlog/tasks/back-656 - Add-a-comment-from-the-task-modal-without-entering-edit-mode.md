---
id: BACK-656
title: Add a comment from the task modal without entering edit mode
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-28 21:01'
updated_date: '2026-08-28 21:02'
labels: []
dependencies: []
ordinal: 291000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The comment composer only renders in edit mode, so leaving a comment means opening the whole card for editing and saving it. Offer an Add comment control in preview mode that reveals the existing author/body composer and posts through the same commentsAppend path, leaving the modal in preview mode afterwards.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Preview mode offers an Add comment control that reveals the composer and posts the comment
- [ ] #2 The modal stays in preview mode after posting and the new comment appears in the list
- [ ] #3 Edit mode keeps its current composer behaviour, including staying in edit mode after posting
- [ ] #4 The control is hidden for cross-branch (read-only) tasks
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Track composer visibility with state; in preview mode render an Add comment button that reveals the existing author/body composer.
2. Only set preserveEditModeAfterCommentRefresh when actually in edit mode, so a preview-mode comment does not drop the reader into edit mode.
3. Hide the composer again after a successful preview-mode post; keep edit mode behaviour as is; hide for cross-branch tasks.
4. Headless: post from preview, assert the comment appears, the modal stays in preview, and the file gained the comment.
<!-- SECTION:PLAN:END -->
