---
id: BACK-651
title: Keep the filter actions row clear of the dropdowns on small screens
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 21:46'
updated_date: '2026-08-27 21:46'
labels: []
dependencies: []
ordinal: 286000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On narrow viewports the filter toolbar's left group shrinks (min-w-0) so the actions group (Clean Up / Clear filters / count) squeezes beside the vertically-wrapped filter stack, landing under the opened Status menu. Give the actions group a full-width row below the filters on small screens (w-full sm:w-auto, right-aligned) so it never interleaves with the filter controls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 At phone width the Clear filters button and task count render below all filter controls, right-aligned, not beside them
- [ ] #2 An open status filter menu does not cover the Clear filters button at phone width
- [ ] #3 Desktop-width layout is unchanged (actions right of the filters on one row)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Change the actions group container to w-full sm:w-auto justify-end so it wraps to its own row under 640px.
2. Headless verification at 400px and 1280px: geometry assertions (actions below filters on small, same row on desktop; open menu does not intersect Clear filters) plus screenshots.
<!-- SECTION:PLAN:END -->
