import { describe, expect, it } from "bun:test";
import { createCheckboxSpanPlugin, findCheckboxSpans, toggleCheckboxSpanAt } from "../web/utils/checkbox-spans.ts";

describe("checkbox spans", () => {
	it("finds both unchecked spellings and checked spans", () => {
		const source = "- []{.checkbox} tight\n- [ ]{.checkbox} spaced\n- [x]{.checkbox} done\n";
		expect(findCheckboxSpans(source).map((span) => span.checked)).toEqual([false, false, true]);
	});

	it("checks a box by writing the checked span", () => {
		const source = "- []{.checkbox} option A";
		const offset = findCheckboxSpans(source)[0]?.offset ?? -1;
		expect(toggleCheckboxSpanAt(source, offset)).toBe("- [x]{.checkbox} option A");
	});

	it("unchecks to the tight canonical form from either spelling", () => {
		expect(toggleCheckboxSpanAt("[x]{.checkbox} a", 0)).toBe("[]{.checkbox} a");
		// A spaced box checks, then unchecks to tight - pandoc's fixed point.
		const checked = toggleCheckboxSpanAt("[ ]{.checkbox} a", 0);
		expect(checked).toBe("[x]{.checkbox} a");
		expect(toggleCheckboxSpanAt(checked ?? "", 0)).toBe("[]{.checkbox} a");
	});

	it("changes only the span at the offset", () => {
		const source = "- []{.checkbox} one\n- []{.checkbox} two\n- [x]{.checkbox} three\n";
		const second = findCheckboxSpans(source)[1]?.offset ?? -1;
		const next = toggleCheckboxSpanAt(source, second) ?? "";
		expect(next).toBe("- []{.checkbox} one\n- [x]{.checkbox} two\n- [x]{.checkbox} three\n");
		expect(next.length).toBe(source.length + 1);
	});

	it("refuses an offset that does not start a span", () => {
		const source = "- []{.checkbox} one";
		expect(toggleCheckboxSpanAt(source, 0)).toBeNull();
		expect(toggleCheckboxSpanAt(source, 3)).toBeNull();
		expect(toggleCheckboxSpanAt(source, -1)).toBeNull();
		expect(toggleCheckboxSpanAt(source, 9999)).toBeNull();
	});

	it("rewrites text nodes into checkbox nodes carrying their source offset", () => {
		const tree = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "pick []{.checkbox} or [x]{.checkbox}", position: { start: { offset: 10 } } },
					],
				},
			],
		};
		createCheckboxSpanPlugin(true)()(tree);
		const parts = (tree.children[0] as { children: Array<Record<string, unknown>> }).children;
		expect(parts.map((part) => part.type)).toEqual(["text", "checkboxSpan", "text", "checkboxSpan"]);
		const first = parts[1]?.data as { hProperties: Record<string, unknown> };
		const second = parts[3]?.data as { hProperties: Record<string, unknown> };
		expect(first.hProperties.checked).toBe(false);
		// text starts at source offset 10, span starts 5 characters in
		expect(first.hProperties["data-checkbox-offset"]).toBe("15");
		expect(second.hProperties.checked).toBe(true);
	});

	it("renders read-only boxes when not interactive or when position is unknown", () => {
		const withoutPosition = {
			type: "root",
			children: [{ type: "paragraph", children: [{ type: "text", value: "[]{.checkbox}" }] }],
		};
		createCheckboxSpanPlugin(true)()(withoutPosition);
		const node = (withoutPosition.children[0] as { children: Array<Record<string, unknown>> }).children[0];
		const data = node?.data as { hProperties: Record<string, unknown> } | undefined;
		expect(data?.hProperties.disabled).toBe(true);
	});

	it("leaves link labels alone", () => {
		const tree = {
			type: "root",
			children: [
				{ type: "paragraph", children: [{ type: "link", children: [{ type: "text", value: "[]{.checkbox}" }] }] },
			],
		};
		createCheckboxSpanPlugin(true)()(tree);
		const link = (tree.children[0] as { children: Array<{ children: Array<{ type: string }> }> }).children[0];
		expect(link?.children[0]?.type).toBe("text");
	});
});
