---
id: BACK-724
title: Detect an unpublishable working tree on every task mutation
status: To Do
assignee: []
created_date: '2026-09-09 18:49'
labels: []
dependencies: []
ordinal: 318000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The working tree is inspected only when guardedTaskPublish is enabled, because the inspection is a side effect of prepareGuardedTaskPublish(). With guarded publishing off, which is the default, a task mutation never looks at Git state at all, so uncommitted or unpushed work in the backlog directory is invisible no matter how long it accumulates. The check itself is cheap and local: the mutation is already invoking Git to commit, and a status limited to the backlog directory needs no network. Making it unconditional gives every project the signal, and gives BACK-725 a maintained state to render rather than one it has to compute for itself.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A task mutation determines whether the backlog directory has uncommitted or unpublished changes regardless of the guardedTaskPublish setting
- [ ] #2 The check performs no network access and is scoped to the backlog directory rather than the whole repository
- [ ] #3 Enabling or disabling guardedTaskPublish changes what happens on a bad state, not whether the state is detected
- [ ] #4 Projects with filesystemOnly set, and directories that are not Git repositories, are unaffected and produce no error
- [ ] #5 Tests cover detection with guarded publishing off, a clean tree reporting clean, and a non-repository project
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
