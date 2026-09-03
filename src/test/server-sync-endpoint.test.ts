import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { BacklogServer } from "../server/index.ts";
import type { GuardedTaskSyncResult } from "../types/index.ts";
import { createUniqueTestDir, initializeTestProject, retry, safeCleanup } from "./test-utils.ts";

let localDir: string;
let remoteDir: string;
let peerDir: string;
let localCore: Core | null = null;
let peerCore: Core | null = null;
let server: BacklogServer | null = null;
let serverPort = 0;
let seededContent: {
	taskId: string;
	documentId: string;
	decisionId: string;
	activeMilestoneId: string;
	archivedMilestoneId: string;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`http://127.0.0.1:${serverPort}${path}`, init);
	if (!response.ok) {
		throw new Error(`${response.status}: ${await response.text()}`);
	}
	return await response.json();
}

async function commitAndPush(directory: string, message: string): Promise<void> {
	await $`git add backlog`.cwd(directory).quiet();
	await $`git commit -m ${message}`.cwd(directory).quiet();
	await $`git push`.cwd(directory).quiet();
}

async function setUpServer(): Promise<void> {
	localDir = createUniqueTestDir("server-sync-local");
	remoteDir = createUniqueTestDir("server-sync-origin");
	peerDir = createUniqueTestDir("server-sync-peer");
	await Promise.all([mkdir(localDir, { recursive: true }), mkdir(remoteDir, { recursive: true })]);

	await $`git init -b main`.cwd(localDir).quiet();
	await $`git init --bare -b main ${remoteDir}`.quiet();

	localCore = new Core(localDir);
	await initializeTestProject(localCore, "Server sync endpoint", false);
	const config = await localCore.filesystem.loadConfig();
	if (!config) throw new Error("Expected seeded configuration");
	config.defaultStatus = "Local status";
	config.statuses = ["Local status"];
	config.guardedTaskSync = true;
	config.guardedTaskPublish = false;
	await localCore.filesystem.saveConfig(config);

	const { task } = await localCore.createTaskFromInput({ title: "Local task", status: "Local status" }, false);
	const document = await localCore.createDocumentFromInput(
		{ title: "Local document", content: "Local document body" },
		false,
	);
	const decision = await localCore.createDecisionWithTitle("Local decision", false);
	const activeMilestone = await localCore.filesystem.createMilestone("Active local");
	const archivedMilestone = await localCore.filesystem.createMilestone("Archived local");
	const archiveResult = await localCore.archiveMilestone(archivedMilestone.id, false);
	if (!archiveResult.success) throw new Error("Expected seeded milestone to archive");

	seededContent = {
		taskId: task.id,
		documentId: document.id,
		decisionId: decision.id,
		activeMilestoneId: activeMilestone.id,
		archivedMilestoneId: archivedMilestone.id,
	};

	await $`git remote add origin ${remoteDir}`.cwd(localDir).quiet();
	await $`git add backlog`.cwd(localDir).quiet();
	await $`git commit -m "test: seed server sync endpoint"`.cwd(localDir).quiet();
	await $`git push -u origin main`.cwd(localDir).quiet();

	server = new BacklogServer(localDir);
	await server.start(0, false);
	const port = server.getPort();
	if (!port) throw new Error("Expected server port");
	serverPort = port;

	// Prime the server's configuration and full-corpus caches before the peer changes the checkout.
	await retry(async () => {
		await Promise.all([
			fetchJson("/api/config"),
			fetchJson("/api/tasks?crossBranch=false"),
			fetchJson("/api/docs"),
			fetchJson("/api/decisions"),
		]);
	});
}

async function pushRemoteContentChanges(): Promise<void> {
	await $`git clone ${remoteDir} ${peerDir}`.quiet();
	peerCore = new Core(peerDir);

	const config = await peerCore.filesystem.loadConfig();
	if (!config) throw new Error("Expected peer configuration");
	config.projectName = "Remote server sync endpoint";
	config.defaultStatus = "Remote status";
	config.statuses = ["Remote status"];
	await peerCore.filesystem.saveConfig(config);

	await peerCore.updateTaskFromInput(seededContent.taskId, { title: "Remote task", status: "Remote status" }, false);

	const document = await peerCore.filesystem.loadDocument(seededContent.documentId);
	await peerCore.createDocument({ ...document, title: "Remote document", rawContent: "Remote document body" }, false);

	const decision = await peerCore.filesystem.loadDecision(seededContent.decisionId);
	if (!decision) throw new Error("Expected seeded decision");
	await peerCore.createDecision({ ...decision, title: "Remote decision", context: "Remote decision context" }, false);

	const activeResult = await peerCore.filesystem.renameMilestone(seededContent.activeMilestoneId, "Active remote");
	if (!activeResult.success) throw new Error("Expected active milestone to update");

	const archiveFiles = await Array.fromAsync(
		new Bun.Glob(`${seededContent.archivedMilestoneId} - *.md`).scan({
			cwd: peerCore.filesystem.archiveMilestonesDir,
		}),
	);
	if (archiveFiles.length !== 1 || !archiveFiles[0]) throw new Error("Expected one archived milestone file");
	const archivedMilestonePath = join(peerCore.filesystem.archiveMilestonesDir, archiveFiles[0]);
	const archivedMilestoneContent = await Bun.file(archivedMilestonePath).text();
	await Bun.write(
		archivedMilestonePath,
		archivedMilestoneContent.replace('title: "Archived local"', 'title: "Archived remote"'),
	);

	await commitAndPush(peerDir, "test: update server sync content");
}

describe("BacklogServer guarded sync endpoint", () => {
	beforeEach(async () => {
		await setUpServer();
	});

	afterEach(async () => {
		if (server) {
			await server.stop();
			server = null;
		}
		peerCore?.disposeContentStore();
		localCore?.disposeContentStore();
		peerCore = null;
		localCore = null;
		await Promise.all([safeCleanup(localDir), safeCleanup(remoteDir), safeCleanup(peerDir)]);
	});

	it("returns the complete expected-refusal result in its 409 body", async () => {
		await $`git clone ${remoteDir} ${peerDir}`.quiet();
		await Bun.write(join(peerDir, "remote-change.txt"), "remote\n");
		await $`git add remote-change.txt`.cwd(peerDir).quiet();
		await $`git commit -m "peer: add remote change"`.cwd(peerDir).quiet();
		await $`git push`.cwd(peerDir).quiet();
		await Bun.write(join(localDir, "uncommitted-source.ts"), "export const pending = true;\n");

		const response = await fetch(`http://127.0.0.1:${serverPort}/api/sync`, { method: "POST" });

		expect(response.status).toBe(409);
		expect((await response.json()) as GuardedTaskSyncResult).toEqual({
			status: "local-changes",
			message: "Local changes prevent syncing. Commit, stash, or discard them before syncing.",
			branch: "main",
			upstream: "origin/main",
		});
	});

	it("refreshes the full server corpus before the first post-fast-forward reads", async () => {
		await pushRemoteContentChanges();

		const syncResponse = await fetch(`http://127.0.0.1:${serverPort}/api/sync`, { method: "POST" });
		expect(syncResponse.status).toBe(200);
		expect((await syncResponse.json()) as GuardedTaskSyncResult).toEqual({
			status: "fast-forwarded",
			message: "Fast-forwarded main from origin/main.",
			branch: "main",
			upstream: "origin/main",
		});

		const [config, tasks, documents, decisions, milestones, archivedMilestones] = await Promise.all([
			fetchJson<{ projectName: string; statuses: string[] }>("/api/config"),
			fetchJson<Array<{ id: string; title: string }>>("/api/tasks?crossBranch=false"),
			fetchJson<Array<{ id: string; title: string }>>("/api/docs"),
			fetchJson<Array<{ id: string; title: string; context: string }>>("/api/decisions"),
			fetchJson<Array<{ id: string; title: string }>>("/api/milestones"),
			fetchJson<Array<{ id: string; title: string }>>("/api/milestones/archived"),
		]);

		expect(config).toMatchObject({ projectName: "Remote server sync endpoint", statuses: ["Remote status"] });
		expect(tasks).toContainEqual(expect.objectContaining({ id: seededContent.taskId, title: "Remote task" }));
		expect(documents).toContainEqual(
			expect.objectContaining({ id: seededContent.documentId, title: "Remote document" }),
		);
		expect(decisions).toContainEqual(
			expect.objectContaining({
				id: seededContent.decisionId,
				title: "Remote decision",
				context: "Remote decision context",
			}),
		);
		expect(milestones).toContainEqual(
			expect.objectContaining({ id: seededContent.activeMilestoneId, title: "Active remote" }),
		);
		expect(archivedMilestones).toContainEqual(
			expect.objectContaining({ id: seededContent.archivedMilestoneId, title: "Archived remote" }),
		);
	});
});
