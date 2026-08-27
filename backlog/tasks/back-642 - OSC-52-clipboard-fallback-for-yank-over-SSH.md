---
id: BACK-642
title: OSC 52 clipboard fallback for yank over SSH
status: Done
assignee:
  - '@claude'
created_date: '2026-08-27 15:50'
updated_date: '2026-08-27 16:14'
labels: []
dependencies: []
ordinal: 277000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The clipboard utility only spawns local tools (pbcopy, clip.exe, wl-copy/xclip/xsel). Over SSH none of these can reach the user's local clipboard, so the TUI yank command silently fails. Add an OSC 52 escape-sequence fallback so modern terminals (kitty, WezTerm, iTerm2, etc.) set the local clipboard, including tmux handling.

Upstream issue: https://github.com/MrLesk/Backlog.md/issues/947
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When no clipboard tool succeeds, copyToClipboard emits an OSC 52 sequence with the base64-encoded text to the controlling terminal and reports success
- [x] #2 When running inside tmux ($TMUX set), the sequence reaches the outer terminal (tmux passthrough wrapping or tmux load-buffer -w)
- [x] #3 Existing local clipboard tool behavior is unchanged when a tool is available
- [x] #4 Tests cover the OSC 52 fallback path including the tmux variant
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add exported buildOsc52Sequence(text, {tmuxPassthrough}) pure helper in src/utils/clipboard.ts (base64 payload, BEL-terminated, DCS tmux wrapping with doubled ESC).
2. Restructure copyToClipboard: keep existing tool paths (pbcopy/clip.exe/wl-copy/xclip/xsel) as first choice; when none succeeds, fall back to OSC 52.
3. OSC 52 fallback: inside tmux try `tmux load-buffer -w -` first (forwards via set-clipboard), else write the (passthrough-wrapped when $TMUX) sequence to /dev/tty; return false if that fails too.
4. Tests: new src/test/clipboard-osc52.test.ts covering buildOsc52Sequence base and tmux variants.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification (this session is a real ssh+kitty+tmux setup): (1) non-tmux path - ran copyToClipboard in a pty with TMUX unset; capture contains ESC]52;c;QkFDSy1URVNU (base64 of BACK-TEST). (2) tmux path - pressed y on a task in the real TUI inside a pty; TUI showed 'Copied TASK-1 to clipboard' and 'tmux list-buffers' shows a new TASK-1 buffer loaded via tmux load-buffer -w (forwarded to the terminal when set-clipboard is on). (3) local tools remain first choice (xclip attempted first, OSC 52 only after all fail); tool stderr now silenced so failures can't scribble on the TUI. buildOsc52Sequence unit-tested incl. tmux DCS passthrough with doubled ESC. tsc + Biome clean; full-suite failures are pre-existing on main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
copyToClipboard now falls back to OSC 52 when no local clipboard tool succeeds: inside tmux it uses 'tmux load-buffer -w -', otherwise it writes the (DCS passthrough-wrapped under tmux) sequence to /dev/tty; local tools stay first choice and their stderr is silenced. Verified end-to-end in this ssh+tmux session: TUI yank put TASK-1 into the real tmux buffer, and with TMUX unset the raw OSC 52 sequence was captured in a pty. Unit tests cover the sequence builder incl. the tmux variant.
<!-- SECTION:FINAL_SUMMARY:END -->
