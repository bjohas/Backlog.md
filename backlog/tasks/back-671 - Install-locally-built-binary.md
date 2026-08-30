---
id: BACK-671
title: Install locally built binary
status: Done
assignee: []
created_date: '2026-08-30 11:02'
updated_date: '2026-08-30 11:04'
labels: []
dependencies: []
modified_files:
  - package.json
  - scripts/build.ts
  - scripts/local-install.ts
  - src/test/local-install.test.ts
priority: medium
type: enhancement
ordinal: 306000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Compile the local fork and update ~/.local/bin/backlog to its executable while preserving bundle-only BACKLOG_BUILD_OUTDIR builds and refusing to overwrite an existing non-symlink executable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run build builds a compiled backlog executable and installs ~/.local/bin/backlog as its symlink
- [x] #2 A build with BACKLOG_BUILD_OUTDIR preserves bundle output without changing the launcher
- [x] #3 The installer updates its own symlink but refuses to replace a non-symlink executable
- [x] #4 Installer behavior is covered by automated tests
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Ordinary bun run build now updates ~/.local/bin/backlog after a successful compiled build. BACKLOG_BUILD_OUTDIR continues to bundle without touching the launcher. Verified both paths in an isolated HOME, including executing the linked binary; automated tests cover create, update, idempotence, and non-symlink protection.
<!-- SECTION:FINAL_SUMMARY:END -->
