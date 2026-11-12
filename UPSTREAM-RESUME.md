# Upstream integration resume

## State

- Branch `merge/upstream-2026-11` carries the merge of `upstream/main` at `52b4ea3b`
  (v1.55.3) as merge commit `f8817c83`, the FORK.md record, and the task ID repair
  BACK-35043.
- `main` is unchanged. The branch is **not** merged into `main` yet.
- Details of the conflict resolutions: the merge commit message and the 2026-11-12 entry
  under "Sync history" in [FORK.md](FORK.md). The ID scheme: "Task IDs" in FORK.md.

## Task IDs

Repaired on the branch: fork tasks are at BACK-35001…35043 and upstream records have
their `upstream/main` paths and IDs. `backlog doctor` reports no duplicate IDs in the
tree; `task list`, `search` and `board export` work again. Its remaining
"cross-branch" report pairs `main` with this branch and goes away once the branch is
merged.

## Landing on main

Needs Alex's go-ahead (it places commits on `main`):

```bash
git switch main
git merge --no-ff merge/upstream-2026-11
```

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
