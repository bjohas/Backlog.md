---
id: BACK-35048
title: Serve the web UI under a path prefix given by a <base> tag
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-13T09:22:00Z'
updated_date: '2026-11-13T09:46:00Z'
labels: []
dependencies: []
type: feature
ordinal: 410000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BeeWriter serves each project's board at /tasks-ui/ORG/PROJECT/ through a proxy that strips the prefix before forwarding, keeps one backlog browser --no-git process per project at /, and puts <base href="/tasks-ui/ORG/PROJECT/"> into HTML responses (replacing Backlog's own). A <base> only affects relative addresses, and the page builds root-anchored ones: Bun writes /chunk-….js and /chunk-….css into the served index.html, data requests go to /api, the WebSocket to the host root, the router assumes /, and task-ID links in Markdown point at /tasks/<id>. Behind the proxy these miss the board. Build every address from the document's base instead, so the page works at / as before and under any prefix the <base> names. The server keeps answering at plain root paths.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The served index.html (every SPA route) refers to its scripts, stylesheets and icon relative to the base, not from /, in both the compiled binary and bun src/cli.ts; its own <base href="/"> is left for the proxy to replace
- [ ] #2 Data requests, the live-update and health-check WebSockets, router navigation and task-ID links in Markdown resolve against document.baseURI
- [ ] #3 With <base href="/p/"> injected and the prefix stripped, loading /p/ and a deep link /p/board/<id> shows the board, opens the task and receives live updates
- [ ] #4 Served at / with the default <base href="/">, addresses are what they were
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. lib/base-path.ts: APP_BASE_PATH from document.baseURI; WebSocket URL from it.
2. API_BASE, the direct fetches (version, drafts), both WebSockets and BrowserRouter basename use it; Markdown task-ID links become relative (tasks/<id>).
3. Server: Bun writes /chunk-… into the bundled index.html and ignores Bun.build publicPath for HTML imports, so app routes serve the bundle (kept at /_backlog/index.html) with script/link addresses made relative; a WebSocket upgrade on / still reaches the socket handler.
4. Tests: server test for relative asset addresses (fails before); Markdown link expectations. End-to-end behind a stand-in proxy that strips the prefix and injects <base>.
<!-- SECTION:PLAN:END -->
