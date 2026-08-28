---
id: BACK-655
title: Stop the task modal from sliding under the mobile browser bar
status: Done
assignee:
  - '@claude'
created_date: '2026-08-28 21:00'
updated_date: '2026-08-28 21:04'
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
- [x] #1 The modal is capped with a dynamic viewport unit so its top stays visible while the mobile browser bar is shown
- [x] #2 Desktop rendering and the existing max width/scroll behaviour are unchanged
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Swap max-h-[94vh] for max-h-[94dvh] in Modal.tsx.
2. Confirm the utility reaches the built CSS and rendering is unchanged at desktop and phone widths.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cause: max-h-[94vh] with vh = the LARGE viewport on mobile (browser bar retracted). With the bar shown the dialog exceeded the visible height and, centred in its overlay, overflowed top and bottom - the title first line ending up behind the bar. Verified the built binary now ships max-height:94dvh and no 94vh; modal still fits and shows its title fully at 400x800 and 1280x900. Note: headless Chromium has no dynamic browser bar, so the mobile behaviour itself is reasoned from the CSS unit rather than directly reproduced - worth a check on the phone.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Modal height cap moved from vh to dvh so it tracks the visible viewport and cannot push its own header behind the mobile browser bar. Built CSS confirmed; desktop and phone-width rendering unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
