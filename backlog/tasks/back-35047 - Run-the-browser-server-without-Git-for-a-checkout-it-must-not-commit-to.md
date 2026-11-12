---
id: BACK-35047
title: Run the browser server without Git for a checkout it must not commit to
status: Done
assignee:
  - '@claude'
created_date: '2026-11-12T21:41:00Z'
updated_date: '2026-11-12T22:12:00Z'
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
- [x] #1 A browser server started with the switch writes task, draft, document and decision changes to files without any git commit, fetch or push, whatever autoCommit, remote_operations and guarded_task_publish say in config.yml
- [x] #2 Task mutations succeed under the switch even when guarded_task_publish is true; the web sync control does not run Git
- [x] #3 Saving web settings under the switch does not write filesystem_only or any other switch value into backlog/config.yml
- [x] #4 Without the switch, behaviour is unchanged
- [x] #5 CLI help documents the switch and FORK.md lists it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `backlog browser --no-git`: the server process treats the project as filesystem-only. FileSystem.disableGitForProcess() makes loadConfig() overlay filesystemOnly true and autoCommit, remoteOperations, guardedTaskPublish, guardedTaskSync false on config.yml. Every existing Git gate (GitOperations, shouldAutoCommit, active-branch reads, the guarded transaction, sync) already keys off these values.
2. saveConfig() writes the on-disk values for the overridden keys.
3. Tests in src/test/browser-no-git.test.ts through the HTTP API.
4. CLI help and FORK.md; the service unit is left to the user.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in the commit "BACK-35047 - Run the browser server…" on tasks/back-35047-browser-no-git. src/test/browser-no-git.test.ts (via BacklogServer and HTTP, real Git repo with auto_commit, guarded_task_publish and remote_operations true): task edit, document and decision creation make no commit; POST /api/sync answers status "disabled"; saving web Settings keeps auto_commit/guarded_task_publish/remote_operations true and never writes filesystem_only: true; without the switch a task edit commits. 4 of the 5 tests fail with the source change stashed. Not covered by a test: drafts (same write path as tasks).
Checks: Biome clean; types clean for tracked code; full suite parallel 3388 pass / 0 fail, DOM 411 pass / 3 fail (the known preview-comment tests). The GET /api/config view shows the overridden values, so web Settings shows Git as off for this server; a change the user makes there to those keys is not saved. The backlog.md-service unit (backlog-browser-tracker.service) is not changed: which machine serves the BeeWriter checkout is the user's call.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `backlog browser --no-git` for servers in checkouts whose Git history is managed elsewhere (the BeeWriter server). The process acts filesystem-only (no commit, fetch, push or branch scan; guarded publish off) without touching the shared config.yml, and saving web Settings cannot persist it. Covered by HTTP-level tests against a real Git repo with every commit-causing setting on. Full suite has only the known 3 preview-comment failures, so DoD #3 stays unchecked. The service unit still has to be switched to --no-git on the machine that serves the BeeWriter checkout.
<!-- SECTION:FINAL_SUMMARY:END -->
