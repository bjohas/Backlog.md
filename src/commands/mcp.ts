/**
 * MCP Command Group - Model Context Protocol CLI commands.
 *
 * `mcp start` is the stdio transport used by local desktop editor integrations.
 * `mcp serve` is the remote Streamable HTTP runtime: a single pinned project,
 * bound to loopback, gated by a required bearer token.
 */

import type { Command } from "commander";
import { isConfigValueError } from "../file-system/operations.ts";
import { loadBearerToken, TokenFilePermissionError } from "../mcp/http/bearer-auth.ts";
import { DEFAULT_MCP_HTTP_PORT, startRemoteMcpServer } from "../mcp/http-server.ts";
import { createMcpServer } from "../mcp/server.ts";
import { findBacklogRoot } from "../utils/find-backlog-root.ts";
import { resolveRuntimeCwd } from "../utils/runtime-cwd.ts";

type StartOptions = {
	debug?: boolean;
	cwd?: string;
};

type ServeOptions = {
	debug?: boolean;
	cwd: string;
	port: string;
	tokenFile: string;
	allowWrite?: boolean;
};

/**
 * Register MCP command group with CLI program.
 *
 * @param program - Commander program instance
 */
export function registerMcpCommand(program: Command): void {
	const mcpCmd = program.command("mcp");
	registerStartCommand(mcpCmd);
	registerServeCommand(mcpCmd);
}

/**
 * Register 'mcp start' command for stdio transport.
 */
function registerStartCommand(mcpCmd: Command): void {
	mcpCmd
		.command("start")
		.description("Start the MCP server using stdio transport")
		.option("-d, --debug", "Enable debug logging", false)
		.option("--cwd <path>", "Directory to resolve Backlog root from (overrides BACKLOG_CWD)")
		.action(async (options: StartOptions) => {
			try {
				const runtimeCwd = await resolveRuntimeCwd({ cwd: options.cwd });
				const projectRoot = (await findBacklogRoot(runtimeCwd.cwd)) ?? runtimeCwd.cwd;
				// An explicit --cwd/BACKLOG_CWD pins the root; an inferred process.cwd()
				// lets the server follow the client's workspace roots instead.
				const pinned = runtimeCwd.source !== "process";
				const server = await createMcpServer(projectRoot, { debug: options.debug, pinned });

				await server.connect();
				await server.start();

				if (options.debug) {
					if (runtimeCwd.source !== "process") {
						console.error(`Using MCP start directory from ${runtimeCwd.sourceLabel}: ${runtimeCwd.cwd}`);
					}
					console.error("Backlog.md MCP server started (stdio transport)");
				}

				let shutdownTriggered = false;
				const shutdown = async (signal: string) => {
					if (shutdownTriggered) {
						return;
					}
					shutdownTriggered = true;
					if (options.debug) {
						console.error(`Received ${signal}, shutting down MCP server...`);
					}

					try {
						await server.stop();
						process.exit(0);
					} catch (error) {
						console.error("Error during MCP server shutdown:", error);
						process.exit(1);
					}
				};

				const handleStdioClose = () => shutdown("stdio");
				process.stdin.once("end", handleStdioClose);
				if (process.platform !== "win32") {
					// On Windows, stdin can emit "close" while the MCP stdio pipe is still usable.
					process.stdin.once("close", handleStdioClose);
				}

				const handlePipeError = (error: unknown) => {
					const code =
						error && typeof error === "object" && "code" in error
							? String((error as { code?: string }).code ?? "")
							: "";
					if (code === "EPIPE") {
						void shutdown("EPIPE");
					}
				};
				process.stdout.once("error", handlePipeError);
				process.stderr.once("error", handlePipeError);

				process.once("SIGINT", () => shutdown("SIGINT"));
				process.once("SIGTERM", () => shutdown("SIGTERM"));
				if (process.platform !== "win32") {
					process.once("SIGHUP", () => shutdown("SIGHUP"));
					process.once("SIGPIPE", () => shutdown("SIGPIPE"));
				}
			} catch (error) {
				// A config value Backlog refuses to read already names the file, the key, and the fix,
				// so it is reported as written instead of behind a startup summary.
				if (isConfigValueError(error)) {
					console.error(error.message);
				} else {
					const message = error instanceof Error ? error.message : String(error);
					console.error(`Failed to start MCP server: ${message}`);
				}
				process.exit(1);
			}
		});
}

/**
 * Register 'mcp serve' command for the remote Streamable HTTP transport.
 *
 * Unlike `mcp start`, the project root is always pinned to `--cwd`: roots
 * discovery is never enabled, so no bearer-authenticated client can steer a
 * remote session onto a different project by answering `roots/list`.
 */
function registerServeCommand(mcpCmd: Command): void {
	mcpCmd
		.command("serve")
		.description("Serve the MCP server over Streamable HTTP on loopback, gated by a bearer token")
		.requiredOption("--cwd <path>", "Project root to serve (pinned; required)")
		.option("--port <port>", "TCP port to listen on", String(DEFAULT_MCP_HTTP_PORT))
		.requiredOption("--token-file <path>", "Path to a file containing the bearer token (must be owner-only, chmod 600)")
		.option("--allow-write", "Enable the full mutating tool set (default: read-only)", false)
		.option("-d, --debug", "Enable debug logging", false)
		.action(async (options: ServeOptions) => {
			try {
				const runtimeCwd = await resolveRuntimeCwd({ cwd: options.cwd });
				const projectRoot = (await findBacklogRoot(runtimeCwd.cwd)) ?? runtimeCwd.cwd;
				const token = await loadBearerToken(options.tokenFile);

				const port = Number.parseInt(options.port, 10);
				if (!Number.isInteger(port) || port < 0 || port > 65535) {
					throw new Error(`Invalid --port value: ${options.port}`);
				}

				const handle = startRemoteMcpServer({
					projectRoot,
					token,
					port,
					allowWrite: options.allowWrite,
					debug: options.debug,
				});

				console.error(
					`Backlog.md MCP server listening on ${handle.url} (project: ${projectRoot}, ${
						options.allowWrite ? "read-write" : "read-only"
					})`,
				);

				let shutdownTriggered = false;
				const shutdown = async (signal: string) => {
					if (shutdownTriggered) {
						return;
					}
					shutdownTriggered = true;
					if (options.debug) {
						console.error(`Received ${signal}, shutting down MCP HTTP server...`);
					}
					try {
						await handle.stop();
						process.exit(0);
					} catch (error) {
						console.error("Error during MCP HTTP server shutdown:", error);
						process.exit(1);
					}
				};

				process.once("SIGINT", () => shutdown("SIGINT"));
				process.once("SIGTERM", () => shutdown("SIGTERM"));
				if (process.platform !== "win32") {
					process.once("SIGHUP", () => shutdown("SIGHUP"));
				}
			} catch (error) {
				if (error instanceof TokenFilePermissionError) {
					console.error(error.message);
				} else if (isConfigValueError(error)) {
					console.error(error.message);
				} else {
					const message = error instanceof Error ? error.message : String(error);
					console.error(`Failed to start MCP HTTP server: ${message}`);
				}
				process.exit(1);
			}
		});
}
