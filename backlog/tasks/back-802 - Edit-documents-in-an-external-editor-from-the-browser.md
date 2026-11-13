---
id: BACK-802
title: Edit documents in an external editor from the browser
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-13T09:15:00Z'
updated_date: '2026-11-13T09:15:00Z'
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
- [ ] #1 backlog browser accepts --doc-editor-url <pattern> and --doc-editor-name <name> together; the pattern is an http(s) address containing {path}, and a missing partner or a bad pattern stops the command with an error
- [ ] #2 Without the options the Docs page is unchanged
- [ ] #3 With them, a document's Edit button reads 'Edit in <name>' and opens the pattern with {path} replaced by the document's path from the project root, each segment percent-encoded (so spaces become %20), in the top-level window
- [ ] #4 With them, the browser offers no document editor of its own, including for ?edit=true links
- [ ] #5 With them, New document asks for title and folder, creates the file, then opens it in the external editor
- [ ] #6 The setting is not written to backlog/config.yml
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bun run check:types passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->
