# Backlog.md MCP Implementation (MVP)

This directory exposes MCP over local stdio and authenticated Streamable HTTP without duplicating business logic.

## What’s included

- `server.ts` / `createMcpServer()` – bootstraps a `Core`-backed MCP server that registers task, milestone, Definition of Done defaults, and document tools (`task_*`, `milestone_*`, `definition_of_done_defaults_*`, `document_*`) for MCP clients.
- `http-server.ts` / `http/` – loopback-only Streamable HTTP transport for `mcp serve`; it requires an owner-only bearer-token file, pins the project root, and registers read-only tools unless the process starts with `--allow-write`.
- `tasks/` – consolidated task tooling that delegates to shared Core helpers (including plan/notes/AC editing).
- `documents/` – document tooling layered on `Core`’s document helpers for list/view/create/update/search flows, including docs-directory-relative path metadata.
- `tools/dependency-tools.ts` – dependency helpers reusing shared builders.
- `resources/` – lightweight resource adapters for agents.
- `guidelines/mcp/` – task workflow content surfaced via MCP.

Everything routes through existing Core APIs so the MCP layer stays a protocol wrapper.

Document tool `path` inputs are subdirectories under the configured docs directory, for example `guides/setup`.
Created and updated document responses include the persisted docs-relative file path. Absolute paths and traversal
segments such as `..` are rejected by the shared core/filesystem path handling.

## Development workflow

```bash
# Local stdio server
backlog mcp start

# Remote Streamable HTTP server: loopback only, bearer token required, read-only by default
backlog mcp serve --cwd /absolute/project --token-file /path/to/owner-only-token

# Add --allow-write only as a deliberate process-start permission change
backlog mcp serve --cwd /absolute/project --token-file /path/to/owner-only-token --allow-write

# Tests
bun test src/test/mcp-*.test.ts
```

The test suite covers MCP tools, resource discovery, and the authenticated HTTP session and permission boundary.
