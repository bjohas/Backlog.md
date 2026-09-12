import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { type RemoteMcpServerHandle, startRemoteMcpServer } from "../mcp/http-server.ts";
import { McpServer } from "../mcp/server.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, safeCleanup } from "./test-utils.ts";

const TOKEN = "test-bearer-token";
let testDir: string;
let remoteServer: RemoteMcpServerHandle | undefined;

async function createProject(): Promise<void> {
	testDir = createUniqueTestDir("mcp-http");
	const bootstrap = new McpServer(testDir, "Test instructions");
	await bootstrap.filesystem.ensureBacklogStructure();
	await initializeFilesystemTestProject(bootstrap, "MCP HTTP Test Project");
	await bootstrap.stop();
}

async function initializeSession(url: string): Promise<string> {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			authorization: `Bearer ${TOKEN}`,
			"content-type": "application/json",
			accept: "application/json, text/event-stream",
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method: "initialize",
			params: {
				protocolVersion: "2025-06-18",
				capabilities: {},
				clientInfo: { name: "mcp-http-test", version: "1.0.0" },
			},
		}),
	});

	expect(response.status).toBe(200);
	const sessionId = response.headers.get("mcp-session-id");
	expect(sessionId).toBeTruthy();
	return sessionId as string;
}

async function listTools(url: string, sessionId: string): Promise<string> {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			authorization: `Bearer ${TOKEN}`,
			"content-type": "application/json",
			accept: "application/json, text/event-stream",
			"mcp-session-id": sessionId,
		},
		body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
	});

	expect(response.status).toBe(200);
	return response.text();
}

describe("remote MCP Streamable HTTP server", () => {
	beforeEach(async () => {
		await createProject();
	});

	afterEach(async () => {
		await remoteServer?.stop();
		await safeCleanup(testDir);
	});

	it("rejects unauthenticated requests before opening an MCP session", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0 });

		const response = await fetch(remoteServer.url, { method: "POST", body: "{}" });

		expect(response.status).toBe(401);
		expect(remoteServer.sessionManager.sessionCount).toBe(0);
	});

	it("serves only read-only tools by default", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0 });

		const sessionId = await initializeSession(remoteServer.url);
		const body = await listTools(remoteServer.url, sessionId);

		expect(body).toContain('"task_list"');
		expect(body).not.toContain('"task_create"');
	});

	it("exposes mutating tools only with allowWrite", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0, allowWrite: true });

		const sessionId = await initializeSession(remoteServer.url);
		const body = await listTools(remoteServer.url, sessionId);

		expect(body).toContain('"task_list"');
		expect(body).toContain('"task_create"');
	});
});
