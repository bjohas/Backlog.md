---
id: BACK-673
title: Prevent Shift-Enter crashes in TUI task descriptions
status: In Progress
assignee: []
created_date: '2026-08-31 15:44'
updated_date: '2026-08-31 15:50'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 308000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## THE ASK

Please report the terminal emulator/profile used for the crash and run `printf "TERM=%s\n" "$TERM"; tmux show -gv extended-keys`. I recommend this because the source-level `S-enter` path and the installed binary’s normal TUI launch both succeed; the missing fact is the terminal-specific input encoding that emits the original child-widget error.

## Reported behavior

Creating a task through `backlog board`, pressing Shift+Enter while editing the description crashes the compiled CLI with `TypeError: TypeError is not a constructor (evaluating new $[0])`. Ignore unrelated pasted terminal prices.

## Reproduction

1. Open the TUI with `backlog board`.
2. Start a new task and focus its description field.
3. Press Shift+Enter.

## Expected

Shift+Enter inserts a newline in the description without closing the form or crashing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Shift+Enter in a new-task description does not throw or terminate the TUI
- [ ] #2 The description retains the intended newline
- [ ] #3 A regression test covers the key path
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Investigation 2026-08-31

- Current source handles a simulated `S-enter` keypress in the description correctly: the composer test harness routes it to the textarea and preserves a newline without closing the form.
- The installed `backlog` is version 1.50.1 and resolves to this checkout’s `dist/backlog`; direct TUI launch succeeded. This terminal-wrapper PTY did not reproduce the user terminal’s modifier sequence: CSI-u input was inserted as literal `13;2u`.
- The reported compiled message matches `neo-neo-bblessed`’s unhandled child `error` branch, which executes `throw new args[0]()` when no listener exists. That establishes the visible exception mechanism, but not the original error emitted for this terminal’s Shift+Enter sequence.
- Do not change production key handling or the dependency error branch until that original error is identified; source-level Shift+Enter behavior already passes.
<!-- SECTION:NOTES:END -->
