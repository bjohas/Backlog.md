import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DuplicateRepairPlan } from "../core/duplicate-task-repair.ts";
import type { BacklogConfig, GuardedTaskSyncResult, SearchResult } from "../types/index.ts";
import type AppComponent from "../web/App.tsx";
import type NavigationComponent from "../web/components/Navigation.tsx";
import { ApiClient, ApiError, apiClient } from "../web/lib/api.ts";
import { HealthCheckProvider } from "../web/contexts/HealthCheckContext.tsx";
import { ThemeProvider } from "../web/contexts/ThemeContext.tsx";

let App: typeof AppComponent | undefined;
let Navigation: typeof NavigationComponent | undefined;
let autoSyncFreshnessMs = 0;


const originalFetch = globalThis.fetch;
const originalWebSocket = globalThis.WebSocket;
const originalCustomEvent = globalThis.CustomEvent;
const originalResizeObserver = globalThis.ResizeObserver;
const originalDateNow = Date.now;
const originalApiMethods = {
	checkStatus: apiClient.checkStatus,
	fetchStatuses: apiClient.fetchStatuses,
	fetchConfig: apiClient.fetchConfig,
	fetchMilestones: apiClient.fetchMilestones,
	fetchArchivedMilestones: apiClient.fetchArchivedMilestones,
	search: apiClient.search,
	fetchDuplicateTaskRepairPlan: apiClient.fetchDuplicateTaskRepairPlan,
	syncCurrentBranch: apiClient.syncCurrentBranch,
};

let activeRoot: Root | null = null;

const config: BacklogConfig = {
	projectName: "Sync contract",
	statuses: ["To Do"],
	labels: [],
	types: ["Task"],
	milestones: [],
	dateFormat: "YYYY-MM-DD",
	remoteOperations: false,
	prefixes: { task: "BACK" },
	zeroPaddedIds: 3,
};

const emptyDuplicatePlan: DuplicateRepairPlan = {
	groups: [],
	crossBranchFindings: [],
	changes: [],
	references: [],
	referenceScanComplete: true,
	blockedReasons: [],
	repairable: false,
	fingerprint: "empty",
};

class FakeWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	readyState = FakeWebSocket.OPEN;
	onopen: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	close() {
		this.readyState = FakeWebSocket.CLOSED;
	}

	send() {}
}

function deferred<T>() {
	let resolve: (value: T) => void;
	let reject: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve: resolve!, reject: reject! };
}

async function flushReact(): Promise<void> {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	});
}

function installDom(): HTMLElement {
	const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
		url: "http://localhost/board",
		pretendToBeVisual: true,
	});
	globalThis.window = dom.window as unknown as Window & typeof globalThis;
	globalThis.document = dom.window.document;
	globalThis.navigator = dom.window.navigator;
	globalThis.localStorage = dom.window.localStorage;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Element = dom.window.Element;
	globalThis.Node = dom.window.Node;
	globalThis.Event = dom.window.Event;
	globalThis.CustomEvent = dom.window.CustomEvent;
	globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
	globalThis.ResizeObserver = class {
		disconnect() {}
		observe() {}
		unobserve() {}
	} as unknown as typeof ResizeObserver;
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	window.matchMedia = () =>
		({
			matches: false,
			media: "",
			onchange: null,
			addListener() {},
			removeListener() {},
			addEventListener() {},
			removeEventListener() {},
			dispatchEvent: () => false,
		}) as MediaQueryList;
	Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
	globalThis.fetch = (async () => Response.json({ version: "test" })) as unknown as typeof fetch;
	return document.getElementById("root") as HTMLElement;
}

function installInitialDataMocks(): { getSearchCalls: () => number } {
	let searchCalls = 0;
	apiClient.checkStatus = async () => ({ initialized: true, projectPath: "/tmp/web-sync" });
	apiClient.fetchStatuses = async () => ["To Do"];
	apiClient.fetchConfig = async () => config;
	apiClient.fetchMilestones = async () => [];
	apiClient.fetchArchivedMilestones = async () => [];
	apiClient.search = async (): Promise<SearchResult[]> => {
		searchCalls += 1;
		return [];
	};
	apiClient.fetchDuplicateTaskRepairPlan = async () => emptyDuplicatePlan;
	return { getSearchCalls: () => searchCalls };
}

async function loadWebComponents(): Promise<void> {
	if (App && Navigation) return;
	// These modules import react-tooltip, which captures Event at module load; import after JSDOM installs its Event.
	const [appModule, navigationModule] = await Promise.all([
		import("../web/App.tsx"),
		import("../web/components/Navigation.tsx"),
	]);
	App = appModule.default;
	autoSyncFreshnessMs = appModule.AUTO_SYNC_FRESHNESS_MS;
	Navigation = navigationModule.default;
}

async function mountApp(): Promise<HTMLElement> {
	const container = installDom();
	await loadWebComponents();
	const AppView = App;
	if (!AppView) throw new Error("Expected App to load");
	activeRoot = createRoot(container);
	await act(async () => {
		activeRoot?.render(
			<HealthCheckProvider>
				<AppView />
			</HealthCheckProvider>,
		);
	});
	await flushReact();
	return container;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
	const match = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.trim() === label);
	expect(match).toBeTruthy();
	return match as HTMLButtonElement;
}

afterEach(() => {
	if (activeRoot) {
		act(() => activeRoot?.unmount());
		activeRoot = null;
	}
	globalThis.fetch = originalFetch;
	globalThis.WebSocket = originalWebSocket;
	globalThis.ResizeObserver = originalResizeObserver;
	globalThis.CustomEvent = originalCustomEvent;
	Date.now = originalDateNow;
	Object.assign(apiClient, originalApiMethods);
});

describe("web guarded sync", () => {
	it("recovers only complete expected 409 sync results", async () => {
		const client = new ApiClient({ retries: 0 });
		globalThis.fetch = (async () =>
			Response.json({ status: "local-changes", message: "Commit or stash local changes first." }, { status: 409 })) as unknown as typeof fetch;

		await expect(client.syncCurrentBranch()).resolves.toEqual({
			status: "local-changes",
			message: "Commit or stash local changes first.",
		});

		globalThis.fetch = (async () => Response.json({ status: "local-changes" }, { status: 409 })) as unknown as typeof fetch;
		await expect(client.syncCurrentBranch()).rejects.toBeInstanceOf(ApiError);
	});

	it("uses the exact automatic freshness window, lets manual sync bypass it, and refreshes after fast-forward", async () => {
		const first = deferred<GuardedTaskSyncResult>();
		const second = deferred<GuardedTaskSyncResult>();
		const third = deferred<GuardedTaskSyncResult>();
		const responses = [first, second, third];
		let syncCalls = 0;
		let now = 1_000;
		Date.now = () => now;
		const { getSearchCalls } = installInitialDataMocks();
		apiClient.syncCurrentBranch = () => responses[syncCalls++]!.promise;

		const container = await mountApp();
		expect(syncCalls).toBe(1);
		expect(findButton(container, "Syncing…").disabled).toBe(true);

		await act(async () => {
			first.resolve({ status: "fast-forwarded", message: "Fast-forwarded main." });
			await Promise.resolve();
		});
		expect(getSearchCalls()).toBeGreaterThan(1);

		now += autoSyncFreshnessMs - 1;
		await act(async () => {
			document.dispatchEvent(new Event("visibilitychange"));
			await Promise.resolve();
		});
		expect(syncCalls).toBe(1);

		const visibleAtBoundary = now + 1;
		now = visibleAtBoundary;
		await act(async () => {
			document.dispatchEvent(new Event("visibilitychange"));
			await Promise.resolve();
		});
		expect(syncCalls).toBe(2);
		await act(async () => {
			second.resolve({ status: "up-to-date", message: "Already up to date." });
			await Promise.resolve();
		});

		await act(async () => {
			findButton(container, "Sync").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
		});
		expect(syncCalls).toBe(3);
		expect(findButton(container, "Syncing…").disabled).toBe(true);
		await act(async () => {
			document.dispatchEvent(new Event("visibilitychange"));
			await Promise.resolve();
		});
		expect(syncCalls).toBe(3);
		await act(async () => {
			third.resolve({ status: "up-to-date", message: "Already up to date." });
			await Promise.resolve();
		});
	});

	it("does not make a failed request fresh", async () => {
		const failed = deferred<GuardedTaskSyncResult>();
		const retry = deferred<GuardedTaskSyncResult>();
		let syncCalls = 0;
		Date.now = () => 5_000;
		installInitialDataMocks();
		apiClient.syncCurrentBranch = () => [failed, retry][syncCalls++]!.promise;

		await mountApp();
		await act(async () => {
			failed.reject(new Error("Network unavailable"));
			await Promise.resolve();
		});
		await act(async () => {
			document.dispatchEvent(new Event("visibilitychange"));
			await Promise.resolve();
		});
		expect(syncCalls).toBe(2);
		await act(async () => {
			retry.resolve({ status: "up-to-date", message: "Already up to date." });
			await Promise.resolve();
		});
	});

	it("presents sync tone, status semantics, and pending state", async () => {
		const container = installDom();
		await loadWebComponents();
		const NavigationView = Navigation;
		if (!NavigationView) throw new Error("Expected Navigation to load");
		activeRoot = createRoot(container);
		await act(async () => {
			activeRoot?.render(
				<ThemeProvider>
					<NavigationView
						projectName="Sync contract"
						onSync={async () => {}}
						syncResult={{ status: "diverged", message: "Reconcile histories manually." }}
						isSyncPending
					/>
				</ThemeProvider>,
			);
		});

		const status = container.querySelector("[role='status']");
		expect(status?.textContent).toContain("Reconcile histories manually.");
		expect(status?.className).toContain("text-amber-700");
		expect(findButton(container, "Syncing…").disabled).toBe(true);

		await act(async () => {
			activeRoot?.render(
				<ThemeProvider>
					<NavigationView
						projectName="Sync contract"
						onSync={async () => {}}
						syncResult={{ status: "fast-forwarded", message: "Fast-forwarded main." }}
					/>
				</ThemeProvider>,
			);
		});
		expect(container.querySelector("[role='status']")?.className).toContain("text-emerald-700");
	});
});
