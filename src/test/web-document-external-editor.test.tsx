// With `backlog browser --external-editor`, the Docs page sends Edit and New document to that editor
// and offers no editor of its own.
import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM, VirtualConsole } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Document } from "../types/index.ts";
import DocumentationDetail from "../web/components/DocumentationDetail.tsx";
import { ThemeProvider } from "../web/contexts/ThemeContext.tsx";
import type { ExternalDocumentEditor } from "../web/lib/api.ts";

const EDITOR: ExternalDocumentEditor = {
	urlPattern: "https://editor.example/w/ORG/PROJECT/{path}",
	label: "BeeWriter",
	docsDirectory: "backlog/docs",
};

const DOC: Document = {
	id: "doc-1",
	title: "Release plan",
	type: "other",
	createdDate: "2026-01-01 00:00",
	rawContent: "Plan steps.",
	path: "guides/doc-1 - Release plan.md",
};

let activeRoot: Root | null = null;
const originalFetch = globalThis.fetch;

interface Session {
	container: HTMLElement;
	requests: string[];
	/** Navigations jsdom was asked for and cannot perform: the window leaving for another page. */
	pageNavigations: number;
}

async function open(path: string): Promise<Session> {
	const virtualConsole = new VirtualConsole();
	const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
		url: "http://localhost",
		virtualConsole,
	});
	const session: Session = {
		container: dom.window.document.getElementById("root") as unknown as HTMLElement,
		requests: [],
		pageNavigations: 0,
	};
	virtualConsole.on("jsdomError", (error) => {
		if (error.message.includes("navigation to another Document")) session.pageNavigations += 1;
	});
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	globalThis.window = dom.window as unknown as Window & typeof globalThis;
	globalThis.document = dom.window.document as unknown as typeof globalThis.document;
	globalThis.navigator = dom.window.navigator as unknown as Navigator;
	globalThis.localStorage = dom.window.localStorage;
	globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) =>
		setTimeout(() => callback(0), 0)) as unknown as typeof requestAnimationFrame;
	globalThis.cancelAnimationFrame = ((handle: number) => clearTimeout(handle)) as typeof cancelAnimationFrame;
	if (!window.matchMedia) {
		window.matchMedia = (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })) as never;
	}
	const json = (status: number, body: unknown) =>
		new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		const url = new URL(String(input), "http://localhost");
		const method = init?.method ?? "GET";
		session.requests.push(`${method} ${url.pathname}`);
		if (method === "GET" && url.pathname === "/api/docs/doc-1") return json(200, DOC);
		if (method === "POST" && url.pathname === "/api/docs") {
			return json(201, { ...DOC, id: "doc-2", title: "New plan", path: "guides/doc-2 - New plan.md" });
		}
		return json(404, { error: "Not found" });
	}) as unknown as typeof globalThis.fetch;

	const page = <DocumentationDetail docs={[]} onRefreshData={async () => {}} externalEditor={EDITOR} />;
	activeRoot = createRoot(session.container);
	await act(async () => {
		activeRoot?.render(
			<ThemeProvider>
				<MemoryRouter initialEntries={[path]}>
					<Routes>
						<Route path="/documentation/:id" element={page} />
						<Route path="/documentation/:id/:title" element={page} />
					</Routes>
				</MemoryRouter>
			</ThemeProvider>,
		);
	});
	await act(async () => {});
	return session;
}

const buttonNamed = (container: HTMLElement, label: string) =>
	Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.trim() === label);

afterEach(() => {
	if (activeRoot) {
		act(() => activeRoot?.unmount());
		activeRoot = null;
	}
	globalThis.fetch = originalFetch;
});

describe("the Docs page with an external editor", () => {
	it("links Edit to the editor for the document's file, in the whole window", async () => {
		const { container } = await open("/documentation/1/release-plan");

		const link = Array.from(container.querySelectorAll("a")).find((a) => a.textContent?.trim() === "Edit in BeeWriter");
		expect(link?.getAttribute("href")).toBe(
			"https://editor.example/w/ORG/PROJECT/backlog/docs/guides/doc-1%20-%20Release%20plan.md",
		);
		expect(link?.getAttribute("target")).toBe("_top");
		expect(buttonNamed(container, "Edit")).toBeUndefined();
	});

	it("does not open its own editor for an ?edit=true link", async () => {
		const { container } = await open("/documentation/1/release-plan?edit=true");

		expect(container.textContent).toContain("Plan steps.");
		expect(container.querySelector("textarea")).toBeNull();
		expect(buttonNamed(container, "Save")).toBeUndefined();
	});

	it("asks only for title and folder, creates the document, then leaves for the editor", async () => {
		const session = await open("/documentation/new");
		const { container } = session;
		expect(container.querySelector("textarea")).toBeNull();
		const [title, folder] = Array.from(container.querySelectorAll("input"));
		const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
		await act(async () => {
			setValue?.call(title, "New plan");
			title?.dispatchEvent(new window.Event("input", { bubbles: true }));
			setValue?.call(folder, "guides");
			folder?.dispatchEvent(new window.Event("input", { bubbles: true }));
		});

		await act(async () => {
			buttonNamed(container, "Save")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
		});
		await act(async () => {});

		expect(session.requests).toContain("POST /api/docs");
		expect(session.pageNavigations).toBe(1);
	});
});
