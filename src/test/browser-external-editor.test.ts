// `backlog browser --external-editor` names an editor elsewhere for documents; the server hands it
// to the page without writing it to config.yml.
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { BacklogServer } from "../server/index.ts";
import { externalEditorUrl, parseExternalEditor } from "../utils/external-editor.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, safeCleanup } from "./test-utils.ts";

const CLI_PATH = join(process.cwd(), "src", "cli.ts");
const PATTERN = "https://editor.example/w/ORG/PROJECT/{path}";

let projectDir: string;
let server: BacklogServer | null = null;

async function status(options: ConstructorParameters<typeof BacklogServer>[1]): Promise<Record<string, unknown>> {
	server = new BacklogServer(projectDir, options);
	await server.start(0, false);
	return (await (await fetch(`http://127.0.0.1:${server.getPort()}/api/status`)).json()) as Record<string, unknown>;
}

describe("browser --external-editor", () => {
	beforeEach(async () => {
		projectDir = createUniqueTestDir("browser-external-editor");
		await mkdir(projectDir, { recursive: true });
		await initializeFilesystemTestProject(new Core(projectDir), "External editor");
	});

	afterEach(async () => {
		await server?.stop();
		server = null;
		await safeCleanup(projectDir);
	});

	it("tells the page the editor and the docs folder's path from the project root, leaving config.yml alone", async () => {
		const configPath = join(projectDir, "backlog", "config.yml");
		const configBefore = await Bun.file(configPath).text();

		const shown = await status({ externalEditor: { urlPattern: PATTERN, label: "BeeWriter" } });

		expect(shown.externalEditor).toEqual({ urlPattern: PATTERN, label: "BeeWriter", docsDirectory: "backlog/docs" });
		expect(await Bun.file(configPath).text()).toBe(configBefore);
	});

	it("reports no external editor without the options", async () => {
		expect((await status({})).externalEditor).toBeNull();
	});

	it("refuses one option without the other, a pattern without {path}, and a non-http address", () => {
		expect(() => parseExternalEditor(PATTERN, undefined)).toThrow("must be given together");
		expect(() => parseExternalEditor(undefined, "BeeWriter")).toThrow("must be given together");
		expect(() => parseExternalEditor("https://editor.example/w/", "BeeWriter")).toThrow("{path}");
		expect(() => parseExternalEditor("file:///srv/{path}", "BeeWriter")).toThrow("http(s)");
		expect(parseExternalEditor(undefined, undefined)).toBeUndefined();
	});

	it("stops the browser command with the error", async () => {
		const result = await $`bun ${CLI_PATH} browser --no-open --external-editor ${PATTERN}`
			.cwd(projectDir)
			.nothrow()
			.quiet();

		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("--external-editor and --external-editor-label must be given together");
	});

	it("percent-encodes each part of the file's path", () => {
		expect(externalEditorUrl(PATTERN, "backlog/docs/guides/doc-3 - Plan #2.md")).toBe(
			"https://editor.example/w/ORG/PROJECT/backlog/docs/guides/doc-3%20-%20Plan%20%232.md",
		);
	});
});
