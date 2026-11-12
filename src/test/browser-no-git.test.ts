// `backlog browser --no-git` keeps Git out of a server process without changing the
// project's config.yml.
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { BacklogServer } from "../server/index.ts";
import { createUniqueTestDir, initializeTestProject, safeCleanup } from "./test-utils.ts";

let projectDir: string;
let taskId: string;
let server: BacklogServer | null = null;

async function startServer(gitDisabled: boolean): Promise<string> {
	server = new BacklogServer(projectDir, { gitDisabled });
	await server.start(0, false);
	return `http://127.0.0.1:${server.getPort()}`;
}

async function commitCount(): Promise<number> {
	return Number((await $`git rev-list --count HEAD`.cwd(projectDir).text()).trim());
}

async function readConfigFile(): Promise<string> {
	return await Bun.file(join(projectDir, "backlog", "config.yml")).text();
}

describe("browser --no-git", () => {
	beforeEach(async () => {
		projectDir = createUniqueTestDir("browser-no-git");
		await mkdir(projectDir, { recursive: true });
		await $`git init -b main`.cwd(projectDir).quiet();
		await $`git config user.email test@example.com`.cwd(projectDir).quiet();
		await $`git config user.name Test`.cwd(projectDir).quiet();

		const core = new Core(projectDir);
		await initializeTestProject(core, "No Git server", false);
		const config = await core.filesystem.loadConfig();
		if (!config) throw new Error("Expected seeded configuration");
		// Everything that would otherwise make the server commit or publish.
		config.autoCommit = true;
		config.guardedTaskPublish = true;
		config.remoteOperations = true;
		await core.filesystem.saveConfig(config);
		taskId = (await core.createTaskFromInput({ title: "Seeded" }, false)).task.id;
		await $`git add -A`.cwd(projectDir).quiet();
		await $`git commit -m seed`.cwd(projectDir).quiet();
	});

	afterEach(async () => {
		await server?.stop();
		server = null;
		await safeCleanup(projectDir);
	});

	it("writes task changes without committing, even with guarded publish and auto-commit on", async () => {
		const base = await startServer(true);
		const before = await commitCount();

		const response = await fetch(`${base}/api/tasks/${taskId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Edited on the server" }),
		});

		expect(response.status).toBe(200);
		expect(await commitCount()).toBe(before);
		const status = await $`git status --porcelain`.cwd(projectDir).text();
		expect(status).toContain("backlog/tasks/");
	});

	it("writes documents and decisions without committing", async () => {
		const base = await startServer(true);
		const before = await commitCount();

		const doc = await fetch(`${base}/api/docs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Server doc", content: "Body" }),
		});
		const decision = await fetch(`${base}/api/decisions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Server decision" }),
		});

		expect(doc.ok).toBe(true);
		expect(decision.ok).toBe(true);
		expect(await commitCount()).toBe(before);
	});

	it("reports sync as disabled instead of running Git", async () => {
		const base = await startServer(true);

		const result = (await (await fetch(`${base}/api/sync`, { method: "POST" })).json()) as { status: string };

		expect(result.status).toBe("disabled");
	});

	it("keeps config.yml's Git settings when web Settings are saved", async () => {
		const base = await startServer(true);
		const before = await readConfigFile();
		const shown = (await (await fetch(`${base}/api/config`)).json()) as Record<string, unknown>;
		expect(shown.filesystemOnly).toBe(true);

		const response = await fetch(`${base}/api/config`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...shown, projectName: "Renamed" }),
		});

		expect(response.status).toBe(200);
		const after = await readConfigFile();
		expect(after).toContain("Renamed");
		expect(after).not.toContain("filesystem_only: true");
		for (const line of ["auto_commit: true", "guarded_task_publish: true", "remote_operations: true"]) {
			expect(before).toContain(line);
			expect(after).toContain(line);
		}
	});

	it("commits as configured without the switch", async () => {
		const base = await startServer(false);
		await $`git config --unset-all remote.origin.url`.cwd(projectDir).quiet().nothrow();
		// Guarded publish needs a remote; auto-commit alone shows the switch is what stops the commit.
		const core = new Core(projectDir);
		const config = await core.filesystem.loadConfig();
		if (!config) throw new Error("Expected configuration");
		config.guardedTaskPublish = false;
		await core.filesystem.saveConfig(config);
		await $`git commit -am "turn off guarded publish"`.cwd(projectDir).quiet();
		const before = await commitCount();

		const response = await fetch(`${base}/api/tasks/${taskId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Edited with Git" }),
		});

		expect(response.status).toBe(200);
		expect(await commitCount()).toBe(before + 1);
	});
});
