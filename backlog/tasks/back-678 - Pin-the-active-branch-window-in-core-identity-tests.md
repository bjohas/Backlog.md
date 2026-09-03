---
id: BACK-678
title: Pin the active-branch window in core identity tests
status: Done
assignee:
  - '@claude'
created_date: '2026-09-03 15:13'
updated_date: '2026-09-03 15:14'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 313000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two tests in src/test/core.test.ts fail on main and have done since 2026-08-29:
- 'fails closed when an archive snapshot would otherwise hide distinct active paths'
- 'keeps an ID occupied when equal-time branch records are active and archived'

Both set checkActiveBranches: true but leave activeBranchDays at its default of 30 (src/constants/index.ts:70), then create branch commits stamped 2026-07-30. Once that date passes outside the 30-day window the branches stop counting as active, their task records drop out of identity resolution, and the assertions collapse: getTask no longer sees two candidates, and generateNextId returns BACK-1 instead of BACK-2.

Verified by copying core.test.ts with only the dates changed to 2026-09-02: 66 pass / 0 fail, same code. So this is a fixture time bomb, not a product defect - nothing users run is affected.

Fix: set activeBranchDays explicitly in those two saveConfig calls so the window cannot age out. These tests are about identity resolution across branches, not about branch freshness, so the window should be neutralised rather than tracked.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Both previously failing tests pass regardless of the current date
- [x] #2 The active-branch window is pinned in the tests that depend on it, rather than the fixture dates being made relative
- [x] #3 No production code changes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added activeBranchDays: 3650 beside checkActiveBranches: true in the three core.test.ts fixtures that stamp fixed commit dates (2026-07-30), with a comment explaining why. The two tests that had been failing since 2026-08-29 pass again; the third was pinned pre-emptively because it has the same fixed-date exposure even though it was not yet failing. Verified: core.test.ts 66 pass/0 fail, tsc --noEmit clean, and bun run check . clean across 400 files. git diff --stat confirms the change is 6 added lines in one test file, no production code.
<!-- SECTION:FINAL_SUMMARY:END -->
