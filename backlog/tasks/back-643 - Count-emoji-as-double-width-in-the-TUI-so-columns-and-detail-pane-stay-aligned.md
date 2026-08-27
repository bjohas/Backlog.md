---
id: BACK-643
title: Count emoji as double-width in the TUI so columns and detail pane stay aligned
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 17:31'
updated_date: '2026-08-27 17:31'
labels: []
dependencies: []
ordinal: 278000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Emoji in task titles break TUI rendering in two ways with one root cause: neo-neo-bblessed measures every emoji as 1 terminal cell (its eastasianwidth dependency classifies all emoji as Narrow) while modern terminals render them as 2. On the kanban board, rows with emoji titles shift one column right after the emoji, breaking column border alignment. In the list view, detail-pane re-renders interleave stale and new characters on any terminal row whose list entry contains an emoji, producing garbled text. Fix by patching neo-neo-bblessed charWidth (via bun patchedDependencies) to count emoji-presentation codepoints as width 2 and VS16 as width 1, until fixed upstream.

Reproduced: pty capture of board at 100 cols shows border cell at col 33 vs emoji rows at 34; tmux capture of live session shows detail-pane garbling exactly on emoji rows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Board columns render with aligned borders when task titles contain common emoji (verified via pty capture)
- [ ] #2 Patched neo-neo-bblessed strWidth returns 2 for single-codepoint emoji (e.g. rocket, bug, sparkles, check mark) and 2 for VS16 sequences like warning-sign+FE0F
- [ ] #3 Width behavior for plain ASCII and CJK Wide characters is unchanged
- [ ] #4 The dependency patch is applied via bun patchedDependencies so bun i reproduces it
- [ ] #5 Tests cover the patched width measurements
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. bun patch neo-neo-bblessed; edit lib/unicode.ts charWidth: VS16 (FE0F) -> width 1; emoji-presentation codepoints (explicit BMP list + 1F300-1F5FF, 1F600-1F64F, 1F680-1F6FF, 1F7E0-1F7EB, 1F90C-1F9FF, 1FA70-1FAFF) -> width 2; leave ASCII/CJK/regional indicators unchanged.
2. bun patch --commit to record under patches/ + package.json patchedDependencies.
3. Repo test asserting patched strWidth values (emoji=2, VS16 pair=2, ASCII=1, CJK Wide=2).
4. Verify in pty: board at 100 cols with emoji title renders aligned border columns; confirm fullUnicode path active.
5. tsc/biome/scoped tests; rebuild dist/backlog.
<!-- SECTION:PLAN:END -->
