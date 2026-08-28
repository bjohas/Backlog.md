---
id: BACK-654
title: Render Quarto .checkbox spans as clickable checkboxes in the web UI
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-28 20:52'
updated_date: '2026-08-28 20:53'
labels: []
dependencies: []
ordinal: 289000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Task text authored in BeeWriter uses the Quarto/Pandoc span `[]{.checkbox}` (unchecked, tight form) / `[x]{.checkbox}` (checked) for inline decision boxes. The tracker's task descriptions are full of them, but the web UI renders them as literal text, so they cannot be ticked without editing the markdown by hand. Render these spans as real checkboxes in the rendered markdown and write the toggled value back to the task file. Unchecking emits the tight `[]{.checkbox}` form, which is the canonical unchecked spelling (pandoc's only fixed point for an empty span).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Checkbox spans in a task description render as checkboxes reflecting their checked state, in place, without disturbing surrounding markdown
- [ ] #2 Clicking one toggles it and persists the change to the task file: unchecked becomes [x]{.checkbox}, checked becomes []{.checkbox}
- [ ] #3 Spans in implementation notes behave the same way
- [ ] #4 Only the clicked span changes; other checkbox spans and all other text stay byte-identical
- [ ] #5 Read-only contexts (cross-branch tasks) render the checkboxes but do not write
- [ ] #6 Tests cover the source transform (parse, count, toggle by index, spelling of both directions)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 bunx tsc --noEmit passes when TypeScript touched
- [ ] #2 bun run check . passes when formatting/linting touched
- [ ] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New src/web/utils/checkbox-spans.ts: anchored span regex, toggleCheckboxSpanAt(source, offset) returning null when the offset does not name a span (fail-safe), and a remark plugin splitting text nodes into hast input nodes carrying the source offset.
2. Offsets come from mdast positions, which are relative to the sanitized source MermaidMarkdown parses, so map sanitized->original offsets before the callback fires; verify the span at the offset before writing.
3. MermaidMarkdown gains an optional onToggleCheckbox prop; delegated click handler on the container, inputs disabled when no callback.
4. TaskDetailsModal wires description + implementation notes with optimistic update, apiClient.updateTask, rollback on failure; skipped for cross-branch tasks.
5. Tests for the transform (count/toggle/spelling/offset mapping); headless verification against a real task with spans, incl. that inline-code spans stay literal.
<!-- SECTION:PLAN:END -->
