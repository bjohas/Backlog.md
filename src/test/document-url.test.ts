import { describe, expect, it } from "bun:test";
import { resolveDocumentUrl, resolveRepoLinkUrl } from "../web/utils/document-url.ts";

const BASE = "https://beewriter.opendev.space/w/org_3DOiGPE2uZGH73FLfjfNwgR2ulM/beewriter-tracker";

describe("resolveDocumentUrl", () => {
	it("joins a relative documentation path onto the base", () => {
		expect(resolveDocumentUrl("docs/mobile-menubar-disappears.md", BASE)).toBe(
			`${BASE}/docs/mobile-menubar-disappears.md`,
		);
	});

	it("does not double the separator", () => {
		expect(resolveDocumentUrl("/docs/a.md", `${BASE}/`)).toBe(`${BASE}/docs/a.md`);
		expect(resolveDocumentUrl("docs/a.md", `${BASE}//`)).toBe(`${BASE}/docs/a.md`);
	});

	it("passes absolute URLs through, base or no base", () => {
		const url = "https://github.com/OpenDevEd/beewriter/pull/535";
		expect(resolveDocumentUrl(url, BASE)).toBe(url);
		expect(resolveDocumentUrl(url, undefined)).toBe(url);
	});

	it("returns null when there is nothing to link to", () => {
		expect(resolveDocumentUrl("docs/a.md", undefined)).toBeNull();
		expect(resolveDocumentUrl("docs/a.md", "   ")).toBeNull();
		expect(resolveDocumentUrl("   ", BASE)).toBeNull();
	});
});

describe("resolveRepoLinkUrl", () => {
	it("rewrites repo-relative links onto the base", () => {
		expect(resolveRepoLinkUrl("docs/x.md", BASE)).toBe(`${BASE}/docs/x.md`);
		expect(resolveRepoLinkUrl("/docs/x.md", BASE)).toBe(`${BASE}/docs/x.md`);
	});

	it("normalises parent-relative links to the same target", () => {
		expect(resolveRepoLinkUrl("../../docs/x.md", BASE)).toBe(`${BASE}/docs/x.md`);
		expect(resolveRepoLinkUrl("./docs/x.md", BASE)).toBe(`${BASE}/docs/x.md`);
	});

	it("leaves anything with a scheme, protocol-relative or an anchor alone", () => {
		for (const href of [
			"https://example.com/x",
			"http://example.com/x",
			"mailto:a@b.c",
			"data:image/png;base64,AAAA",
			"//example.com/x",
			"#section",
		]) {
			expect(resolveRepoLinkUrl(href, BASE)).toBeNull();
		}
	});

	it("keeps the app's own routes internal", () => {
		expect(resolveRepoLinkUrl("/tasks/BACK-1", BASE)).toBeNull();
		expect(resolveRepoLinkUrl("tasks/BACK-1", BASE)).toBeNull();
		expect(resolveRepoLinkUrl("/documentation/doc-1", BASE)).toBeNull();
		expect(resolveRepoLinkUrl("/board", BASE)).toBeNull();
	});

	it("does nothing without a configured base", () => {
		expect(resolveRepoLinkUrl("docs/x.md", undefined)).toBeNull();
	});
});
