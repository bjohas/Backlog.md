---
id: BACK-643
title: Count emoji as double-width in the TUI so columns and detail pane stay aligned
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 17:31'
updated_date: '2026-08-27 17:44'
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
- [x] #1 Board columns render with aligned borders when task titles contain common emoji (verified via pty capture)
- [x] #2 Patched neo-neo-bblessed strWidth returns 2 for single-codepoint emoji (e.g. rocket, bug, sparkles, check mark) and 2 for VS16 sequences like warning-sign+FE0F
- [x] #3 Width behavior for plain ASCII and CJK Wide characters is unchanged
- [x] #4 The dependency patch is applied via bun patchedDependencies so bun i reproduces it
- [x] #5 Tests cover the patched width measurements
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. bun patch neo-neo-bblessed; edit lib/unicode.ts charWidth: VS16 (FE0F) -> width 1; emoji-presentation codepoints (explicit BMP list + 1F300-1F5FF, 1F600-1F64F, 1F680-1F6FF, 1F7E0-1F7EB, 1F90C-1F9FF, 1FA70-1FAFF) -> width 2; leave ASCII/CJK/regional indicators unchanged.
2. bun patch --commit to record under patches/ + package.json patchedDependencies.
3. Repo test asserting patched strWidth values (emoji=2, VS16 pair=2, ASCII=1, CJK Wide=2).
4. Verify in pty: board at 100 cols with emoji title renders aligned border columns; confirm fullUnicode path active.
5. tsc/biome/scoped tests; rebuild dist/backlog.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: neo-neo-bblessed dist bundle uses eastasianwidth (pre-Unicode-9 data, all emoji Narrow) for charWidth AND hardcoded wide-char regexes for layout; the shipped dist/blessed.{js,mjs} bundle is what runs (lib/*.ts is not), so the patch covers lib/unicode.ts + both dist bundles identically. Widths and layout regexes now computed from unicode-properties EAW data (single source of truth, ~13ms one-time cost); VS16 handled context-aware. Verified: pty board render border at col 33 on emoji and non-emoji rows alike (was col 34 on emoji rows); unit tests (4) pass; tsc/biome clean; known limitation: post-Unicode-13 emoji (e.g. U+1FAE0) still Narrow in unicode-properties data. Entry-redirect-to-TS approach was tried and abandoned (Bun CJS wrapper error).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Patched neo-neo-bblessed via bun patchedDependencies so emoji count 2 cells in both charWidth and the layout regexes, deriving all width data from unicode-properties EAW instead of stale hardcoded tables. Fixes kanban border misalignment and detail-pane stale-cell garbling on emoji rows. Verified by pty renders (border col 33 aligned) and unit tests.
<!-- SECTION:FINAL_SUMMARY:END -->
