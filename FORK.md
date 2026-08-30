# OpenDevEd fork: what's added, and how it's organized

This file exists so a future rebase, a new contributor, or future-us can answer
"what did we change, and why" without re-reading 67 commits. It documents the
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

Four independent layers, each buildable/testable on its own:

1. **Dependency patch** (`patches/neo-neo-bblessed@1.0.9.patch`, via bun
   `patchedDependencies`) — fixes emoji width measurement in the vendored
   blessed fork. Applied automatically by `bun i`; nothing to build.
2. **Core + CLI plumbing** (`src/types/index.ts`, `src/file-system/operations.ts`,
   `src/utils/config-watcher.ts`, `src/cli.ts`) — three new config keys
   (`taskListPaneWidth`, `documentBaseUrl`) and one dependency-driven fix
   (`clipboard.ts` OSC 52 fallback). Built as part of the normal
   `bun run build`.
3. **TUI** (`src/ui/task-viewer-with-search.ts`, `src/ui/board.ts`) — pane
   width, popup refresh-after-edit. Same build as upstream.
4. **Web UI** (`src/web/**`) — the bulk of the fork: maximize mode, checkbox
   rendering, document-link rewriting, comment UX, settings fields. Same
   `bun run build`; no separate bundle.

There is no separate fork build step — `bun run build` produces `dist/backlog`
with all of the above baked in, same as it would for a stock checkout.

## What's added, by stage

### 1. Dependency patch
- Emoji measured as 2 terminal cells (was 1) — fixes TUI board/list alignment.
  [BACK-643](backlog/tasks) · upstream: issue #949, PR #950 (open).

### 2. Core + CLI
| Addition | Config key | Task |
|---|---|---|
| TUI list/detail pane width | `taskListPaneWidth` | BACK-641, BACK-661 (web Settings) |
| Doc-link rewrite base URL | `documentBaseUrl` | BACK-659, BACK-663 (web Settings) |
| OSC 52 clipboard fallback (yank over SSH) | — | BACK-642 · upstream: issue #947 (no PR yet) |

### 3. TUI
| Addition | Task |
|---|---|
| Board task popup refreshes after external-editor edit | BACK-644 · upstream: issue #951, PR #952 (open) |

### 4. Web UI
| Addition | Task |
|---|---|
| All Tasks maximize mode (persisted, real fullscreen, filters+search usable inside, survives focus loss) | BACK-645–647, 651–653, 658 |
| Updated-date column + persisted sort | BACK-648, 650 |
| Copy task ID button | BACK-649 |
| Checkbox spans (`[]{.checkbox}` / `[x]{.checkbox}`) render as tickable boxes, fresh-fetch-before-write to avoid clobbering concurrent edits | BACK-654, 660 |
| Comment from preview mode (inline + header button) | BACK-656, 657 |
| Modal capped by dynamic viewport height (mobile browser bar) | BACK-655 |
| Documentation entries + in-task repo-relative links open against `documentBaseUrl` | BACK-659, 662 |

### 5. Deployment (separate repo, not part of this build)
`~/development/services/services/backlog.md-service` — systemd units serving
the tracker project and a cookie-auth proxy for LAN/meshnet access. Entirely
outside this repo; documented in its own README.

## Fork-only modules (self-contained, safe to leave alone in a rebase)

These carry fork logic and touch nothing upstream owns internally:

- `src/web/utils/checkbox-spans.ts`
- `src/web/utils/document-url.ts`
- `src/web/contexts/DocumentBaseUrlContext.tsx`
- `patches/neo-neo-bblessed@1.0.9.patch`

## Touch-points in shared files (search `[FORK]`)

Everywhere else, the fork had to edit a file upstream also owns. Each such
file carries a one-line banner near its top tagged `[FORK]`, naming the exact
command that shows what changed there — a live `git diff` rather than a
hand-placed marker, so it can't drift out of sync with the code:

```
$ grep -rln "\[FORK\]" src/
src/cli.ts
src/types/index.ts
src/file-system/operations.ts
src/utils/config-watcher.ts
src/utils/clipboard.ts
src/ui/board.ts
src/ui/task-viewer-with-search.ts
src/web/App.tsx
src/web/components/MermaidMarkdown.tsx
src/web/components/Settings.tsx
src/web/components/TaskDetailsModal.tsx
src/web/components/TaskList.tsx
```

Run the file's own `git diff upstream/main..main -- <file>` (or `git log
--oneline upstream/main..main -- <file>` for the commits) to see exactly what
the fork added there.

**Convention going forward:** any new fork-specific change to a shared file
that doesn't already carry a `[FORK]` banner gets one added. New fork-specific
*behavior* goes in its own file under `src/web/utils/` or `src/utils/` where
possible, with the shared file left with only the one wiring line needed to
call it.

## Relationship to upstream

- `main` — this fork's line of development. All BACK-6xx work lands here via
  `--no-ff` merges of `tasks/back-NNN-*` branches.
- `fix/tui-emoji-width`, `fix/board-popup-refresh` — clean single-purpose
  branches based on `upstream/main`, each backing one open PR (#950, #952).
  They exist so the PR diff doesn't carry the rest of this fork.
- Everything the fork carries that is a general bug fix (not an opinionated
  feature) should eventually go upstream the same way. `tmp/TODO.md`
  (untracked) tracks upstream PRs worth adopting the other direction.
- No fixed sync cadence yet — `upstream/main` has not moved since the fork
  point, so there's nothing to rebase against. Once it does, re-run
  `git log --oneline main..upstream/main` and diff-review before merging

## Upstream PR candidates (clean branches, not in this fork)

Three focused, independent branches based on `upstream/main` (commit 9a42e89),
created for contribution back to MrLesk/Backlog.md. Each branch lives in its own
worktree under `/home/bjohas/development/git/Backlog.md-worktrees/` and contains
only source and test changes required for its PR, with no fork-specific metadata,
task files, or config changes.

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
**Status:** Branch pushed; PR held pending user reproduction  
**Target:** upstream issue #946  
**Changes:**
- `src/types/index.ts`: `taskListPaneWidth` config key
- `src/cli.ts`: get/set/list CLI commands with 10–90% validation
- `src/file-system/operations.ts`: parseConfig/serializeConfig round-trip
- `src/utils/config-watcher.ts`: external-edit guard
- `src/ui/task-viewer-with-search.ts`: wired to list/detail split
- `src/test/task-list-pane-width.test.ts`: new; defaults, clamping, fallback
- `src/test/config-commands.test.ts`: new test cases for CLI validation

Replaces hardcoded 40/60 split with user-configurable percentage (default 40).
Agent verified via multiple test scenarios (resize, tab-switch, draft-view,
out-of-range clamping). Tests: 4 pass locally. User reported feature doesn't
work; reproduction steps needed to identify discrepancy or proceed to PR.

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
