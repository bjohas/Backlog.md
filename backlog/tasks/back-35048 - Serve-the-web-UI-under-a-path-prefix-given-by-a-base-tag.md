---
id: BACK-35048
title: Serve the web UI under a path prefix given by a <base> tag
status: Done
assignee:
  - '@claude'
created_date: '2026-11-13T09:22:00Z'
updated_date: '2026-11-13T09:51:00Z'
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
- [x] #1 The served index.html (every SPA route) refers to its scripts, stylesheets and icon relative to the base, not from /, in both the compiled binary and bun src/cli.ts; its own <base href="/"> is left for the proxy to replace
- [x] #2 Data requests, the live-update and health-check WebSockets, router navigation and task-ID links in Markdown resolve against document.baseURI
- [x] #3 With <base href="/p/"> injected and the prefix stripped, loading /p/ and a deep link /p/board/<id> shows the board, opens the task and receives live updates
- [x] #4 Served at / with the default <base href="/">, addresses are what they were
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified:
- server-tasks-spa-fallback: new test (no root-anchored script/link address on / and a deep link; each relative asset loads) fails before the change, passes after; 30/30.
- End-to-end with the compiled binary behind a stand-in proxy (tmp/bp/proxy.ts: strips /tasks-ui/o/p, injects <base href="/tasks-ui/o/p/">, passes WebSockets) in headless Chromium: board renders styled; deep link board/TASK-1 opens the modal; Markdown link href tasks/TASK-1 goes to /tasks-ui/o/p/tasks/TASK-1; WebSockets connect to ws://…/tasks-ui/o/p/; a CLI title edit appears live; side-navigation links are /tasks-ui/o/p/…; no request left the prefix and none returned 4xx. The same script at / gives the root addresses as before.
- One console 'Failed to fetch' (config load) appears identically at / and under the prefix: a request cut off by the script's page.goto.
- Full suite: parallel 3386 pass / 4 fail, all 10 s timeouts under load in CLI tests; rerun alone, 3 pass, cli-timestamps passes alone (known flake). DOM 410 pass / 4 fail: the 3 known web-task-details-modal-final-summary failures plus one selector that expected an absolute /tasks/ href, updated (6/6).
- Types clean for tracked code; Biome clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The web UI now works under a path prefix named by the page's <base href>, as BeeWriter's proxy serves it at /tasks-ui/ORG/PROJECT/ with the prefix stripped. lib/base-path.ts derives the base from document.baseURI; data requests, both WebSockets, the router basename and Markdown task-ID links (now relative) use it. Bun writes the bundled page's script and stylesheet addresses from the root and ignores publicPath for HTML imports, so the server keeps the bundle at /_backlog/index.html and serves it on app routes with those addresses made relative; a WebSocket upgrade on / still reaches the socket handler. At / with the default <base href="/"> every address is what it was. Offered upstream later as a separate PR.
<!-- SECTION:FINAL_SUMMARY:END -->
