---
id: BACK-666
title: 'Default assignee/comment author from config, falling back to git identity'
status: Done
assignee:
  - '@claude'
created_date: '2026-08-29 13:43'
updated_date: '2026-08-29 13:45'
labels: []
dependencies: []
ordinal: 301000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
defaultAssignee already existed as a CLI-only config key with no web UI, and comment authoring always started blank with no default at all. Expose defaultAssignee in web Settings (Workflow Settings), and when it is unset, fall back to the server's git config user.name for both new-task assignee prefill and the comment-author field, so the reader is not retyping their name every comment. The server-derived value is surfaced via /api/config as gitUserName and never parsed from or written to config.yml.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings > Workflow Settings has a Default Assignee field showing the configured value (comma-separated) with a placeholder/helper noting the git-identity fallback when unset
- [x] #2 With no defaultAssignee configured and a git identity available, new tasks prefill that assignee and the comment-author field prefills the same name
- [x] #3 Setting defaultAssignee explicitly overrides the git fallback everywhere
- [x] #4 The comment author typed for one comment persists for the next comment in the same open session rather than resetting to blank after posting
- [x] #5 gitUserName is never written to config.yml
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. GitOperations.getConfiguredUserName() reading git config user.name, undefined when no repo/identity.
2. Server merges gitUserName into the /api/config GET response only (never parsed/serialized in file-system/operations.ts, so it cannot round-trip into config.yml).
3. App.tsx resolves the effective default assignee (config.defaultAssignee if non-empty, else [gitUserName]) once and passes it to TaskDetailsModal, which already prefills create-mode assignee from that prop.
4. TaskDetailsModal derives defaultCommentAuthor from the same prop and uses it at the two comment-author reset points (fresh open, cancel-edit); drops the post-success reset so the typed author persists for the next comment in the session.
5. Settings: Default Assignee field in Workflow Settings, placeholder showing gitUserName, comma-separated free text.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Headless verification: /api/config returns gitUserName ("bjohas", from git config user.name in the served project); Settings shows the Default Assignee field with that value as the placeholder while empty; opening the Comment composer with no defaultAssignee configured prefills the author field to "bjohas"; setting defaultAssignee=@alex makes both the Settings field and the comment-author prefill show @alex instead, confirming config overrides the git fallback; saving Settings with the field left blank does not write gitUserName into config.yml (grep confirmed absent after a real PUT round-trip). Post-comment reset was changed to only clear the body, keeping the typed author for the next comment in the session. tsc clean; build succeeds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Default Assignee is now editable in web Settings (Workflow Settings), and when unset falls back to the servers git config user.name for both new-task assignee and the comment-author field - resolved once in App.tsx from a new server-derived, never-persisted gitUserName field on the config API response. Config value always overrides the git fallback. Verified headless including the never-persisted guarantee.
<!-- SECTION:FINAL_SUMMARY:END -->
