# OpenDevEd fork: what's added, and how it's organized

This file exists so a future rebase, a new contributor, or future-us can answer
"what did we change, and why" without re-reading the fork's commits. It documents the
**fork's own structure**, not Backlog.md itself — see `MANIFESTO.md` and
`CLAUDE.md` for that.

## Why not a plugin system

Before organizing anything, it's worth saying why the fork isn't structured as
a plugin architecture, since that was the natural-sounding fix for "we might
diverge quickly":

- `MANIFESTO.md` design principle 10: *"Simplicity earns trust. Prefer one
  shared implementation and a small public surface over layers, aliases, or
  compatibility machinery without a proven need."* A plugin/extension-point
  system is exactly that kind of layer, upstream has never asked for one, and
  the manifesto separately states *"Internal source-code APIs are
  implementation details, not a supported integration surface."*
- It would also be a bigger build than everything below combined: the CLI is
  one large command dispatcher and the web UI has no hook/middleware layer, so
  a real extension-point system means re-architecting both before writing a
  single plugin. That's a multi-week rewrite carrying its own regression risk,
  undertaken to solve a problem (rebase pain) that a much smaller convention
  (below) already solves for the size of fork this is.
- It would not even reduce divergence — a from-scratch plugin architecture
  *is* the divergence, and a large one, since upstream would need to adopt it
  too for the fork to ever reconverge.

What actually keeps a fork this size mergeable is: (1) push fork-only logic
into its own files instead of scattering it, (2) mark every place a shared
file was touched so a conflict during rebase is a five-minute lookup instead
of a re-read of the diff, and (3) upstream anything that isn't genuinely
fork-specific so it stops being a diff at all. That's what this file and the
`[FORK]` markers below do.

## Build stages

Five independent layers, each buildable/testable on its own:

1. **Core + CLI plumbing** (`src/types/index.ts`, `src/file-system/operations.ts`,
   `src/utils/config-watcher.ts`, `src/cli.ts`, `src/core/init.ts`,
   `src/commands/advanced-config-wizard.ts`) — six config keys
   (`taskListPaneWidth`, `documentBaseUrl`, `relativeDueDates`,
   `guardedTaskSync`, `guardedTaskPublish`, `logGitActions`) and one
   dependency-driven fix (`clipboard.ts` OSC 52 fallback).
2. **Guarded Git** (`src/git/operations.ts`, `src/core/backlog.ts`,
   `src/server/index.ts`) — the largest single addition; see its own section
   below.
3. **TUI** (`src/ui/task-viewer-with-search.ts`, `src/ui/board.ts`,
   `src/ui/unified-view.ts`) — pane width, `R` sync binding, move-failure
   footer. Same build as upstream.
4. **Web UI** (`src/web/**`) — maximize mode, checkbox rendering,
   document-link rewriting, comment UX, settings fields, Sync button. Same
   `bun run build`; no separate bundle.
5. **Local install** (`scripts/local-install.ts`, `install.sh`) — `bun run build`
   symlinks the built binary into `~/.local/bin/backlog`.

There is no separate fork build step — `bun run build` produces `dist/backlog`
with all of the above baked in, same as it would for a stock checkout. The fork
no longer carries any dependency patch: `package.json` and `bun.lock` are
byte-identical to upstream's.

## What's added, by stage

### 1. Core + CLI
| Addition | Config key | Task |
|---|---|---|
| TUI list/detail pane width | `taskListPaneWidth` | BACK-35021, BACK-35012 (web Settings) · upstream PR [#965](https://github.com/MrLesk/Backlog.md/pull/965) (open) |
| Doc-link rewrite base URL | `documentBaseUrl` | BACK-35029, BACK-35031 (web Settings) |
| Relative due-date display | `relativeDueDates` | BACK-35036 |
| OSC 52 clipboard fallback (yank over SSH) | — | BACK-35001 · upstream issue #947, PR [#961](https://github.com/MrLesk/Backlog.md/pull/961) (open) |

### 2. Guarded Git

The fork's largest addition, and the one with no upstream counterpart. Three
config keys, all default `false`:

| Key | Behavior |
|---|---|
| `guardedTaskSync` | Interactive views fetch and fast-forward the current branch, refusing anything that is not a clean fast-forward |
| `guardedTaskPublish` | Every task mutation runs against a clean synchronized checkout, then commits and pushes just that task's files. Implies guarded sync without changing its stored value |
| `logGitActions` | One JSONL record per Backlog-initiated Git command under `$(git rev-parse --git-path backlog-git-actions.jsonl)`, with credentials redacted |

Where it lives:

- `src/git/operations.ts` — fast-forward inspection, checkout-identity pinning,
  `prepareGuardedTaskPublish` / `publishGuardedTaskChanges`, task-only-commit
  detection, the action log.
- `src/core/backlog.ts` — `withTaskMutationTransaction` wraps every mutation
  path (create, update, bulk, reorder, move, archive, promote, demote).
- `src/server/index.ts` + `src/web/lib/api.ts` — `POST /api/sync`, with a
  **Sync** button in the web header, auto-sync on load and tab focus, and a
  60-second freshness window.
- `src/ui/board.ts`, `src/ui/unified-view.ts` — the `R` binding and its
  colour-toned footer results.
- Tasks: BACK-35018 (degrade to a local commit rather than refuse the mutation),
  BACK-35019 (publish deferred task-only commits), BACK-35039.

Documented for users in `README.md` and `ADVANCED-CONFIG.md`.

**`backlog browser --no-git`** (BACK-35047) is the opposite switch, for a server in a
checkout whose Git history something else manages (the BeeWriter server). That one
process treats the project as filesystem-only — no commit, fetch, push or branch scan,
and guarded publish off — while `config.yml`, shared with every clone, stays as it is:
`FileSystem.disableGitForProcess` overlays the values in `loadConfig()` and `saveConfig()`
writes the file's own values for those keys, so saving web Settings cannot persist them.

### 3. TUI
| Addition | Task |
|---|---|
| Board move failures surfaced in the footer | BACK-35038 |
| List view: O cycles the order (default, ID, priority), named in the footer, keeping the selected task | BACK-35045 |
| List view: N opens the task composer, as on the board | BACK-35046 |
| ~~Carriage return bound alongside Enter~~ — superseded in the 2026-11 merge by upstream BACK-791 ([#1152](https://github.com/MrLesk/Backlog.md/pull/1152)), which fixes #1003 | BACK-35017 · PR [#1002](https://github.com/MrLesk/Backlog.md/pull/1002) closed upstream on 2026-09-27 |

### 4. Web UI
| Addition | Task |
|---|---|
| All Tasks maximize mode (persisted, real fullscreen, filters+search usable inside, survives focus loss) | BACK-35002, 35024, 35003, 35006, 35007, 35026, 35010 |
| Updated-date column, sort persisted to local storage and the URL, sortable Assignee | BACK-35025, 35005, 35034, 35016 |
| Copy task ID button | BACK-35004 |
| Checkbox spans (`[]{.checkbox}` / `[x]{.checkbox}`) render as tickable boxes, fresh-fetch-before-write to avoid clobbering concurrent edits | BACK-35027, 35011, 35014 |
| Comment from preview mode (inline + header button) | BACK-35008, 35009 |
| Modal capped by dynamic viewport height (mobile browser bar) | BACK-35028 |
| Documentation entries + in-task repo-relative links open against `documentBaseUrl` | BACK-35029, 35030 |
| Default assignee / comment author from config, falling back to the server's git identity | BACK-35032 |
| Search field and clearer placeholder in the All Tasks panel | BACK-35026, 35015 |

### 5. Deployment (separate repo, not part of this build)
`~/development/services/services/backlog.md-service` — systemd units serving
the tracker project and a cookie-auth proxy for LAN/meshnet access. Entirely
outside this repo; documented in its own README.

## Fork-only modules (self-contained, safe to leave alone in a rebase)

These carry fork logic and touch nothing upstream owns internally:

- `src/web/utils/checkbox-spans.ts`
- `src/web/utils/document-url.ts`
- `src/web/contexts/DocumentBaseUrlContext.tsx`
- `src/utils/utc-date-display.ts` (fork adds `formatDueDateForDisplay`)
- `scripts/local-install.ts`, `install.sh`

## Touch-points in shared files (search `[FORK]`)

Everywhere else, the fork had to edit a file upstream also owns. Each such
file carries a one-line banner near its top tagged `[FORK]`, naming the exact
command that shows what changed there — a live `git diff` rather than a
hand-placed marker, so it can't drift out of sync with the code:

```
$ grep -rln "\[FORK\]" src/
src/cli.ts
src/file-system/operations.ts
src/server/index.ts
src/types/index.ts
src/ui/board.ts
src/ui/task-viewer-with-search.ts
src/utils/clipboard.ts
src/utils/config-watcher.ts
src/web/App.tsx
src/web/components/MermaidMarkdown.tsx
src/web/components/Settings.tsx
src/web/components/TaskDetailsModal.tsx
src/web/components/TaskList.tsx
```

`src/web/components/SideNavigation.tsx` lost its banner in the 2026-09 merge:
upstream took that fix as [#955](https://github.com/MrLesk/Backlog.md/pull/955),
so it is no longer a fork change. Several other shared files now carry fork logic
without a banner yet — `src/git/operations.ts`, `src/core/backlog.ts`,
`src/core/init.ts`, `src/commands/advanced-config-wizard.ts`,
`src/ui/unified-view.ts`, `src/web/lib/api.ts`, `src/web/components/Navigation.tsx`,
`src/web/components/Layout.tsx` — from the guarded-Git workstream. Adding those
banners is outstanding.

Run the file's own `git diff upstream/main..main -- <file>` (or `git log
--oneline upstream/main..main -- <file>` for the commits) to see exactly what
the fork added there.

**Convention going forward:** any new fork-specific change to a shared file
that doesn't already carry a `[FORK]` banner gets one added. New fork-specific
*behavior* goes in its own file under `src/web/utils/` or `src/utils/` where
possible, with the shared file left with only the one wiring line needed to
call it.

## Relationship to upstream

- `main` — this fork's line of development. Work lands here via `--no-ff`
  merges of `tasks/back-NNN-*` branches.
- Everything the fork carries that is a general bug fix (not an opinionated
  feature) should eventually go upstream. `tmp/TODO.md` (untracked) tracks
  upstream PRs worth adopting the other direction.

### Task IDs

The fork and upstream share one `backlog/` folder and one `BACK-` counter, and the CLI
gives a new task the highest ID in the tree plus one. Without a rule the two sides hand
out the same numbers, and every sync brings duplicate IDs. Two rules keep them apart:

- **Fork-only tasks live at BACK-35001 and up.** Create them on `main` or a branch of
  it; the next ID then stays in that range by itself, and upstream never sees it.
- **Tasks for upstream PRs are created on a branch made from `upstream/main`,** so they
  carry upstream's next number. If such a branch is merged into the fork before
  upstream accepts the PR, the fork holds the same file under the same number, which
  does not collide.

Upstream records keep exactly the path and ID they have in `upstream/main`.

The 2026-11 repair (BACK-35043, `scripts/fork-renumber-tasks.ts`) moved every fork task
into the range, keeping their order, and returned 18 upstream records that the 2026-09
repair had renumbered. Branch names (`tasks/back-654-…`), commit messages and the
titles of open upstream PRs (#961 BACK-703, #962 BACK-699, #963 BACK-704) still use the
old numbers. Old → new:

- Fork tasks: 642→35001, 645→35002, 647→35003, 649→35004, 650→35005, 651→35006, 653→35007, 656→35008, 657→35009, 658→35010, 660→35011, 661→35012, 664→35013, 665→35014, 668→35015, 670→35016, 674→35017, 676→35018, 677→35019, 685→35020, 686→35021, 688→35022, 689→35023, 691→35024, 692→35025, 696→35026, 698→35027, 699→35028, 703→35029, 706→35030, 707→35031, 710→35032, 711→35033, 713→35034, 715→35035, 716→35036, 717→35037, 719→35038, 722→35039, 723→35040, 724→35041, 725→35042, 801→35043
- Upstream records returned to their IDs: 687→642, 690→645, 693→649, 694→650, 695→651, 697→653, 700→656, 701→657, 702→658, 704→660, 705→661, 708→664, 709→665, 712→668, 714→670, 718→674, 720→676, 721→677

### Sync history

**2026-09-04** — merged `upstream/main` at `3c7fde65` (43 upstream PRs, fork
point `40482ca0`/BACK-639) via branch `merge/upstream-2026-09`. 19 files
conflicted, 50 hunks. `rerere` is enabled in this repo, so those resolutions
replay when rebasing the PR branches.

Three fork fixes were superseded and now come from upstream instead:

| Fork fix | Upstream |
|---|---|
| Sidebar quick-search score filter | [#955](https://github.com/MrLesk/Backlog.md/pull/955) — the fork's own PR, merged |
| Emoji double-width in the TUI | [#956](https://github.com/MrLesk/Backlog.md/pull/956) — carries the fork's commit; fix vendored into `neo-neo-bblessed` 1.0.10, so the dependency patch is gone |
| Board task popup refresh | [#957](https://github.com/MrLesk/Backlog.md/pull/957) — reimplemented through the board's live-update funnel |

Upstream changes the fork had to be reconciled with:

- **#994** made due dates date-only. `formatDueDateForDisplay` now appends the
  `(UTC)` label only when the stored value carries a time — a bare calendar day
  has no timezone to label. This changed what the fork's own `relativeDueDates`
  renders.
- **#992** introduced `StoredDate` as the single component every web surface uses
  for a stored date. Rather than have four call sites branch on `relativeDueDates`,
  it gained a `relativeDue` prop.
- **#981** replaced full web reloads with in-place updates, over the fork's
  BACK-35007 live-update work.
- **#958/#959** consolidated task search in core, under the fork's BACK-35033 fix.

**Task IDs collided head-on.** Both sides had independently used BACK-641…678,
producing 37 duplicate groups. `backlog doctor --fix` repaired them, renumbering
18 upstream-owned and 19 fork-owned records into BACK-686+. Note the consequence:
BACK-6xx references in this fork's older commit messages may now name a different
task, and the upstream records that were renumbered will collide again on the next
merge. The 2026-11 repair settled this with a reserved range (see "Task IDs").

**2026-11-12** — merged `upstream/main` at `52b4ea3b` (v1.55.3, 129 upstream
commits) via branch `merge/upstream-2026-11`, merge commit `f8817c83`. 11 files
conflicted. Upstream now needs Bun 1.4.4 (`bun --check` is the type checker).

Superseded fork fix: the board's `BOARD_ENTER_KEYS` (BACK-35017). Upstream's
BACK-791 binds `enter` and `linefeed`; also binding `return` would fire twice per
carriage return.

Upstream changes the fork had to be reconciled with:

- **Task lifecycle redesign.** The completed-folder flow and `completeTask` are
  gone; any status can be archived, and archived tasks can be deleted or restored.
  `archiveTask`, `deleteTask`, `restoreTask`, cleanup (`archiveTerminalStatusTasks`)
  and `promoteDraft` took upstream's bodies and are wrapped in
  `withTaskMutationTransaction`; the transaction's commit mode is passed through
  upstream's own `shouldAutoCommit` calls, which keeps the fork's diff there small.
- **HTML parsing switched off in the web preview.** Upstream no longer escapes
  `<`, so checkbox-span offsets are source offsets and the escape-offset mapping
  was dropped.
- **`isReadOnly` replaces `isFromOtherBranch`** in the task modal; the fork's Copy
  ID and comment-from-preview buttons are gated on it.

Known test conflict: three tests in `web-task-details-modal-final-summary.test.tsx`
assert that preview mode shows no "Add comment" button, which the fork adds on
purpose (BACK-35008). They fail on `main` too.

**Task IDs collided again**, as predicted above: 27 groups, BACK-686…725. The
merge leaves them in place because `backlog doctor --fix` would renumber
upstream-owned records too, allocate from BACK-801 (upstream PR #1195's number), and move
all of `backlog/completed/` into `backlog/archive/tasks/` ahead of upstream. The
repair, and the ID scheme that stops it recurring, is BACK-35043: fork tasks moved to
BACK-35001+ and upstream records back to their own IDs (see "Task IDs" above), on the
merge branch, before it was merged into `main`.

**2026-11-12 (origin)** — merged `origin/main` at `59146dd3` (2026-09-15) into the
fork's `main` via branch `tasks/back-35044-origin-main-integration` (BACK-35044). That
history had been pushed from another checkout and never merged here: its own merge of
upstream v1.52.0 and BACK-686 repair, the list-view sort (BACK-727) and task creation
(BACK-728), and removal of two empty Setup Guide documents. Upstream had since rewritten
the list view, so both features were ported rather than merged: the O cycle now steps
through upstream's `--sort` orders (default, `id`, `priority`, starting from the `--sort`
the list was opened with), and the rows keep upstream's status sections. The footer
drops the Complete key with upstream. `scripts/fork-renumber-tasks.ts` (now rerunnable:
tasks already in the fork range keep their IDs) returned origin's BACK-726 to upstream's
BACK-686 and moved BACK-727/728 to BACK-35045/35046.

### Next sync

Re-run `git log --oneline main..upstream/main` and diff-review before merging.
`git merge-tree --write-tree --name-only main upstream/main` gives the conflict
list without touching the working tree.

- Check `origin/main` first (`git fetch origin && git status -sb`): a checkout that is
  behind it must merge it before `main` can be pushed without force.
- After merging, run `bun scripts/fork-renumber-tasks.ts` (dry run, then `--write`) and
  `backlog doctor`; see "Task IDs".
- Upstream needs Bun 1.4.4 (`bun run check:types` is `bun --check`).
- A stray source copy in the working tree (such as the gitignored `pr-list-new-task/`)
  is picked up by `bun run check:types` and by `bun test <path>`, whose path filter
  matches substrings. Pass `./`-anchored test paths, or remove the copy.
- `~/.local/bin/backlog` is a symlink to `dist/backlog`, so `bun run build` on any
  branch replaces the installed CLI.

## Upstream PR candidates (clean branches, not in this fork)

Focused, independent branches based on `upstream/main`, each created for
contribution back to MrLesk/Backlog.md. **All five are still open and all five
predate the 2026-09 merge — they need rebasing onto the current `upstream/main`
before they can land.** `rerere` will replay the merge's resolutions. Each branch lives in its own
worktree under `/home/bjohas/development/git/Backlog.md-worktrees/` and contains
only source and test changes required for its PR, with no fork-specific metadata,
task files, or config changes.

### `pr/enter-key` (worktree: `enter-key/`)
**Status:** ⛔ Superseded by upstream [#1152](https://github.com/MrLesk/Backlog.md/pull/1152) (BACK-791), which fixes #1003 — PR [#1002](https://github.com/MrLesk/Backlog.md/pull/1002) closed upstream on 2026-09-27
**Issue:** [#1003](https://github.com/MrLesk/Backlog.md/issues/1003)
**Changes:**
- `src/ui/board.ts`: bind `"return"` alongside `"enter"` via a new exported `BOARD_ENTER_KEYS`
- `src/test/board-ui.test.ts`: assert both key names are bound

blessed names a carriage return `return` and only a linefeed `enter`, so the
board's Enter handler never fired on terminals that send CR (kitty on Linux among
them) — silently breaking both move confirmation and task popup opening. Based on
`upstream/main` at 3c7fde65. Fork task BACK-35017. Tests: 8 pass locally.

### `pr/osc52-clipboard` (worktree: `osc52/`)
**Status:** ✅ Submitted — [PR #961](https://github.com/MrLesk/Backlog.md/pull/961)
**Target:** upstream issue #947  
**Changes:**
- `src/utils/clipboard.ts`: OSC 52 fallback + tmux passthrough support
- `src/test/clipboard-osc52.test.ts`: focused unit tests (6 cases)

Implements clipboard fallback for SSH/headless environments where no native OS
tool is available. Behavior: local tools unchanged; fallback only after all OS
tools fail. Tests: 5 pass locally.

### `pr/default-reporter` (worktree: `default-reporter/`)
**Status:** ✅ Submitted — PR #962  
**Target:** upstream issue #941 (option 1: apply existing defaultReporter)  
**Changes:**
- `src/core/backlog.ts`: wire config.defaultReporter into createTaskFromInput
- `src/test/core.test.ts`: new test cases (5 expects, both creation paths)

Applies `defaultReporter` config value to every newly created task/draft, same
way `defaultAssignee` flows through. No CLI flag or config get/set exposure
added (out of scope). Verification: 2 focused tests pass locally; full core.test
suite 68/68 pass.

### `pr/tui-pane-width` (worktree: `pane-width/`)
**Status:** ✅ Submitted — [PR #965](https://github.com/MrLesk/Backlog.md/pull/965)
**Issue:** [#946](https://github.com/MrLesk/Backlog.md/issues/946)
**Changes:**
- `src/types/index.ts`: `taskListPaneWidth` config key
- `src/cli.ts`: get/set/list CLI commands with 10–90% validation
- `src/file-system/operations.ts`: parseConfig/serializeConfig round-trip
- `src/utils/config-watcher.ts`: external-edit guard
- `src/ui/task-viewer-with-search.ts`: wired to list/detail split
- `src/test/task-list-pane-width.test.ts`: new; defaults, clamping, fallback
- `src/test/config-commands.test.ts`: new test cases for CLI validation

Replaces hardcoded 40/60 split with user-configurable percentage (default 40).
Verified working via `bun src/cli.ts task list` in real project: split renders 
correctly at configured percentage after window resize and tab-switch. Tests: 4 
pass locally. Feature works; global `backlog` binary unchanged (prebuilt binary 
would require rebuild to include changes).

### `pr/list-view-new-task-binding` (worktree: `list-new-task/`)
**Status:** ✅ Submitted — [PR #963](https://github.com/MrLesk/Backlog.md/pull/963)  
**Issue:** [#964](https://github.com/MrLesk/Backlog.md/issues/964)  
**Changes:**
- `src/ui/task-viewer-with-search.ts`: 'n'/'N'/'S-n' binding + taskComposer support + watcher guards
- `src/cli.ts`: pass taskComposer handler to list view
- `src/ui/unified-view.ts`: pass taskComposer handler to list view
- `src/ui/components/help-popup.ts`: add 'N' binding to help text
- `src/ui/footer-content.ts`: add [N] hint to footer
- `src/test/tui-task-list-new-task-binding.test.ts`: 5 focused tests

Implements task creation in TUI list view with same UX as board view. Includes 
`taskCreationOpen`/`taskCreationPendingUpdate` guard (identical to board.ts) to 
prevent duplicate-task race condition when watcher updates occur while composer 
is open. Bonus fix: resolves focus-loss bug when applyFilters() destroys/recreates 
the list widget during task creation. Tests: 5 pass locally.
