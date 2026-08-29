---
id: BACK-659
title: Open documentation entries against a configurable base URL
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 06:56'
updated_date: '2026-08-29 07:00'
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
- [x] #1 documentBaseUrl is settable, gettable and listed via backlog config, rejecting values that are not absolute http(s) URLs and accepting an empty value to clear it
- [x] #2 With the key set, relative documentation entries render as links to base + path and open in a new tab
- [x] #3 Absolute URLs in the documentation field are unaffected, and with no key set entries render as they do today
- [x] #4 A trailing slash on the base or a leading slash on the path does not produce a doubled slash
- [x] #5 Tests cover the URL joining and the config round-trip
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. BacklogConfig.documentBaseUrl; parse/serialize document_base_url; recognise it in the config watcher.
2. CLI config get/set/list with absolute-http(s) validation and empty-to-clear.
3. Shared resolveDocumentUrl helper (join, slash-normalising, absolute passthrough) used by the modal Documentation section; pass the prefix from App config.
4. Tests for the helper plus a CLI round-trip; headless check against a task with a relative doc path.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified: config set/get/list round-trips and writes document_base_url to config.yml; a non-URL value is rejected; empty clears. Headless against a fixture task carrying both a relative doc path and an absolute URL: docs/mobile-menubar-disappears.md rendered as a link to https://beewriter.opendev.space/w/org_.../beewriter-tracker/docs/mobile-menubar-disappears.md (target=_blank) while the GitHub URL was passed through unchanged; no page errors. 4 helper tests cover joining, slash normalisation, absolute passthrough and the no-base case. BeeWriter serves documents with their extension (apps/writer/src/index.tsx: "Open documents as /w/<org>/<project>/<file.md|file.qmd>"), so the stored path is joined as-is rather than stripping .md. Not yet enabled on the tracker itself: its backlog/config.yml is outside this sandbox write access, so the user runs the config set.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a documentBaseUrl config key; relative documentation paths now render as links against it (BeeWriter workspace URLs), absolute entries unchanged and no-key rendering unchanged. Verified by CLI round-trip, helper tests and a headless render check.
<!-- SECTION:FINAL_SUMMARY:END -->
