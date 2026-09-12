import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { type RemoteMcpServerHandle, startRemoteMcpServer } from "../mcp/http-server.ts";
import { McpServer } from "../mcp/server.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, safeCleanup } from "./test-utils.ts";

const TOKEN = "test-bearer-token";
const READ_ONLY_TOOL_NAMES = [
	"definition_of_done_defaults_get",
	"document_list",
	"document_search",
	"document_view",
	"get_backlog_instructions",
	"milestone_list",
	"task_list",
	"task_search",
	"task_view",
];
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

	it("requires the bearer token for POST, GET, and DELETE before session lookup", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0 });
		const sessionId = await initializeSession(remoteServer.url);

		const unauthenticated = await Promise.all([
			fetch(remoteServer.url, { method: "POST", body: "{}" }),
			fetch(remoteServer.url, { method: "GET", headers: { "mcp-session-id": sessionId } }),
			fetch(remoteServer.url, { method: "DELETE", headers: { "mcp-session-id": sessionId } }),
		]);

		for (const response of unauthenticated) {
			expect(response.status).toBe(401);
		}
		expect(remoteServer.sessionManager.sessionCount).toBe(1);

		const deleted = await fetch(remoteServer.url, {
			method: "DELETE",
			headers: { authorization: `Bearer ${TOKEN}`, "mcp-session-id": sessionId },
		});
		expect(deleted.status).toBe(200);
		expect(remoteServer.sessionManager.sessionCount).toBe(0);

		const afterDeletion = await fetch(remoteServer.url, {
			method: "POST",
			headers: {
				authorization: `Bearer ${TOKEN}`,
				"content-type": "application/json",
				"mcp-session-id": sessionId,
			},
			body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
		});
		expect(afterDeletion.status).toBe(404);
	});

	it("registers exactly the audited read-only tool surface by default", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0 });

		const sessionId = await initializeSession(remoteServer.url);
		const body = await listTools(remoteServer.url, sessionId);
		const toolNames = Array.from(body.matchAll(/"name":"([^"]+)"/g), (match) => match[1]).sort();

		expect(toolNames).toEqual(READ_ONLY_TOOL_NAMES);
	});

	it("exposes mutating tools only with allowWrite", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0, allowWrite: true });

		const sessionId = await initializeSession(remoteServer.url);
		const body = await listTools(remoteServer.url, sessionId);

		expect(body).toContain('"task_list"');
		expect(body).toContain('"task_create"');
	});

	it("keeps a remote session on its pinned project after a roots change notification", async () => {
		remoteServer = startRemoteMcpServer({ projectRoot: testDir, token: TOKEN, port: 0 });
		const sessionId = await initializeSession(remoteServer.url);

		const notification = await fetch(remoteServer.url, {
			method: "POST",
			headers: {
				authorization: `Bearer ${TOKEN}`,
				"content-type": "application/json",
				accept: "application/json, text/event-stream",
				"mcp-session-id": sessionId,
			},
			body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/roots/list_changed", params: {} }),
		});
		expect(notification.status).toBe(202);

		const body = await listTools(remoteServer.url, sessionId);
		const toolNames = Array.from(body.matchAll(/"name":"([^"]+)"/g), (match) => match[1]).sort();
		expect(toolNames).toEqual(READ_ONLY_TOOL_NAMES);
	});
});
