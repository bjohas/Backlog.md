import { describe, expect, it } from "bun:test";
import type { Task } from "../types/index.ts";
import { getHelpShortcuts } from "../ui/components/help-popup.ts";
import { getTaskListFooterContent } from "../ui/footer-content.ts";
import {
	nextTaskListSort,
	resolveRestoredSelectionIndex,
	TASK_LIST_SORT_CYCLE,
} from "../ui/task-viewer-with-search.ts";
import { sortTasks } from "../utils/task-sorting.ts";

const task = (id: string, overrides: Partial<Task> = {}): Task =>
	({
		id,
		title: id,
		status: "To Do",
		assignee: [],
		labels: [],
		dependencies: [],
		createdDate: "2026-01-01",
		...overrides,
	}) as Task;

describe("task list ordering", () => {
	it("starts in the default order of task list, the board's order, and cycles back to it", () => {
		// undefined is `task list` without --sort: ordinal, then priority, then ID.
		expect(TASK_LIST_SORT_CYCLE[0]).toBeUndefined();
		const seen: (string | undefined)[] = [];
		let sort: string | undefined;
		for (let step = 0; step < TASK_LIST_SORT_CYCLE.length; step += 1) {
			sort = nextTaskListSort(sort);
			seen.push(sort);
		}

		expect(seen).toEqual(["id", "priority", undefined]);
	});

	it("steps from a --sort value outside the cycle back to the default order", () => {
		expect(nextTaskListSort("ordinal")).toBeUndefined();
		expect(nextTaskListSort("ID")).toBe("priority");
	});

	it("names the active order in the footer so it is visible without pressing anything", () => {
		expect(getTaskListFooterContent({ sort: "default" })).toContain("Sort:default");
		expect(getTaskListFooterContent({ sort: "priority" })).toContain("Sort:priority");
		expect(getTaskListFooterContent()).toContain("{cyan-fg}[O]{/} Sort");
	});

	it("advertises the binding in the list view help popup", () => {
		const keys = getHelpShortcuts("task-list").map((shortcut) => shortcut.key);
		expect(keys).toContain("O");
		// The board has no such binding: its order is the ordinal one by definition.
		expect(getHelpShortcuts("board").map((shortcut) => shortcut.key)).not.toContain("O");
	});

	it("keeps the selected task selected when the order changes", () => {
		const tasks = [
			task("task-1", { ordinal: 3000 }),
			task("task-2", { ordinal: 1000 }),
			task("task-3", { ordinal: 2000 }),
		];

		// task-3 sits at a different row in each order, which is the whole point of the check.
		expect(resolveRestoredSelectionIndex(sortTasks(tasks, "id"), "task-3")).toBe(2);
		expect(resolveRestoredSelectionIndex(sortTasks(tasks, "ordinal"), "task-3")).toBe(1);
	});

	it("falls back to the first row only when the task is gone or a first selection is forced", () => {
		const tasks = sortTasks([task("task-1", { ordinal: 2000 }), task("task-2", { ordinal: 1000 })], "ordinal");

		expect(resolveRestoredSelectionIndex(tasks, "task-9")).toBe(0);
		expect(resolveRestoredSelectionIndex(tasks, "task-1", true)).toBe(0);
		expect(resolveRestoredSelectionIndex([], "task-1")).toBe(0);
	});
});
