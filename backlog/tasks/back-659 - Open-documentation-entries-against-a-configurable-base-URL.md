---
id: BACK-659
title: Open documentation entries against a configurable base URL
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-29 06:56'
updated_date: '2026-08-29 06:56'
labels: []
dependencies: []
ordinal: 294000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tasks list docs as repo-relative paths (documentation: docs/foo.md), which the web UI shows as inert code text. Add a documentBaseUrl config key so those entries render as links against an external viewer - e.g. https://beewriter.opendev.space/w/<org>/<project> turning docs/foo.md into .../docs/foo.md. Absolute URLs in the field keep working unchanged, and with no key configured the current rendering stays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 documentBaseUrl is settable, gettable and listed via backlog config, rejecting values that are not absolute http(s) URLs and accepting an empty value to clear it
- [ ] #2 With the key set, relative documentation entries render as links to base + path and open in a new tab
- [ ] #3 Absolute URLs in the documentation field are unaffected, and with no key set entries render as they do today
- [ ] #4 A trailing slash on the base or a leading slash on the path does not produce a doubled slash
- [ ] #5 Tests cover the URL joining and the config round-trip
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. BacklogConfig.documentBaseUrl; parse/serialize document_base_url; recognise it in the config watcher.
2. CLI config get/set/list with absolute-http(s) validation and empty-to-clear.
3. Shared resolveDocumentUrl helper (join, slash-normalising, absolute passthrough) used by the modal Documentation section; pass the prefix from App config.
4. Tests for the helper plus a CLI round-trip; headless check against a task with a relative doc path.
<!-- SECTION:PLAN:END -->
