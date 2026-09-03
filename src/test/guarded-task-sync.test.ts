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
	localDir = createUniqueTestDir("guarded-task-sync-local");
	remoteDir = createUniqueTestDir("guarded-task-sync-origin");
	peerDir = createUniqueTestDir("guarded-task-sync-peer");
	await Promise.all([mkdir(localDir, { recursive: true }), mkdir(remoteDir, { recursive: true })]);

	await $`git init -b main`.cwd(localDir).quiet();
	await $`git init --bare -b main ${remoteDir}`.quiet();
	core = new Core(localDir);
	await initializeTestProject(core, "Guarded sync", true);
	await $`git remote add origin ${remoteDir}`.cwd(localDir).quiet();
	await $`git push -u origin main`.cwd(localDir).quiet();

	const config = await core.filesystem.loadConfig();
	if (!config) throw new Error("Expected Backlog config");
	config.autoCommit = false;
	config.guardedTaskSync = true;
	config.logGitActions = true;
	await core.filesystem.saveConfig(config);
	core.gitOps.setConfig(config);
	await $`git add backlog/config.yml`.cwd(localDir).quiet();
	await $`git commit -m "test: enable guarded task sync"`.cwd(localDir).quiet();
	await $`git push`.cwd(localDir).quiet();
}

async function clonePeer(): Promise<void> {
	await $`git clone ${remoteDir} ${peerDir}`.quiet();
}

async function commitAndPushPeer(filename: string, contents: string, message: string): Promise<void> {
	await Bun.write(join(peerDir, filename), contents);
	await $`git add ${filename}`.cwd(peerDir).quiet();
	await $`git commit -m ${message}`.cwd(peerDir).quiet();
	await $`git push`.cwd(peerDir).quiet();
}

async function commitLocal(filename: string, contents: string, message: string): Promise<void> {
	await Bun.write(join(localDir, filename), contents);
	await $`git add ${filename}`.cwd(localDir).quiet();
	await $`git commit -m ${message}`.cwd(localDir).quiet();
}

function createGate(): { reached: Promise<void>; release: () => void; wait: () => Promise<void> } {
	let resolveReached: () => void = () => {};
	let resolveRelease: () => void = () => {};
	const reached = new Promise<void>((resolve) => {
		resolveReached = resolve;
	});
	const released = new Promise<void>((resolve) => {
		resolveRelease = resolve;
	});
	return {
		reached,
		release: resolveRelease,
		async wait(): Promise<void> {
			resolveReached();
			await released;
		},
	};
}

describe("guarded task synchronization", () => {
	beforeEach(async () => {
		await initializeGuardedProject();
	});

	afterEach(async () => {
		core?.disposeContentStore();
		await Promise.all([safeCleanup(localDir), safeCleanup(remoteDir), safeCleanup(peerDir)]);
	});

	it("fast-forwards a clean checkout to remote work", async () => {
		await clonePeer();
		await commitAndPushPeer("remote-change.txt", "from the other machine\n", "peer: add remote change");

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("fast-forwarded");
		expect(await Bun.file(join(localDir, "remote-change.txt")).text()).toBe("from the other machine\n");
		expect(await core.gitOps.isClean()).toBe(true);
	});

	it("reports an already current checkout without changing it", async () => {
		const headBefore = (await $`git rev-parse HEAD`.cwd(localDir).text()).trim();

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("up-to-date");
		expect((await $`git rev-parse HEAD`.cwd(localDir).text()).trim()).toBe(headBefore);
	});

	it("refuses to advance a dirty checkout", async () => {
		await clonePeer();
		await commitAndPushPeer("remote-change.txt", "from the other machine\n", "peer: add remote change");
		await Bun.write(join(localDir, "uncommitted-source.ts"), "export const pending = true;\n");
		const headBefore = (await $`git rev-parse HEAD`.cwd(localDir).text()).trim();

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("local-changes");
		expect((await $`git rev-parse HEAD`.cwd(localDir).text()).trim()).toBe(headBefore);
		expect(await Bun.file(join(localDir, "remote-change.txt")).exists()).toBe(false);
	});

	it("refuses a checkout with unpublished local commits", async () => {
		await commitLocal("local-change.txt", "local only\n", "local: add unpublished change");

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("ahead");
		expect(await Bun.file(join(localDir, "local-change.txt")).exists()).toBe(true);
	});

	it("refuses branches which have diverged", async () => {
		await clonePeer();
		await commitAndPushPeer("peer-change.txt", "peer only\n", "peer: diverging change");
		await commitLocal("local-change.txt", "local only\n", "local: diverging change");

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("diverged");
		expect(result.message).toContain("reconcile");
	});

	it("classifies rewritten remote history as a manual reconciliation", async () => {
		await clonePeer();
		await $`git switch --orphan rewritten-main`.cwd(peerDir).quiet();
		await $`git rm -rf --ignore-unmatch .`.cwd(peerDir).quiet();
		await Bun.write(join(peerDir, "replacement.txt"), "new root\n");
		await $`git add replacement.txt`.cwd(peerDir).quiet();
		await $`git commit -m "peer: replace history"`.cwd(peerDir).quiet();
		await $`git push --force origin HEAD:main`.cwd(peerDir).quiet();

		const result = await core.syncCurrentBranch();

		expect(result.status).toBe("diverged");
		expect(result.message).toContain("no common history");
	});

	it("enables interactive synchronization when guarded publishing alone is enabled", async () => {
		const config = await core.filesystem.loadConfig();
		if (!config) throw new Error("Expected Backlog config");
		config.guardedTaskSync = false;
		config.guardedTaskPublish = true;
		await core.filesystem.saveConfig(config);
		core.gitOps.setConfig(config);
		await $`git add backlog/config.yml`.cwd(localDir).quiet();
		await $`git commit -m "test: enable guarded task publish only"`.cwd(localDir).quiet();
		await $`git push`.cwd(localDir).quiet();
		await clonePeer();
		await commitAndPushPeer("remote-change.txt", "from the other machine\n", "peer: add remote change");

		const result = await core.syncCurrentBranch();

		expect(config.guardedTaskSync).toBe(false);
		expect(result.status).toBe("fast-forwarded");
		expect(await Bun.file(join(localDir, "remote-change.txt")).exists()).toBe(true);
	});

	it("holds task mutations behind the repository synchronization lock", async () => {
		const gate = createGate();
		const lock = core.filesystem.withGuardedTaskSyncLock(async () => {
			await gate.wait();
		});
		await gate.reached;

		const mutation = core.createTaskFromInput({ title: "Wait for the repository lock" });
		await Promise.resolve();
		expect((await core.filesystem.listTasks()).map((task) => task.title)).not.toContain("Wait for the repository lock");

		gate.release();
		await lock;
		const { task } = await mutation;
		expect((await core.filesystem.loadTask(task.id))?.title).toBe("Wait for the repository lock");
	});
});
