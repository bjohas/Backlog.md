/**
 * Session lifecycle for the remote MCP HTTP runtime.
 *
 * The MCP SDK's `Server` binds to exactly one transport, so each Streamable
 * HTTP session gets its own `McpServer` + transport pair, keyed by the
 * `Mcp-Session-Id` header the transport assigns on `initialize`. The served
 * project root is fixed for every session: roots discovery is never enabled
 * here (`pinned: true`), so a client's `roots/list` response can never move
 * a remote session onto a different project.
 */
import { randomUUID } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createRemoteMcpServer, type McpServer } from "../server.ts";

type Session = {
	server: McpServer;
	transport: WebStandardStreamableHTTPServerTransport;
};

export type McpHttpSessionManagerOptions = {
	projectRoot: string;
	allowWrite: boolean;
	debug?: boolean;
};

function jsonRpcErrorResponse(status: number, code: number, message: string): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }), {
		status,
		headers: { "content-type": "application/json" },
	});
}

/**
 * Owns every live Streamable HTTP session for one pinned project root and
 * routes each incoming request to the session its `Mcp-Session-Id` header
 * names, or starts a new one for an `initialize` request with no header.
 */
export class McpHttpSessionManager {
	private readonly sessions = new Map<string, Session>();
	private readonly options: McpHttpSessionManagerOptions;

	constructor(options: McpHttpSessionManagerOptions) {
		this.options = options;
	}

	get sessionCount(): number {
		return this.sessions.size;
	}

	async handleRequest(request: Request): Promise<Response> {
		const sessionId = request.headers.get("mcp-session-id");

		if (sessionId) {
			const session = this.sessions.get(sessionId);
			if (!session) {
				return jsonRpcErrorResponse(404, -32001, "Session not found");
			}
			return session.transport.handleRequest(request);
		}

		if (request.method !== "POST") {
			return jsonRpcErrorResponse(400, -32000, "Bad Request: Mcp-Session-Id header is required");
		}

		let parsedBody: unknown;
		try {
			const bodyText = await request.text();
			parsedBody = bodyText.length > 0 ? JSON.parse(bodyText) : undefined;
		} catch {
			return jsonRpcErrorResponse(400, -32700, "Parse error");
		}

		if (!isInitializeRequest(parsedBody)) {
			return jsonRpcErrorResponse(400, -32000, "Bad Request: Mcp-Session-Id header is required");
		}

		return this.createSession(request, parsedBody);
	}

	private async createSession(request: Request, parsedBody: unknown): Promise<Response> {
		const server = await createRemoteMcpServer(this.options.projectRoot, {
			debug: this.options.debug,
			allowWrite: this.options.allowWrite,
		});

		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => randomUUID(),
			onsessioninitialized: (initializedSessionId) => {
				this.sessions.set(initializedSessionId, { server, transport });
			},
		});
		transport.onclose = () => {
			if (transport.sessionId) {
				this.sessions.delete(transport.sessionId);
			}
			void server.stop().catch(() => {});
		};

		await server.connect(transport);
		return transport.handleRequest(request, { parsedBody });
	}

	/** Closes every live session's transport and releases its server resources. */
	async closeAll(): Promise<void> {
		const sessions = Array.from(this.sessions.values());
		this.sessions.clear();
		await Promise.all(
			sessions.map(async (session) => {
				await session.transport.close().catch(() => {});
				await session.server.stop().catch(() => {});
			}),
		);
	}
}
