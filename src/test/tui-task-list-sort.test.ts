import { describe, expect, it } from "bun:test";
import type { Task } from "../types/index.ts";
import { getTaskListFooterContent } from "../ui/footer-content.ts";
import { nextTaskListSortField, TASK_LIST_SORT_FIELDS, type TaskListSortField } from "../ui/task-viewer-with-search.ts";
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
	// The list renders the identity corpus, which is task-id ordered. The board orders by
	// ordinal, so the two views disagreed about the same tasks until the list could sort.
	it("defaults to the board's ordinal order rather than task id order", () => {
		const tasks = [
			task("task-1", { ordinal: 3000 }),
			task("task-2", { ordinal: 1000 }),
			task("task-3", { ordinal: 2000 }),
		];

		expect(sortTasks(tasks, "ordinal").map((t) => t.id)).toEqual(["task-2", "task-3", "task-1"]);
		expect(TASK_LIST_SORT_FIELDS[0]).toBe("ordinal");
	});

	it("orders by task id and by priority when asked", () => {
		const tasks = [
			task("task-10", { ordinal: 1000, priority: "low" }),
			task("task-2", { ordinal: 2000, priority: "high" }),
		];

		// Hierarchical ids, not string order: task-2 precedes task-10.
		expect(sortTasks(tasks, "id").map((t) => t.id)).toEqual(["task-2", "task-10"]);
		expect(sortTasks(tasks, "priority", ["high", "medium", "low"])[0]?.id).toBe("task-2");
	});

	it("cycles through every order and returns to the start", () => {
		const seen: TaskListSortField[] = ["ordinal"];
		let field: TaskListSortField = "ordinal";
		for (let step = 0; step < TASK_LIST_SORT_FIELDS.length; step += 1) {
			field = nextTaskListSortField(field);
			seen.push(field);
		}

		expect(seen.slice(0, TASK_LIST_SORT_FIELDS.length)).toEqual([...TASK_LIST_SORT_FIELDS]);
		// A full cycle lands back where it started, so the key is never a dead end.
		expect(field).toBe("ordinal");
	});

	it("names the active order in the footer so it is visible without pressing anything", () => {
		expect(getTaskListFooterContent({ sort: "ordinal" })).toContain("Sort:ordinal");
		expect(getTaskListFooterContent({ sort: "priority" })).toContain("Sort:priority");
		expect(getTaskListFooterContent()).toContain("{cyan-fg}[O]{/} Sort");
	});
});
