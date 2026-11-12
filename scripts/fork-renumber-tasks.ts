#!/usr/bin/env bun
/**
 * [FORK] One-off repair of task IDs that collide with upstream (BACK-801).
 *
 * The fork and upstream share one `backlog/` folder and one `BACK-` counter. The 2026-09
 * `backlog doctor --fix` kept fork tasks on numbers upstream also uses and moved upstream's
 * own records to BACK-686+; the 2026-11 merge then brought upstream's real BACK-686+ tasks.
 *
 * Scheme (FORK.md, "Task IDs"): upstream records keep exactly the path and ID they have in
 * `upstream/main`; fork-only tasks live at BACK-35001 and up.
 *
 * For every task file in the working tree whose path does not exist in `upstream/main`:
 * - same file-name slug as an upstream record missing from the tree: it is that upstream
 *   record under a fork number, and is moved back to upstream's path and ID;
 * - otherwise it is a fork task and moves to the next ID from BACK-35001, in old-ID order.
 * A restored upstream record must then equal its `upstream/main` version byte for byte.
 * References in fork tasks and the docs listed in FORK_DOCS are rewritten from the fork-main
 * numbering to the new IDs. Upstream records, written in upstream numbering, are not rewritten.
 *
 * Usage: bun scripts/fork-renumber-tasks.ts          (dry run, prints the plan)
 *        bun scripts/fork-renumber-tasks.ts --write  (applies it and stages the changes)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const UPSTREAM_REF = "upstream/main";
const FORK_RANGE_START = 35001;
const TASK_DIRS = ["backlog/tasks/", "backlog/completed/", "backlog/archive/tasks/"];
const FORK_DOCS = ["FORK.md", "backlog/docs/doc-5", "backlog/docs/reference/doc-4"];
// BACK-801 is this repair's own task: its text names the colliding numbers themselves.
const NO_REWRITE_IDS = new Set([801]);
const write = process.argv.includes("--write");

function git(...args: string[]): string {
	const result = Bun.spawnSync(["git", "-c", "core.quotepath=false", ...args], { stdout: "pipe", stderr: "pipe" });
	if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr.toString()}`);
	return result.stdout.toString();
}

const FILE_PATTERN = /^back-(\d+) - (.+)$/;
interface TaskFile {
	path: string;
	id: number;
	slug: string;
}
function parseTaskPath(path: string): TaskFile | null {
	if (!TASK_DIRS.some((dir) => path.startsWith(dir))) return null;
	const match = FILE_PATTERN.exec(basename(path));
	if (!match?.[1] || !match[2]) return null;
	return { path, id: Number(match[1]), slug: match[2] };
}

const upstreamFiles = git("ls-tree", "-r", "-z", "--name-only", UPSTREAM_REF, "backlog/")
	.split("\0")
	.map(parseTaskPath)
	.filter((file): file is TaskFile => file !== null);
const workingFiles = git("ls-files", "-z", "backlog/")
	.split("\0")
	.map(parseTaskPath)
	.filter((file): file is TaskFile => file !== null);
const upstreamPaths = new Set(upstreamFiles.map((file) => file.path));
const workingPaths = new Set(workingFiles.map((file) => file.path));
const missingUpstream = upstreamFiles.filter((file) => !workingPaths.has(file.path));
const forkOnly = workingFiles.filter((file) => !upstreamPaths.has(file.path)).sort((a, b) => a.id - b.id);

interface Move {
	from: TaskFile;
	toPath: string;
	toId: number;
	kind: "upstream record back to its ID" | "fork task to fork range";
}
const moves: Move[] = [];
let nextForkId = FORK_RANGE_START;
for (const file of forkOnly) {
	const upstream = missingUpstream.filter((candidate) => candidate.slug === file.slug);
	if (upstream.length > 1) throw new Error(`${file.path}: several upstream records share its slug`);
	const target = upstream[0];
	if (target) {
		moves.push({ from: file, toPath: target.path, toId: target.id, kind: "upstream record back to its ID" });
	} else {
		const toPath = join(dirname(file.path), `back-${nextForkId} - ${file.slug}`);
		moves.push({ from: file, toPath, toId: nextForkId, kind: "fork task to fork range" });
		nextForkId++;
	}
}
const restored = new Set(moves.map((move) => move.toPath));
const stillMissing = missingUpstream.filter((file) => !restored.has(file.path));

// Fork-only text was written in fork-main numbering, where each moved file had its old ID.
const idMap = new Map(moves.map((move) => [move.from.id, move.toId]));
// A reference is `BACK-N`, optionally followed by a short list of bare numbers ("BACK-645, 691,
// 647"). A range ("BACK-686…725", "BACK-686..725", "BACK-686+") names numbers, not tasks, and
// subtask IDs ("BACK-686.1") are left alone.
const REFERENCE = /\bBACK-(\d+)((?:, \d+\b)*)(?![\d…+]|\.\.|\.\d)/g;
function rewriteReferences(text: string): string {
	return text.replace(REFERENCE, (_token, digits: string, list: string) => {
		const mapNumber = (number: string) => String(idMap.get(Number(number)) ?? number);
		return `BACK-${mapNumber(digits)}${list.replace(/\d+/g, mapNumber)}`;
	});
}
function setFrontmatterId(text: string, id: number): string {
	const updated = text.replace(/^id: BACK-\d+$/m, `id: BACK-${id}`);
	if (updated === text && !text.includes(`id: BACK-${id}\n`)) throw new Error("frontmatter id line not found");
	return updated;
}

interface ReferenceChange {
	path: string;
	line: number;
	before: string;
	after: string;
}
const referenceChanges: ReferenceChange[] = [];
const newContent = new Map<string, string>();
function plan(sourcePath: string, targetPath: string, transform: (text: string) => string): void {
	const original = readFileSync(sourcePath, "utf8");
	const updated = transform(original);
	const before = original.split("\n");
	const after = updated.split("\n");
	for (let index = 0; index < before.length; index++) {
		if (before[index] !== after[index] && !before[index]?.startsWith("id: ")) {
			referenceChanges.push({
				path: targetPath,
				line: index + 1,
				before: before[index] ?? "",
				after: after[index] ?? "",
			});
		}
	}
	newContent.set(targetPath, updated);
}
for (const move of moves) {
	if (move.kind === "upstream record back to its ID" || NO_REWRITE_IDS.has(move.from.id)) {
		plan(move.from.path, move.toPath, (text) => setFrontmatterId(text, move.toId));
		if (
			move.kind === "upstream record back to its ID" &&
			git("show", `${UPSTREAM_REF}:${move.toPath}`) !== newContent.get(move.toPath)
		) {
			throw new Error(`${move.from.path}: differs from ${UPSTREAM_REF}:${move.toPath} beyond its ID`);
		}
	} else {
		plan(move.from.path, move.toPath, (text) => rewriteReferences(setFrontmatterId(text, move.toId)));
	}
}
const docPaths = git("ls-files", "-z", ...FORK_DOCS)
	.split("\0")
	.filter(Boolean);
for (const path of docPaths) plan(path, path, rewriteReferences);

function clip(text: string): string {
	const trimmed = text.trim();
	return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
}
for (const kind of ["upstream record back to its ID", "fork task to fork range"] as const) {
	const selected = moves.filter((move) => move.kind === kind);
	console.log(`\n${selected.length} × ${kind}:`);
	for (const move of selected) console.log(`  BACK-${move.from.id} -> BACK-${move.toId}  ${move.from.slug}`);
}
console.log(`\n${referenceChanges.length} reference lines rewritten:`);
for (const change of referenceChanges) {
	console.log(`  ${change.path}:${change.line}\n    - ${clip(change.before)}\n    + ${clip(change.after)}`);
}
if (stillMissing.length > 0) {
	console.log(`\n${stillMissing.length} upstream task files absent from the tree and not restored:`);
	for (const file of stillMissing) console.log(`  ${file.path}`);
}

if (!write) {
	console.log("\nDry run: nothing changed. Re-run with --write to apply.");
} else {
	for (const move of moves) git("mv", move.from.path, move.toPath);
	for (const [path, text] of newContent) writeFileSync(path, text);
	git("add", "--", ...newContent.keys());
	console.log(`\nApplied: ${moves.length} files moved, ${newContent.size} files written and staged.`);
}
