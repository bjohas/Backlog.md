---
id: BACK-802
title: Edit documents in an external editor from the browser
status: Done
assignee:
  - '@claude'
created_date: '2026-11-13T09:15:00Z'
updated_date: '2026-11-13T16:07:00Z'
labels: []
dependencies: []
type: feature
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some boards are kept where another program edits the files: a hosted Markdown editor that serves the same repository, or GitHub's web editor. In that setup the browser's own document editor is a second writer for the same file. Whoever starts `backlog browser` can name the editor that owns documents; the Docs page then sends Edit and New document there, in the whole window, and offers no editor of its own. The setting belongs to the server process, not backlog/config.yml, because config.yml is shared with everyone who opens the board on their own machine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 backlog browser accepts --external-editor <pattern> and --external-editor-label <name> together; the pattern is an http(s) address or a same-site path starting with / (for a page behind a proxy that does not know its public address), containing {path}, and a missing partner or a bad pattern stops the command with an error
- [x] #2 Without the options the Docs page is unchanged
- [x] #3 With them, a document's Edit button reads 'Edit in <name>' and opens the pattern with {path} replaced by the document's path from the project root, each segment percent-encoded (so spaces become %20), in the top-level window
- [x] #4 With them, the browser offers no document editor of its own, including for ?edit=true links
- [x] #5 With them, New document asks for title and folder, creates the file, then opens it in the external editor
- [x] #6 The setting is not written to backlog/config.yml
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/utils/external-editor.ts: the setting's type, parseExternalEditor (validation shared by the CLI) and externalEditorUrl (per-segment percent-encoding).
2. backlog browser: --external-editor and --external-editor-label, validated before the server starts; passed to BacklogServer as a constructor option, so nothing reaches config.yml.
3. GET /api/status: externalEditor { urlPattern, label, docsDirectory } or null; docsDirectory is the docs folder relative to the project root.
4. App reads it with the initialization status and passes it to DocumentationDetail.
5. DocumentationDetail: Edit becomes an <a target=_top> 'Edit in <label>'; the editor never opens for an existing document (covers ?edit=true); the new page asks for title and folder only, creates, then sets top.location.href.
6. Tests: server status and config.yml untouched, CLI refusal, URL encoding; jsdom page tests; manual Chromium check from a cross-origin frame.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified in Chromium (playwright-core 1.48) with the board from source inside a cross-origin iframe of a stand-in editor: Edit in BeeWriter opens backlog/docs/guides/doc-1%20-%20Release-plan.md in the top window; ?edit=true shows no editor; New document with folder 'meetings/2026 Q4' creates the file and the top window opens .../meetings/2026%20Q4/doc-2%20-%20Notes-from-the-call.md. A cross-origin frame may not call top.location.assign (SecurityError), so the page sets top.location.href. Full suite: 3303 + 411 pass; one failure in content-frontmatter-preservation is a minute-boundary timestamp flake (13:32 vs 13:33) that passes on rerun with and without this change. bun run check fails only on the untracked pr-list-new-task/biome.json; the changed files pass Biome.

Same-site paths ("/w/ORG/PROJECT/{path}") accepted too, at BeeWriter's request: its server does not know its public address. "//host/..." and relative paths are still refused.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
backlog browser takes --external-editor <pattern with {path}> and --external-editor-label <name> (src/utils/external-editor.ts validates them and builds addresses with each path segment percent-encoded). The server keeps the setting in memory and reports it, with the docs folder's path from the project root, in GET /api/status; config.yml is never touched. With it, the Docs page's Edit is a target=_top link 'Edit in <label>', the built-in editor never opens for an existing document (including ?edit=true), and New document asks for title and folder, creates the file, then sends the top window to the editor. Without it nothing changes. Tests: browser-external-editor.test.ts (status, config.yml unchanged, CLI refusal, encoding) and web-document-external-editor.test.tsx (link, ?edit=true, create then leave). README shows the GitHub-editor example.
<!-- SECTION:FINAL_SUMMARY:END -->
