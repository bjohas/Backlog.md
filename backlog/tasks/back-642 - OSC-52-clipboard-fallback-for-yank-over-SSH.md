---
id: BACK-642
title: OSC 52 clipboard fallback for yank over SSH
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-27 15:50'
updated_date: '2026-08-27 15:58'
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
- [ ] #1 When no clipboard tool succeeds, copyToClipboard emits an OSC 52 sequence with the base64-encoded text to the controlling terminal and reports success
- [ ] #2 When running inside tmux ($TMUX set), the sequence reaches the outer terminal (tmux passthrough wrapping or tmux load-buffer -w)
- [ ] #3 Existing local clipboard tool behavior is unchanged when a tool is available
- [ ] #4 Tests cover the OSC 52 fallback path including the tmux variant
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add exported buildOsc52Sequence(text, {tmuxPassthrough}) pure helper in src/utils/clipboard.ts (base64 payload, BEL-terminated, DCS tmux wrapping with doubled ESC).
2. Restructure copyToClipboard: keep existing tool paths (pbcopy/clip.exe/wl-copy/xclip/xsel) as first choice; when none succeeds, fall back to OSC 52.
3. OSC 52 fallback: inside tmux try `tmux load-buffer -w -` first (forwards via set-clipboard), else write the (passthrough-wrapped when $TMUX) sequence to /dev/tty; return false if that fails too.
4. Tests: new src/test/clipboard-osc52.test.ts covering buildOsc52Sequence base and tmux variants.
<!-- SECTION:PLAN:END -->
