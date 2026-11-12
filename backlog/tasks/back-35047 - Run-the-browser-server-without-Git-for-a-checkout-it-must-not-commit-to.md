---
id: BACK-35047
title: Run the browser server without Git for a checkout it must not commit to
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-12T21:41:00Z'
updated_date: '2026-11-12T21:42:00Z'
labels: []
dependencies: []
ordinal: 409000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The BeeWriter server runs `backlog browser --no-open --port 6422` (backlog.md-service, backlog-browser-tracker.service) inside ~/bWriter/tracker, a checkout whose Git history BeeWriter manages itself. Backlog must not commit, fetch or push there. The only Git-free mode today is `filesystem_only: true` in backlog/config.yml, which is committed, so setting it for the server turns Git integration off for every clone of that tracker. With the fork's `guarded_task_publish: true` it is worse: every task mutation is refused ("Guarded task publishing cannot run in a filesystem-only project"). The server needs a per-process switch that leaves the shared config as it is.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A browser server started with the switch writes task, draft, document and decision changes to files without any git commit, fetch or push, whatever autoCommit, remote_operations and guarded_task_publish say in config.yml
- [ ] #2 Task mutations succeed under the switch even when guarded_task_publish is true; the web sync control does not run Git
- [ ] #3 Saving web settings under the switch does not write filesystem_only or any other switch value into backlog/config.yml
- [ ] #4 Without the switch, behaviour is unchanged
- [ ] #5 CLI help documents the switch; FORK.md lists it; backlog.md-service uses it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `backlog browser --no-git`: the server process treats the project as filesystem-only. FileSystem gets one process-level override that loadConfig() applies on top of config.yml: filesystemOnly true, guardedTaskPublish and guardedTaskSync false, autoCommit false. Every existing Git gate (GitOperations, shouldAutoCommit, active-branch reads, the guarded transaction, sync) already keys off these values, so no other code changes.
2. saveConfig() writes the on-disk values for the overridden keys, so saving web Settings under --no-git leaves config.yml's Git settings unchanged.
3. Tests: with the override, a task edit through Core makes no commit while guarded_task_publish and auto_commit are true in config.yml; sync reports disabled; saveConfig keeps the file's values; without it, unchanged.
4. CLI help, FORK.md, and backlog-browser-tracker.service in backlog.md-service gain --no-git (that repo is committed separately).
<!-- SECTION:PLAN:END -->
