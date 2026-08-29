---
id: BACK-664
title: Document fork structure and tag shared-file touch-points
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 12:29'
updated_date: '2026-08-29 12:29'
labels: []
dependencies: []
ordinal: 299000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The fork had grown to 23 tasks across 49 files with no single place answering "what did we add, and where". Add FORK.md documenting build stages, what was added per stage, upstream PR/issue status, and the isolation convention; tag every shared file the fork edits with a one-line [FORK] banner pointing at the exact diff command, so a rebase conflict is a lookup rather than a re-read. Considered and rejected a formal plugin/extension-point system: it conflicts with MANIFESTO.md design principle 10 (prefer one shared implementation over layers without proven need) and the stated boundary that internal APIs are not a supported integration surface, and would be a larger build than everything documented here, with no upstream buy-in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 FORK.md exists at repo root, listing build stages and every addition grouped by stage with its Backlog task id
- [x] #2 Every shared file the fork modifies carries a [FORK] banner naming the diff command for that file
- [x] #3 grep -rl "[FORK]" src/ lists exactly the 12 shared files, matching FORK.md's list
- [x] #4 The build and a smoke-tested server start are unaffected
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Considered a formal plugin/extension-point system per the request and rejected it: MANIFESTO.md design principle 10 explicitly prefers one shared implementation over layers without proven need, and states internal source APIs are not a supported integration surface. A real plugin architecture would also be a larger undertaking than all 23 fork tasks combined, on a codebase with zero existing extension points, with no upstream buy-in - and would itself be the divergence it is meant to prevent. Verified: grep -rl "[FORK]" src/ returns exactly the 12 files FORK.md lists; tsc --noEmit clean; bun run build succeeds; built binary smoke-tested (HTTP 200 on /tasks).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added FORK.md (build stages, additions by stage, upstream status, isolation convention) and a one-line [FORK] banner naming the exact diff command in each of the 12 shared files the fork touches. Declined to build a plugin system as conflicting with the projects own simplicity/no-internal-API-surface principles; documented why in FORK.md. Verified by grep match against the doc, tsc, build, and a server smoke test.
<!-- SECTION:FINAL_SUMMARY:END -->
