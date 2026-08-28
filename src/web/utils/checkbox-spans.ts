/**
 * Quarto/Pandoc checkbox spans: `[x]{.checkbox}` (checked) and `[]{.checkbox}`
 * (unchecked). Documents authored in BeeWriter use these as inline decision
 * boxes, so task text carries them and the web UI renders them as real
 * checkboxes that write their new state back to the task file.
 *
 * `[]{.checkbox}` is the canonical unchecked spelling: pandoc parses `[ ]` into
 * a span with empty children and writes it back tight, so the tight form is the
 * only fixed point an unchecked box has.
 */

const CHECKED_SPAN = "[x]{.checkbox}";
const UNCHECKED_SPAN = "[]{.checkbox}";

/** Matches both spellings of an unchecked box (`[]` and `[ ]`) and a checked one. */
const CHECKBOX_SPAN = /\[([ xX]?)\]\{\.checkbox\}/g;
/** The same span, anchored, for verifying a claimed offset before writing. */
const CHECKBOX_SPAN_AT = /^\[([ xX]?)\]\{\.checkbox\}/;

const isChecked = (value: string) => value === "x" || value === "X";

/**
 * Toggle the checkbox span that starts at `offset`.
 *
 * Returns null when no span starts exactly there, so a stale or mis-mapped
 * offset leaves the document untouched rather than rewriting the wrong text.
 */
export function toggleCheckboxSpanAt(source: string, offset: number): string | null {
	if (!Number.isInteger(offset) || offset < 0 || offset >= source.length) return null;
	const match = CHECKBOX_SPAN_AT.exec(source.slice(offset));
	if (!match) return null;
	const replacement = isChecked(match[1] ?? "") ? UNCHECKED_SPAN : CHECKED_SPAN;
	return source.slice(0, offset) + replacement + source.slice(offset + match[0].length);
}

/** Every checkbox span in `source`, in document order. Spans inside code are included. */
export function findCheckboxSpans(source: string): Array<{ offset: number; checked: boolean }> {
	const spans: Array<{ offset: number; checked: boolean }> = [];
	CHECKBOX_SPAN.lastIndex = 0;
	let match = CHECKBOX_SPAN.exec(source);
	while (match) {
		spans.push({ offset: match.index, checked: isChecked(match[1] ?? "") });
		match = CHECKBOX_SPAN.exec(source);
	}
	return spans;
}

/** Minimal mdast shape: only the fields this transform reads or writes. */
type MarkdownNode = {
	type: string;
	value?: string;
	children?: MarkdownNode[];
	position?: { start?: { offset?: number } };
	data?: Record<string, unknown>;
};

/** Text inside a link is its label; a checkbox there would swallow the click. */
const SKIPPED_NODES = new Set(["link", "linkReference", "definition"]);

function checkboxNode(checked: boolean, offset: number | null): MarkdownNode {
	return {
		type: "checkboxSpan",
		data: {
			hName: "input",
			hProperties: {
				type: "checkbox",
				checked,
				// Rendered state is owned by the markdown source, not the DOM: the click
				// handler rewrites the source and the tree re-renders from it.
				readOnly: true,
				className: "backlog-checkbox-span",
				...(offset === null ? { disabled: true } : { "data-checkbox-offset": String(offset) }),
			},
		},
	};
}

function splitCheckboxSpans(node: MarkdownNode, interactive: boolean): MarkdownNode[] | null {
	const value = node.value;
	if (typeof value !== "string" || !value.includes("{.checkbox}")) return null;

	// mdast offsets index the parsed source; a text node without one cannot be
	// located for writing, so its boxes render read-only rather than guess.
	const base = interactive ? node.position?.start?.offset : undefined;
	const parts: MarkdownNode[] = [];
	let cursor = 0;

	CHECKBOX_SPAN.lastIndex = 0;
	let match = CHECKBOX_SPAN.exec(value);
	while (match) {
		if (match.index > cursor) {
			parts.push({ type: "text", value: value.slice(cursor, match.index) });
		}
		parts.push(checkboxNode(isChecked(match[1] ?? ""), typeof base === "number" ? base + match.index : null));
		cursor = match.index + match[0].length;
		match = CHECKBOX_SPAN.exec(value);
	}

	if (parts.length === 0) return null;
	if (cursor < value.length) {
		parts.push({ type: "text", value: value.slice(cursor) });
	}
	return parts;
}

function transform(node: MarkdownNode, interactive: boolean): void {
	const children = node.children;
	if (!children) return;

	const rewritten: MarkdownNode[] = [];
	let changed = false;
	for (const child of children) {
		if (child.type === "text") {
			const parts = splitCheckboxSpans(child, interactive);
			if (parts) {
				rewritten.push(...parts);
				changed = true;
				continue;
			}
		} else if (!SKIPPED_NODES.has(child.type)) {
			transform(child, interactive);
		}
		rewritten.push(child);
	}

	if (changed) {
		node.children = rewritten;
	}
}

/**
 * Remark plugin rendering checkbox spans as checkboxes. Inline code and fences
 * hold no text children in mdast, so spans quoted as syntax stay literal.
 */
export function createCheckboxSpanPlugin(interactive: boolean) {
	return () => (tree: MarkdownNode) => {
		transform(tree, interactive);
	};
}
