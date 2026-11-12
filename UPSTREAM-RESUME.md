# Upstream integration resume

## State captured

- Local branch: `main` at `340d5c48` before this resume file.
- MrLesk upstream: `upstream/main` at `52b4ea3b`.
- Shared merge base: `3c7fde65`.
- Divergence after the current fetch: local `main` has 135 commits not in upstream; `upstream/main` has 129 commits not in local.
- Do not use `git reset` or force-push to integrate. Create a dedicated merge branch from the current local `main`.

## What upstream added since the last reviewed release

The previous review stopped at `v1.52.0` (`c0ec546a`). Upstream has since advanced through `v1.53.0` and `v1.54.0`, plus later untagged work on `main`.

Major shipped areas:

- `task list --json --watch`: complete JSON snapshots on change, watcher lifecycle, pipe shutdown and slow-reader handling.
- CLI pagination, incremental task/documentation edits, JSON draft listing, and clearer failures for malformed dependency, checklist, Definition-of-Done, and initialization input.
- Task lifecycle redesign: archive flow, deletion/restoration of archived tasks, document/decision archive-delete-restore flows, and efficient cleanup previews.
- Decisions: shared locked creation/update paths, marked sections, status changes, `superseded_by`, `updated_date`, view support, and CLI section flags.
- Data preservation: custom frontmatter support and preservation of unknown frontmatter in tasks, drafts, documents, and decisions; duplicate-ID repair improvements.
- Web/TUI correctness and UX: acceptance-criteria indicators, Markdown angle-bracket rendering, board-card dates, navigation after editor close, normalized Enter keys, and date-display coverage.
- Build/security: Bun and dependency upgrades, bytecode/native packaging changes, Nix patch and certificate behavior, and native Git HTTPS trust scoping/hardening.
- Latest commits: closed-stdout clean exit (`BACK-799`), more accurate duplicate-ID blocking guidance (`BACK-800`), acceptance-criteria line-break rejection, correct most-progressed status selection across active branches, and decision-view work.

## Open upstream pull request at review time

- [#1195 — BACK-801: configurable terminal exit confirmation](https://github.com/MrLesk/Backlog.md/pull/1195) is open against upstream `main`. It adds opt-in `confirmExit`, defaulting to `false`, across terminal board, task-list/detail, overview, and document views. It is not in `upstream/main`; do not include it in this integration unless it merges upstream first.

## Integration assessment

A dry-run merge tree produces 11 content conflicts:

1. `src/core/backlog.ts`
2. `src/file-system/operations.ts`
3. `src/git/operations.ts`
4. `src/ui/board.ts`
5. `src/ui/footer-content.ts`
6. `src/ui/task-viewer-with-search.ts`
7. `src/web/components/MermaidMarkdown.tsx`
8. `src/web/components/TaskCard.tsx`
9. `src/web/components/TaskDetailsModal.tsx`
10. `src/web/components/TaskList.tsx`
11. `src/web/utils/date-display.test.ts`

The dry-run auto-merges many other files, including `src/cli.ts`, `src/server/index.ts`, `src/web/App.tsx`, the advanced-config wizard, core content-store, and multiple tests. The upstream delta from `v1.52.0` spans 596 files (+37,301/-8,127), so this is an integration project, not a quick release bump.

Recommendation: merge upstream deliberately on a dedicated branch. Preserve the fork's current behavior where it differs intentionally; do not blindly choose either side for conflicting core, Git, TUI, or web files.

## Next session procedure

```bash
cd ~/development/git/Backlog.md
git fetch upstream
git switch -c merge/upstream-2026-10 main
git merge --no-commit --no-ff upstream/main
```

Then resolve the 11 files above one semantic area at a time. At minimum, run focused tests for each resolved subsystem, followed by:

```bash
bun run check:types
bun test
bun run build
```

Only create the merge commit after those checks pass. Update this file or replace it with the actual merge task record once integration begins.
