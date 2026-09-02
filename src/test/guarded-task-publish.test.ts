import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { createUniqueTestDir, initializeTestProject, safeCleanup } from "./test-utils.ts";

let localDir: string;
let remoteDir: string;
let peerDir: string;
let core: Core;

async function initializeGuardedProject(): Promise<void> {
	localDir = createUniqueTestDir("guarded-task-publish-local");
	remoteDir = createUniqueTestDir("guarded-task-publish-origin");
	peerDir = createUniqueTestDir("guarded-task-publish-peer");
	await Promise.all([mkdir(localDir, { recursive: true }), mkdir(remoteDir, { recursive: true })]);

	await $`git init -b main`.cwd(localDir).quiet();
	await $`git init --bare -b main ${remoteDir}`.quiet();
	core = new Core(localDir);
	await initializeTestProject(core, "Guarded publish", true);
	await $`git remote add origin ${remoteDir}`.cwd(localDir).quiet();
	await $`git push -u origin main`.cwd(localDir).quiet();

	const config = await core.filesystem.loadConfig();
	if (!config) throw new Error("Expected Backlog config");
	config.autoCommit = false;
	config.guardedTaskPublish = true;
	config.logGitActions = true;
	await core.filesystem.saveConfig(config);
	core.gitOps.setConfig(config);
	await $`git add backlog/config.yml`.cwd(localDir).quiet();
	await $`git commit -m "test: enable guarded task publishing"`.cwd(localDir).quiet();
	await $`git push`.cwd(localDir).quiet();
}

describe("guarded task publishing", () => {
	beforeEach(async () => {
		await initializeGuardedProject();
	});

	afterEach(async () => {
		core?.disposeContentStore();
		await Promise.all([safeCleanup(localDir), safeCleanup(remoteDir), safeCleanup(peerDir)]);
	});

	it("fast-forwards remote work, commits the task, and pushes it", async () => {
		await $`git clone ${remoteDir} ${peerDir}`.quiet();
		await Bun.write(join(peerDir, "remote-change.txt"), "from the other machine\n");
		await $`git add remote-change.txt`.cwd(peerDir).quiet();
		await $`git commit -m "peer: add remote change"`.cwd(peerDir).quiet();
		await $`git push`.cwd(peerDir).quiet();

		const { task } = await core.createTaskFromInput({ title: "Publish from a synchronized checkout" });

		expect(await Bun.file(join(localDir, "remote-change.txt")).text()).toBe("from the other machine\n");
		expect(await core.gitOps.isClean()).toBe(true);

		await core.updateTaskFromInput(task.id, { status: "In Progress" });

		await $`git pull --ff-only`.cwd(peerDir).quiet();
		const peer = new Core(peerDir);
		expect((await peer.filesystem.loadTask(task.id))?.status).toBe("In Progress");
		peer.disposeContentStore();
	});

	it("rejects a raced push while retaining the local task commit", async () => {
		await $`git clone ${remoteDir} ${peerDir}`.quiet();
		const publish = core.gitOps.publishGuardedTaskChanges.bind(core.gitOps);
		core.gitOps.publishGuardedTaskChanges = async () => {
			await Bun.write(join(peerDir, "raced-remote-change.txt"), "raced\n");
			await $`git add raced-remote-change.txt`.cwd(peerDir).quiet();
			await $`git commit -m "peer: race publication"`.cwd(peerDir).quiet();
			await $`git push`.cwd(peerDir).quiet();
			await publish();
		};

		await expect(core.createTaskFromInput({ title: "Retain this task locally" })).rejects.toThrow(
			"could not push main to origin/main",
		);

		expect((await core.filesystem.listTasks()).map((task) => task.title)).toEqual(["Retain this task locally"]);
		const localOnlyCommits = await $`git rev-list --count origin/main..HEAD`.cwd(localDir).text();
		expect(localOnlyCommits.trim()).toBe("1");
		const actions = (await Bun.file(join(localDir, ".git", "backlog-git-actions.jsonl")).text())
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));
		expect(actions.some((action) => action.args[0] === "push" && action.exitCode !== 0)).toBe(true);
	});

	it("commits locally without publishing when the checkout has local modifications", async () => {
		await Bun.write(join(localDir, "uncommitted-source.ts"), "export const pending = true;\n");
		const remoteHeadBefore = (await $`git rev-parse main`.cwd(remoteDir).text()).trim();

		await core.createTaskFromInput({ title: "Saved locally" });

		expect((await core.filesystem.listTasks()).map((task) => task.title)).toEqual(["Saved locally"]);
		// Committed, so the write cannot be lost, but deliberately not shared.
		expect((await $`git status --porcelain backlog`.cwd(localDir).text()).trim()).toBe("");
		expect((await $`git rev-parse main`.cwd(remoteDir).text()).trim()).toBe(remoteHeadBefore);
		expect(core.consumeTaskPublishSkipReason()).toContain("requires a clean worktree and index");
	});

	it("commits locally without publishing when unrelated local commits are unpublished", async () => {
		await Bun.write(join(localDir, "unpublished-source.ts"), "export const unpublished = true;\n");
		await $`git add unpublished-source.ts`.cwd(localDir).quiet();
		await $`git commit -m "local: keep this unpublished"`.cwd(localDir).quiet();
		const remoteHeadBefore = (await $`git rev-parse main`.cwd(remoteDir).text()).trim();

		await core.createTaskFromInput({ title: "Also saved locally" });

		expect((await core.filesystem.listTasks()).map((task) => task.title)).toEqual(["Also saved locally"]);
		expect((await $`git status --porcelain backlog`.cwd(localDir).text()).trim()).toBe("");
		expect((await $`git rev-parse main`.cwd(remoteDir).text()).trim()).toBe(remoteHeadBefore);
		expect(core.consumeTaskPublishSkipReason()).toContain("requires main to match origin/main");
	});

	it("publishes commits deferred by an earlier blocked mutation once the worktree is clean", async () => {
		// Block the first mutation, so it lands as a local-only task commit.
		const dirtyFile = join(localDir, "uncommitted-source.ts");
		await Bun.write(dirtyFile, "export const pending = true;\n");
		await core.createTaskFromInput({ title: "Deferred by dirt" });
		expect(core.consumeTaskPublishSkipReason()).toContain("requires a clean worktree and index");
		const remoteHeadAfterDefer = (await $`git rev-parse main`.cwd(remoteDir).text()).trim();

		// Clean up; the next mutation should carry the deferred commit with it.
		await rm(dirtyFile);
		await core.createTaskFromInput({ title: "Drains the backlog of commits" });

		expect(core.consumeTaskPublishSkipReason()).toBeNull();
		expect((await $`git rev-parse main`.cwd(remoteDir).text()).trim()).not.toBe(remoteHeadAfterDefer);
		// The deferred commit drained with it: nothing is left unpublished.
		expect((await $`git rev-list --count origin/main..HEAD`.cwd(localDir).text()).trim()).toBe("0");
		expect((await core.filesystem.listTasks()).map((task) => task.title).sort()).toEqual([
			"Deferred by dirt",
			"Drains the backlog of commits",
		]);
	});

	it("still refuses when the branch has diverged from its upstream", async () => {
		await $`git clone ${remoteDir} ${peerDir}`.quiet();
		await Bun.write(join(peerDir, "peer-change.txt"), "from the other machine\n");
		await $`git add peer-change.txt`.cwd(peerDir).quiet();
		await $`git commit -m "peer: diverging work"`.cwd(peerDir).quiet();
		await $`git push`.cwd(peerDir).quiet();

		await Bun.write(join(localDir, "local-change.txt"), "local only\n");
		await $`git add local-change.txt`.cwd(localDir).quiet();
		await $`git commit -m "local: diverging work"`.cwd(localDir).quiet();

		await core.createTaskFromInput({ title: "Diverged" });

		expect(core.consumeTaskPublishSkipReason()).toContain("cannot fast-forward");
	});

	it("reports the skip reason only once", async () => {
		await Bun.write(join(localDir, "uncommitted-source.ts"), "export const pending = true;\n");

		await core.createTaskFromInput({ title: "Read the reason once" });

		expect(core.consumeTaskPublishSkipReason()).not.toBeNull();
		expect(core.consumeTaskPublishSkipReason()).toBeNull();
	});
});
