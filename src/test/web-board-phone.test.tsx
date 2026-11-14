// Below the sm breakpoint the board is used on a phone: cards move by choosing a column instead of
// dragging, column tabs jump between full-width columns, and the sidebar starts folded.
import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import type { Task } from "../types/index.ts";
import Board from "../web/components/Board.tsx";
import SideNavigation from "../web/components/SideNavigation.tsx";
import { apiClient, type MoveTasksPayload } from "../web/lib/api.ts";

const STATUSES = ["To Do", "In Progress", "Done"];

const buildTask = (id: string, status: string, extra: Partial<Task> = {}): Task => ({
	id,
	title: `Card ${id}`,
	status,
	assignee: [],
	labels: [],
	dependencies: [],
	createdDate: "2026-01-01",
	...extra,
});

let activeRoot: Root | null = null;
const originalEvent = globalThis.Event;
const originalCustomEvent = globalThis.CustomEvent;
const originalFetch = globalThis.fetch;

/** A fresh document; `phone` decides whether the phone-width media query matches. */
const setupDom = (phone = false): HTMLElement => {
	const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
		url: "http://localhost/board",
	});
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	globalThis.window = dom.window as unknown as Window & typeof globalThis;
	globalThis.document = dom.window.document as unknown as Document;
	globalThis.navigator = dom.window.navigator as unknown as Navigator;
	globalThis.localStorage = dom.window.localStorage;
	// The sidebar's tooltip library dispatches events built from the global constructors.
	globalThis.Event = dom.window.Event as unknown as typeof Event;
	globalThis.CustomEvent = dom.window.CustomEvent as unknown as typeof CustomEvent;
	window.matchMedia = ((query: string) => ({
		matches: query === "(width < 40rem)" && phone,
		addEventListener: () => {},
		removeEventListener: () => {},
	})) as never;
	const container = document.getElementById("root") as HTMLElement;
	activeRoot = createRoot(container);
	return container;
};

const renderBoard = (tasks: Task[]): HTMLElement => {
	const container = setupDom();
	act(() => {
		activeRoot?.render(
			<Board
				onEditTask={() => {}}
				onNewTask={() => {}}
				tasks={tasks}
				statuses={STATUSES}
				isLoading={false}
				milestones={[]}
				availableLabels={[]}
				milestoneEntities={[]}
				archivedMilestones={[]}
				laneMode="none"
				onLaneChange={() => {}}
				onTasksUpdated={() => {}}
			/>,
		);
	});
	return container;
};

afterEach(() => {
	if (activeRoot) {
		act(() => activeRoot?.unmount());
		activeRoot = null;
	}
	globalThis.Event = originalEvent;
	globalThis.CustomEvent = originalCustomEvent;
	globalThis.fetch = originalFetch;
});

describe("the board on a phone", () => {
	it("moves one card to the column chosen on that card, offering only the other columns", async () => {
		const originalMoveTasks = apiClient.moveTasks.bind(apiClient);
		const calls: MoveTasksPayload[] = [];
		apiClient.moveTasks = async (payload) => {
			calls.push(payload);
			return { success: true, tasks: [], changedTasks: [], failures: [] };
		};
		try {
			const container = renderBoard([buildTask("TASK-1", "To Do"), buildTask("TASK-2", "In Progress")]);
			const select = container.querySelector('select[aria-label="Move TASK-1 to"]') as HTMLSelectElement;
			expect(Array.from(select.options).map((option) => option.value)).toEqual(["", "In Progress", "Done"]);

			await act(async () => {
				select.value = "Done";
				select.dispatchEvent(new window.Event("change", { bubbles: true }));
				await Promise.resolve();
			});

			expect(calls).toEqual([{ taskIds: ["TASK-1"], targetStatus: "Done" }]);
		} finally {
			apiClient.moveTasks = originalMoveTasks;
		}
	});

	it("offers no move on a card from another branch, which cannot be moved here", () => {
		const container = renderBoard([buildTask("TASK-1", "To Do", { branch: "feature" })]);
		expect(container.querySelector('select[aria-label="Move TASK-1 to"]')).toBeNull();
	});

	it("brings a column into view from its tab", () => {
		const container = renderBoard([buildTask("TASK-1", "To Do")]);
		const shown: string[] = [];
		window.HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
			shown.push(this.querySelector("h3")?.textContent ?? "");
		};
		const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
		expect(tabs.map((tab) => tab.textContent)).toEqual(["To Do 1", "In Progress 0", "Done 0"]);

		act(() => {
			tabs[2]?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
		});

		expect(shown).toEqual(["Done"]);
		expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
		expect(tabs[0]?.getAttribute("aria-selected")).toBe("false");
	});
});

describe("the sidebar on a phone", () => {
	const renderSidebar = (phone: boolean): HTMLElement => {
		const container = setupDom(phone);
		globalThis.fetch = (async () => new Response("{}")) as unknown as typeof fetch;
		localStorage.setItem("sideNavCollapsed", "false");
		act(() => {
			activeRoot?.render(
				<MemoryRouter>
					<SideNavigation
						taskCount={0}
						docs={[]}
						decisions={[]}
						isLoading={false}
						onRefreshData={async () => {}}
					/>
				</MemoryRouter>,
			);
		});
		return container;
	};
	const toggleLabel = (container: HTMLElement) =>
		container.querySelector('button[aria-label$="sidebar"]')?.getAttribute("aria-label");

	it("starts folded on a phone without overwriting the choice saved for wider screens", () => {
		const container = renderSidebar(true);
		expect(toggleLabel(container)).toBe("Expand sidebar");
		expect(localStorage.getItem("sideNavCollapsed")).toBe("false");
	});

	it("keeps the saved choice on a wider screen", () => {
		expect(toggleLabel(renderSidebar(false))).toBe("Collapse sidebar");
	});
});
