---
id: BACK-654
title: Render Quarto .checkbox spans as clickable checkboxes in the web UI
status: Done
assignee:
  - '@claude'
created_date: '2026-08-28 20:52'
updated_date: '2026-08-28 21:04'
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
- [x] #1 Checkbox spans in a task description render as checkboxes reflecting their checked state, in place, without disturbing surrounding markdown
- [x] #2 Clicking one toggles it and persists the change to the task file: unchecked becomes [x]{.checkbox}, checked becomes []{.checkbox}
- [x] #3 Spans in implementation notes behave the same way
- [x] #4 Only the clicked span changes; other checkbox spans and all other text stay byte-identical
- [x] #5 Read-only contexts (cross-branch tasks) render the checkboxes but do not write
- [x] #6 Tests cover the source transform (parse, count, toggle by index, spelling of both directions)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New src/web/utils/checkbox-spans.ts: anchored span regex, toggleCheckboxSpanAt(source, offset) returning null when the offset does not name a span (fail-safe), and a remark plugin splitting text nodes into hast input nodes carrying the source offset.
2. Offsets come from mdast positions, which are relative to the sanitized source MermaidMarkdown parses, so map sanitized->original offsets before the callback fires; verify the span at the offset before writing.
3. MermaidMarkdown gains an optional onToggleCheckbox prop; delegated click handler on the container, inputs disabled when no callback.
4. TaskDetailsModal wires description + implementation notes with optimistic update, apiClient.updateTask, rollback on failure; skipped for cross-branch tasks.
5. Tests for the transform (count/toggle/spelling/offset mapping); headless verification against a real task with spans, incl. that inline-code spans stay literal.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification on a fixture mirroring the tracker corpus (tight, spaced, checked spans plus one quoted in inline code): 4 checkboxes rendered with states [false,false,true,false] and the code-quoted span stayed literal text; clicking box 1 wrote `- [x]{.checkbox} **A only** *(recommended)*` with every other span byte-identical; clicking again wrote the tight `[]{.checkbox}`; unticking the pre-ticked span also produced the tight form; no page errors. 8 unit tests cover count/toggle/spelling/offset-refusal/link-skipping. Key design point: toggles are addressed by SOURCE OFFSET, not ordinal, because the corpus quotes checkbox syntax inside inline code - an ordinal scheme would silently tick the wrong box. The sanitizer now reports where it expands `<` so mdast positions map back to the original source, and a write is refused unless a span really starts at the offset.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A remark plugin renders Quarto `[]{.checkbox}` / `[x]{.checkbox}` spans in task descriptions and implementation notes as real checkboxes; clicking one rewrites that span in the markdown source and saves the section. Spans quoted inside code stay literal. Verified headless against a corpus-shaped fixture and by unit tests.
<!-- SECTION:FINAL_SUMMARY:END -->
