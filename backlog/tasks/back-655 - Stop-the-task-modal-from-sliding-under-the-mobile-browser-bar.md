---
id: BACK-655
title: Stop the task modal from sliding under the mobile browser bar
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-28 21:00'
updated_date: '2026-08-28 21:01'
labels: []
dependencies: []
ordinal: 290000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The task modal is capped at max-h-[94vh]. On phones vh resolves to the large viewport (as if the URL bar were retracted), so with the bar showing the dialog is taller than the visible area; centred in its overlay it overflows top and bottom and the first line of the title disappears behind the browser bar. Use the dynamic viewport unit so the cap tracks the actually visible height.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The modal is capped with a dynamic viewport unit so its top stays visible while the mobile browser bar is shown
- [ ] #2 Desktop rendering and the existing max width/scroll behaviour are unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Swap max-h-[94vh] for max-h-[94dvh] in Modal.tsx.
2. Confirm the utility reaches the built CSS and rendering is unchanged at desktop and phone widths.
<!-- SECTION:PLAN:END -->
