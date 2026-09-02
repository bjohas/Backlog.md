---
id: BACK-675
title: Surface task move failures in the TUI board footer
status: Done
assignee:
  - '@claude'
created_date: '2026-09-02 12:25'
updated_date: '2026-09-02 12:50'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
performTaskMove in src/ui/board.ts catches every error and logs it only when process.env.DEBUG is set. On failure it resets moveOp and re-renders, so the task silently flips back to its original column with no explanation.

Every guarded-publish precondition failure lands here with a specific, actionable message that the user never sees:
- 'Guarded task publishing requires a clean worktree and index.'
- 'Guarded task publishing cannot fast-forward <branch> from <ref>; reconcile the branch manually.'
- 'Guarded task publishing requires <branch> to match <ref>; publish or reconcile local commits first.'

In practice this cost hours of diagnosis across two machines: a move that never fired and a move that threw are visually identical, and the real cause (a dirty worktree, or a branch ahead of its upstream) was one sentence away the whole time.

The board already has showTransientFooter for exactly this kind of message, used by the archive and complete handlers nearby, so the fix is to reuse it rather than add a new surface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failed task move shows the underlying error message in the board footer instead of silently reverting
- [x] #2 The footer message is derived from the thrown error, so guarded-publish preconditions surface their specific text
- [x] #3 A successful move still shows no error and behaves as before
- [x] #4 Existing DEBUG logging behaviour is preserved
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In performTaskMove (src/ui/board.ts), replace the silent catch with showTransientFooter carrying the error message, matching the archive/complete handlers' existing pattern.
2. Keep the DEBUG console.error and the moveOp reset/re-render.
3. Extract the message safely (error instanceof Error ? error.message : fallback), as the nearby archive handler already does.
4. Verify tsc, biome on touched files, and the board test suite.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the silent catch in performTaskMove (src/ui/board.ts) with a showTransientFooter call carrying the thrown error's message, reusing the board's existing transient-footer surface (already used by the archive and complete handlers). DEBUG logging and the moveOp reset/re-render are unchanged; transientFooterContent takes precedence in updateFooter so renderView does not stomp the message. Verified live on kitty: forcing a dirty worktree made m/arrow/Enter report 'Move failed: Guarded task publishing requires a clean worktree and index.' instead of silently springing back. tsc --noEmit clean, biome clean on the touched file, board suites 16 pass/0 fail.
<!-- SECTION:FINAL_SUMMARY:END -->
