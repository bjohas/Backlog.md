---
id: BACK-674
title: Bind carriage return alongside enter on the TUI board
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-01 12:17'
updated_date: '2026-09-01 12:18'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 309000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TUI board registers its Enter handler as `screen.key(["enter"], ...)` at src/ui/board.ts:1470. In neo-neo-bblessed (lib/keys.ts:177-184) a carriage return (\r) is named `return` and only a linefeed (\n) is named `enter`. Terminals that send CR for the Enter key therefore reach no handler at all.

That single handler does double duty: in move mode it confirms a pending move (performTaskMove), and outside move mode it opens the task popup. On an affected terminal both actions silently do nothing. The move case is especially opaque because performTaskMove swallows every error unless DEBUG is set, so a failed move and a move that never fired look identical.

Observed on two machines running the same commit: pressing m, selecting a new status, then Enter does nothing on one host, while m/m (m also confirms, board.ts:1596) works on both. The second host happens to deliver LF, so it masks the same defect.

board.ts:1470 is the only ["enter"] registration under src/ui/, and nothing registers "return" anywhere, so this is a single-site fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The TUI board Enter handler responds to both carriage return and linefeed key names
- [ ] #2 Confirming a pending move with Enter persists the move on terminals that send CR
- [ ] #3 Opening the task popup with Enter works on terminals that send CR
- [ ] #4 A regression test asserts the board registers both key names
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Change src/ui/board.ts:1470 to register screen.key(["enter", "return"], ...) so both blessed key names reach the handler.
2. Check for existing board key-registration tests to follow the established pattern.
3. Add a regression test asserting the board registers both "enter" and "return".
4. Run bunx tsc --noEmit, bun run check ., and the scoped test file.
<!-- SECTION:PLAN:END -->
