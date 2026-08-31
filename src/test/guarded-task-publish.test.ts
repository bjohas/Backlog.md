import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
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
	await core.filesystem.saveConfig(config);
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

	it("refuses a task mutation when the checkout has local modifications", async () => {
		await Bun.write(join(localDir, "uncommitted-source.ts"), "export const pending = true;\n");

		await expect(core.createTaskFromInput({ title: "Must not be written" })).rejects.toThrow(
			"requires a clean worktree and index",
		);
		expect(await core.filesystem.listTasks()).toEqual([]);
	});

	it("refuses to publish unrelated local commits", async () => {
		await Bun.write(join(localDir, "unpublished-source.ts"), "export const unpublished = true;\n");
		await $`git add unpublished-source.ts`.cwd(localDir).quiet();
		await $`git commit -m "local: keep this unpublished"`.cwd(localDir).quiet();

		await expect(core.createTaskFromInput({ title: "Must not publish source" })).rejects.toThrow(
			"requires main to match origin/main",
		);
		expect(await core.filesystem.listTasks()).toEqual([]);
	});
});
