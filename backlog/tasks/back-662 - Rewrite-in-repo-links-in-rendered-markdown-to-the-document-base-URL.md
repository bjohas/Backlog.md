---
id: BACK-662
title: Rewrite in-repo links in rendered markdown to the document base URL
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 08:37'
updated_date: '2026-08-29 08:39'
labels: []
dependencies: []
ordinal: 297000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
documentBaseUrl currently only affects the documentation frontmatter field. Task text also carries repo-relative markdown links (docs/x.md, ../../docs/x.md), which the web UI renders as dead in-app links. Rewrite those hrefs to the base URL when rendering markdown, leaving absolute URLs, data URIs, anchors and the app own routes (notably the generated /tasks/<id> links) alone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A repo-relative link such as docs/x.md or /docs/x.md renders as base + /docs/x.md and opens externally
- [x] #2 Parent-relative links like ../../docs/x.md normalise to the same target
- [x] #3 Absolute URLs, data URIs, mailto and in-page anchors are untouched
- [x] #4 Generated /tasks/<id> links and other app routes stay internal
- [x] #5 With no base URL configured, link rendering is unchanged
- [x] #6 Tests cover the rewrite rules
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. resolveRepoLinkUrl in document-url.ts: skip schemes/anchors/app routes, strip ./ and ../ segments, join onto the base.
2. DocumentBaseUrlContext mirroring TaskIdIndexContext; App provides config.documentBaseUrl.
3. MermaidMarkdown urlTransform consults it, keeping the existing hash-link behaviour.
4. Tests for the rules; headless check on a task carrying each link shape.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless against a fixture carrying every link shape: docs/x.md, /docs/x.md and ../../docs/x.md all resolve to <base>/docs/x.md; https://example.com/x untouched; the generated /tasks/TASK-1 link stays internal; #section still resolves within the current route. No page errors. 9 unit tests cover the rules including data:, mailto:, protocol-relative and the app-route exclusions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Repo-relative markdown links now open against documentBaseUrl through the shared url transform, with schemes, anchors and app routes excluded. Verified headless across six link shapes.
<!-- SECTION:FINAL_SUMMARY:END -->
