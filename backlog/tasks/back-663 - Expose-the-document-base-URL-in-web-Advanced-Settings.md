---
id: BACK-663
title: Expose the document base URL in web Advanced Settings
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-29 08:40'
updated_date: '2026-08-29 08:40'
labels: []
dependencies: []
ordinal: 298000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
documentBaseUrl can only be set from the CLI, which also puts it out of reach when the project config is not writable from a given shell. Add it to Advanced Settings with the same validation the CLI applies: an absolute http(s) URL, or empty to clear.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Advanced Settings offers a Document Base URL field showing the configured value, empty when unset
- [ ] #2 Saving persists it as document_base_url and the CLI reads back the same value; clearing the field removes it
- [ ] #3 A value that is not an absolute http(s) URL is rejected inline and blocks the save
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Text field in Advanced Settings bound to config.documentBaseUrl, empty string treated as cleared.
2. validateConfig rejects a non-http(s) value, matching the CLI rule.
3. Headless: save a URL, read it back via the CLI and the reopened dialog; clear it; reject a bad value.
<!-- SECTION:PLAN:END -->
