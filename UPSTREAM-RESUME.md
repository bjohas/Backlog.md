# Upstream integration resume

## State

- Branch `merge/upstream-2026-11` carries the merge of `upstream/main` at `52b4ea3b`
  (v1.55.3) as merge commit `f8817c83`, plus the FORK.md record and task BACK-801.
- `main` is unchanged. The branch is **not** merged into `main` yet.
- Details of the conflict resolutions: the merge commit message and the 2026-11-12 entry
  under "Sync history" in [FORK.md](FORK.md).

## Blocker before landing on main

27 duplicate task ID groups (BACK-686…725). `backlog task list`, `backlog search` and
`backlog board export` exit with an error on the merged tree until they are repaired.
`backlog doctor --fix` is not acceptable as-is (see BACK-801). Decide the ID scheme and
repair mechanism in BACK-801, apply it on this branch, then:

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

## Verification on f8817c83

- `bun run check:types`: clean for tracked code (only error is in `pr-list-new-task/`).
- `bun run check`: clean.
- Full `src/` suite (CI split): parallel 3372 pass / 0 fail; DOM 411 pass / 3 fail. The 3
  are the known `web-task-details-modal-final-summary` conflicts with the fork's
  comment-from-preview button, also failing on `main`.
- `bun run build`: passes; `dist/backlog --version` is 1.55.3. `~/.local/bin/backlog` is a
  symlink to `dist/backlog`, so building on this branch replaces the installed CLI.
