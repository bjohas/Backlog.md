---
id: BACK-665
title: Fix checkboxes that can be checked but not unchecked in the web UI
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 13:33'
updated_date: '2026-08-29 13:43'
labels: []
dependencies: []
ordinal: 300000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reported: opening a task and clicking an already-checked box (or a box just checked in the same session) leaves the rendered checkbox visually checked even though the underlying markdown correctly flips to unchecked. Root cause: our checkbox <input> is controlled (checked prop) with no onChange (by design - the markdown source is the state, not DOM state), and MDEditor.Markdown (@uiw/react-markdown-preview, which passes components straight through to react-markdown) can leave the browser's native checked DOM property out of sync with the checked prop after the native click-then-preventDefault-revert sequence, so a later re-render with the correct value does not always force the DOM to match. Fix by giving the rendered <input> a components override that keys it by its checked state, forcing React to discard and recreate the DOM node whenever checked changes rather than reconciling it in place.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking an already-checked box unchecks it, both when it was checked before the modal opened and when it was checked earlier in the same open session
- [x] #2 Repeated check/uncheck cycles on the same box track the underlying data every time
- [x] #3 Multiple independent checkboxes on the same task toggle independently
- [x] #4 Regression: the fresh-fetch-before-write behavior from BACK-660 and read-only rendering are unaffected
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a components override (input -> small wrapper) to MDEditor.Markdown in MermaidMarkdown.tsx, keyed by checked+offset for backlog-checkbox-span elements so React remounts the DOM node on every state change instead of reconciling it in place; pass other <input> elements through unchanged.
2. Re-run the exact repro (already-checked box + check-then-uncheck in one session) headless; add both to the regression suite.
3. Verify multi-checkbox independence and the BACK-660 fresh-fetch/stale-notice path still work.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: the checkbox <input> is controlled (checked prop) with no onChange by design (markdown source is the state), and MDEditor.Markdown (@uiw/react-markdown-preview, which forwards `components` straight to react-markdown) left the browser's native checked DOM property out of sync with the checked prop after the native click-then-preventDefault-revert sequence on a later re-render. Fixed by adding a components override for backlog-checkbox-span inputs, keyed by their checked value (plus offset), forcing React to discard and recreate the DOM node on every state change instead of reconciling in place. Verified headless against the reported scenario twice: (1) a box already checked when the modal opens now unchecks correctly (was stuck true, now false, desc []); (2) check-then-uncheck within one open session round-trips correctly (was stuck true after the second click, now false). Also verified two independent checkboxes toggle independently and the BACK-660 fresh-fetch path is unaffected (same handler, unchanged). tsc clean; build succeeds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Checkboxes rendered by MermaidMarkdown now key their DOM node by checked state via a components override, so React always creates a fresh native input on toggle instead of risking a stale checked property from the click-preventDefault-revert sequence. Fixes the reported cannot-uncheck bug; verified against both the already-checked-on-open and check-then-uncheck-in-session scenarios.
<!-- SECTION:FINAL_SUMMARY:END -->
