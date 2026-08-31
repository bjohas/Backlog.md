---
id: BACK-672
title: Investigate relative due-date display regressions
status: Done
assignee: []
created_date: '2026-08-31 15:44'
updated_date: '2026-08-31 21:10'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 307000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Findings

The current unstaged relative due-date display changes break three established absolute-UTC presentation contracts.

- `src/test/web-milestones-page-search.test.tsx` fails twice: `MilestonesPage` renders `Due: <relative duration>` and no longer uses configured `dateFormat`, while the prior contract was `Due (UTC): <formatted timestamp>`.
- `src/test/tui-task-type.test.ts` fails once: `formatTaskListItem` now renders a relative duration rather than `due <timestamp> (UTC)`.
- Each file fails in an independent Bun invocation, so these are intrinsic regressions, not suite-order effects.

The baseline absolute-UTC behavior and tests originated in BACK-401 / PR #910. The current formatter/caller additions are uncommitted, so this is not attributable to a recent merged PR.

Full-suite-only React `window is not defined` and symlink-test `git` ENOENT failures remain an unconfirmed suite-order/environment interaction: the affected files pass in separate invocations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Decide and implement the intended absolute-versus-relative due-date contract for web milestones and TUI task cards
- [x] #2 Update the affected presentation tests to the intended contract
- [x] #3 Run the affected web and TUI test files independently
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented `relativeDueDates` as the source of truth across TUI cards/details and all web due-date surfaces. Unset/false preserves configured absolute UTC formatting; true renders relative durations. The CLI now supports `config get/set relativeDueDates`, persisted as `relative_due_dates`.

Verification:
- `bunx biome check` for all touched files
- `bunx tsc --noEmit`
- isolated due-date suite: 22 pass, 0 fail
- `relativeDueDates` CLI round trip: 1 pass, 0 fail
<!-- SECTION:NOTES:END -->
