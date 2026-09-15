---
id: BACK-725
title: 'Show sync state persistently across the CLI, TUI and web'
status: To Do
assignee: []
created_date: '2026-09-09 18:49'
updated_date: '2026-09-09 18:49'
labels: []
dependencies:
  - BACK-723
  - BACK-724
ordinal: 319000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sync state is reported only in reply to an action a user has just taken. The TUI flashes the result of R for six seconds, the web shows a line beside the Sync button that is blank until the first sync returns, and the CLI says nothing at all. The states that matter most are the ones that mean work is not shared: local-changes, ahead and diverged. Those persist until someone acts on them, so they belong in a standing indicator rather than a reply. Because the CLI is the canonical surface, an indicator that appears only in the TUI and browser would be exactly the surface drift the manifesto names as a risk. GuardedTaskSyncStatus and getGuardedTaskSyncTone already model the states and their severity, so this is a presentation problem and should not introduce a second vocabulary for the same thing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Local sync state, meaning uncommitted changes, unpushed commits and divergence, is shown without any network access
- [ ] #2 Behind state is distinguished from local state and shown with the age of the reading rather than triggering a silent fetch
- [ ] #3 The CLI, TUI and web report the same state from the same source, using the existing status and tone vocabulary
- [ ] #4 A healthy project is visibly healthy rather than merely silent, so absence of a warning is not ambiguous
- [ ] #5 The indicator refreshes on state-changing events such as mutations, watcher updates and explicit sync, and not on ordinary navigation
- [ ] #6 Tests cover each reported state and confirm no fetch is issued for the local-only states
- [ ] #7 The transient footer display time is increased, and the persistent indicator is present regardless, because a longer flash on its own does not fix a message that can be missed entirely
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
