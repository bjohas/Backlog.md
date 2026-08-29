---
id: BACK-662
title: Rewrite in-repo links in rendered markdown to the document base URL
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-29 08:37'
updated_date: '2026-08-29 08:37'
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
- [ ] #1 A repo-relative link such as docs/x.md or /docs/x.md renders as base + /docs/x.md and opens externally
- [ ] #2 Parent-relative links like ../../docs/x.md normalise to the same target
- [ ] #3 Absolute URLs, data URIs, mailto and in-page anchors are untouched
- [ ] #4 Generated /tasks/<id> links and other app routes stay internal
- [ ] #5 With no base URL configured, link rendering is unchanged
- [ ] #6 Tests cover the rewrite rules
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. resolveRepoLinkUrl in document-url.ts: skip schemes/anchors/app routes, strip ./ and ../ segments, join onto the base.
2. DocumentBaseUrlContext mirroring TaskIdIndexContext; App provides config.documentBaseUrl.
3. MermaidMarkdown urlTransform consults it, keeping the existing hash-link behaviour.
4. Tests for the rules; headless check on a task carrying each link shape.
<!-- SECTION:PLAN:END -->
