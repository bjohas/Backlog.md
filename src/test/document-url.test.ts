import { describe, expect, it } from "bun:test";
import { resolveDocumentUrl } from "../web/utils/document-url.ts";

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
