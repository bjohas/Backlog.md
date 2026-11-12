import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { ScreenInterface } from "neo-neo-bblessed";
import { Core } from "../core/backlog.ts";
import type { Task } from "../types/index.ts";
import { viewTaskEnhanced } from "../ui/task-viewer-with-search.ts";
import { createScreen } from "../ui/tui.ts";
import { createUniqueTestDir, initializeTestProject, safeCleanup } from "./test-utils.ts";

function task(overrides: Partial<Task> = {}): Task {
	return {
		id: "TASK-1",
		title: "Existing task",
		status: "To Do",
		assignee: [],
		createdDate: "2026-07-15 00:00",
		labels: [],
		dependencies: [],
		...overrides,
	};
}

type TestListWidget = { items?: Array<{ content?: string }>; selected?: number };

function focusedListWidget(screen: ScreenInterface): TestListWidget | undefined {
	const withFocus = screen as unknown as { focused?: TestListWidget | null };
	return withFocus.focused ?? undefined;
}

async function waitUntil(predicate: () => boolean, message: string): Promise<void> {
	for (let attempt = 0; attempt < 200; attempt += 1) {
		if (predicate()) return;
		await Bun.sleep(10);
	}
	throw new Error(`Timed out waiting for ${message}`);
}

describe("TUI task list 'o' ordering", () => {
	let TEST_DIR: string;
	let core: Core;
	let ttyDescriptor: PropertyDescriptor | undefined;

	beforeEach(async () => {
		TEST_DIR = createUniqueTestDir("list-sort-focus");
		core = new Core(TEST_DIR);
		await initializeTestProject(core, "List Sort Focus Project");
		ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
		Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
	});

	afterEach(async () => {
		if (ttyDescriptor) Object.defineProperty(process.stdout, "isTTY", ttyDescriptor);
		else Reflect.deleteProperty(process.stdout, "isTTY");
		await Bun.sleep(20);
		await safeCleanup(TEST_DIR);
	});

	// applyFilters() destroys and recreates the list widget. Without an explicit re-focus the
	// keyboard lands on the filter header, which reads as "the status filter is highlighted"
	// and makes the arrow keys move between filters instead of tasks.
	it("keeps focus on the task list, on the same task, after the order changes", async () => {
		const screen = createScreen({ smartCSR: false });
		const first = task({ id: "TASK-1", title: "First by id", ordinal: 3000 });
		const second = task({ id: "TASK-2", title: "Second by id", ordinal: 1000 });

		try {
			void viewTaskEnhanced(first, { core, tasks: [first, second], screen });

			await waitUntil(() => Boolean(focusedListWidget(screen)?.items), "the task list to render and focus");
			const before = focusedListWidget(screen);
			const selectedBefore = before?.items?.[before.selected ?? 0]?.content;
			expect(selectedBefore).toContain("TASK-1");

			screen.emit("key o");

			// The list must still be the focused widget, and still on TASK-1 even though the
			// order moved it to a different row.
			await waitUntil(() => {
				const list = focusedListWidget(screen);
				return Boolean(list?.items?.[list.selected ?? 0]?.content?.includes("TASK-1"));
			}, "the list to keep focus on TASK-1 after the order change");

			const after = focusedListWidget(screen);
			expect(after?.items?.length).toBe(2);
			expect(after?.items?.[after.selected ?? 0]?.content).toContain("TASK-1");
		} finally {
			screen.destroy();
		}
	});
});
