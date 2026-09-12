/**
 * Remote MCP HTTP runtime (`backlog mcp serve`).
 *
 * Binds a Streamable HTTP transport to a single pinned project root behind a
 * required bearer token. Every request is authenticated before any session
 * lookup or MCP dispatch happens; the token is verified with a timing-safe
 * comparison and never logged. Read-only is the default permission level —
 * `--allow-write` is the only way to reach the full (mutating) tool set, and
 * that gate is enforced at tool-registration time in `McpServer`, not here.
 */
import type { Server } from "bun";
import { extractBearerToken, verifyBearerToken } from "./http/bearer-auth.ts";
import { McpHttpSessionManager } from "./http/session-manager.ts";

export const MCP_HTTP_PATH = "/mcp";
export const DEFAULT_MCP_HTTP_PORT = 6424;
const LOOPBACK_HOST = "127.0.0.1";

export type RemoteMcpServerOptions = {
	projectRoot: string;
	token: string;
	/** Defaults to 6424. Pass 0 to let the OS assign an ephemeral port (tests). */
	port?: number;
	/** Defaults to false: only tools annotated `readOnlyHint: true` are reachable. */
	allowWrite?: boolean;
	debug?: boolean;
};

export type RemoteMcpServerHandle = {
	server: Server<unknown>;
	url: string;
	port: number;
	sessionManager: McpHttpSessionManager;
	stop: () => Promise<void>;
};

function unauthorizedResponse(): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null }), {
		status: 401,
		headers: {
			"content-type": "application/json",
			"www-authenticate": 'Bearer realm="backlog-mcp"',
		},
	});
}

/**
 * Starts the remote MCP HTTP server bound to loopback. The caller owns the
 * bearer token's lifecycle (typically loaded once via `loadBearerToken`);
 * this function only ever compares against it, never logs it.
 */
export function startRemoteMcpServer(options: RemoteMcpServerOptions): RemoteMcpServerHandle {
	const sessionManager = new McpHttpSessionManager({
		projectRoot: options.projectRoot,
		readOnly: !options.allowWrite,
		debug: options.debug,
	});

	const server = Bun.serve({
		hostname: LOOPBACK_HOST,
		port: options.port ?? DEFAULT_MCP_HTTP_PORT,
		fetch: async (request: Request): Promise<Response> => {
			const url = new URL(request.url);
			if (url.pathname !== MCP_HTTP_PATH) {
				return new Response("Not Found", { status: 404 });
			}

			const candidate = extractBearerToken(request.headers.get("authorization"));
			if (!candidate || !verifyBearerToken(candidate, options.token)) {
				return unauthorizedResponse();
			}

			return sessionManager.handleRequest(request);
		},
	});

	const port = server.port ?? options.port ?? DEFAULT_MCP_HTTP_PORT;
	return {
		server,
		port,
		url: `http://${LOOPBACK_HOST}:${port}${MCP_HTTP_PATH}`,
		sessionManager,
		stop: async () => {
			server.stop(true);
			await sessionManager.closeAll();
		},
	};
}
