---
id: BACK-671
title: Install locally built binary
status: Done
assignee: []
created_date: '2026-08-30 11:02'
updated_date: '2026-08-30 11:03'
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
Provide an opt-in command that compiles the local fork and installs its executable ahead of the npm-global launcher without overwriting an existing non-symlink executable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run install:local builds a compiled backlog executable and installs ~/.local/bin/backlog as its symlink
- [x] #2 The installer updates its own symlink but refuses to replace a non-symlink executable
- [x] #3 Installer behavior is covered by automated tests
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an opt-in bun run install:local command that compiles the local binary then maintains ~/.local/bin/backlog as a safe symlink. Verified the install path in an isolated HOME, including binary execution; automated tests cover create, update, idempotence, and non-symlink protection.
<!-- SECTION:FINAL_SUMMARY:END -->
