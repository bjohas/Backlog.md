# Upstream integration resume

## State

- Local `main` (5ab70daa) has the `--no-ff` merge of `merge/upstream-2026-11`: upstream
  v1.55.3 (merge commit `f8817c83`) and the task ID repair BACK-35043. `backlog doctor`
  is clean on it. Details: the 2026-11-12 "Sync history" entry and "Task IDs" in
  [FORK.md](FORK.md).
- It is pushed to GitHub as branch `local-main-2026-11`, **not** as `main`.

## Blocker before pushing main

`origin/main` (59146dd3, 2026-09-15) has 10 commits local `main` never had, including
fork tasks BACK-727 (list-view sort cycle) and BACK-728 (N creates a task from the list
view). They conflict with upstream's rewritten list view and have to be ported. That
work is BACK-35044. When it is done, merge `origin/main` into `main` with `--no-ff` and
push `main` (no force-push).

## Tooling notes

- Upstream needs Bun 1.4.4 (`bun run check:types` is `bun --check`). The repo-local
  `node_modules/.bin/bun` is replaced by `bun install`; install 1.4.4 separately and put it
  first on PATH.
- The gitignored `pr-list-new-task/` directory is a stale source copy. `bun run check:types`
  and `bun test <path>` (substring path match, also inside `scripts/run-ci-tests.ts`) pick
  it up and report its errors. Pass `./`-anchored paths, or remove that directory.
- `~/.local/bin/backlog` is a symlink to `dist/backlog`, so `bun run build` on any branch
  replaces the installed CLI.

## Verification on f8817c83

- `bun run check:types`: clean for tracked code (only error is in `pr-list-new-task/`).
- `bun run check`: clean.
- Full `src/` suite (CI split): parallel 3372 pass / 0 fail; DOM 411 pass / 3 fail. The 3
  are the known `web-task-details-modal-final-summary` conflicts with the fork's
  comment-from-preview button, also failing on `main`.
- `bun run build`: passes; `dist/backlog --version` is 1.55.3.
