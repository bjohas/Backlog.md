import { useEffect, useMemo, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useTaskIdIndex } from "../contexts/TaskIdIndexContext";
import { createCheckboxSpanPlugin } from "../utils/checkbox-spans";
import { renderMermaidIn } from "../utils/mermaid";
import { createTaskIdLinkPlugin } from "../utils/task-id-links";

interface Props {
	source: string;
	/**
	 * Called with the offset in `source` of a checkbox span the reader clicked.
	 * Omit to render checkbox spans read-only.
	 */
	onToggleCheckbox?: (sourceOffset: number) => void;
}

const URI_AUTOLINK_PREFIX_REGEX = /^<[A-Za-z][A-Za-z0-9+.-]{1,31}:[^<>\u0000-\u0020]*>/;
const EMAIL_AUTOLINK_PREFIX_REGEX = /^<[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z0-9-]+>/;

const ESCAPED_LT = "&lt;";
const LT_BEFORE_LETTER = /<(?=[A-Za-z])/g;

/**
 * Escape markup-looking `<` while keeping autolinks intact, and record where each
 * escape lands so positions in the parsed markdown map back to the original source.
 */
function sanitizeMarkdownSource(source: string): { text: string; escapes: number[] } {
	const escapes: number[] = [];
	let text = "";
	let cursor = 0;

	LT_BEFORE_LETTER.lastIndex = 0;
	let match = LT_BEFORE_LETTER.exec(source);
	while (match) {
		const remaining = source.slice(match.index);
		if (!URI_AUTOLINK_PREFIX_REGEX.test(remaining) && !EMAIL_AUTOLINK_PREFIX_REGEX.test(remaining)) {
			text += source.slice(cursor, match.index);
			escapes.push(text.length);
			text += ESCAPED_LT;
			cursor = match.index + 1;
		}
		match = LT_BEFORE_LETTER.exec(source);
	}

	return { text: text + source.slice(cursor), escapes };
}

/** Undo the sanitizer's expansion: every escape before `offset` added 3 characters. */
function toSourceOffset(offset: number, escapes: number[]): number {
	let shift = 0;
	for (const at of escapes) {
		if (at >= offset) break;
		shift += ESCAPED_LT.length - 1;
	}
	return offset - shift;
}

function keepHashLinksInCurrentRoute(url: string, key: string): string {
	if (key !== "href" || !url.startsWith("#") || typeof window === "undefined") {
		return url;
	}

	return `${window.location.pathname}${window.location.search}${url}`;
}

export default function MermaidMarkdown({ source, onToggleCheckbox }: Props) {
	const ref = useRef<HTMLDivElement | null>(null);
	const { text: safeSource, escapes } = useMemo(() => sanitizeMarkdownSource(source), [source]);
	const taskIdIndex = useTaskIdIndex();
	const interactiveCheckboxes = Boolean(onToggleCheckbox);
	const remarkPlugins = useMemo(
		() => [createTaskIdLinkPlugin(taskIdIndex), createCheckboxSpanPlugin(interactiveCheckboxes)],
		[taskIdIndex, interactiveCheckboxes],
	);

	useEffect(() => {
		if (!ref.current) return;

		// Render mermaid diagrams after the markdown has been rendered
		// Use requestAnimationFrame to ensure MDEditor has finished rendering
		const frameId = requestAnimationFrame(() => {
			if (ref.current) {
				void renderMermaidIn(ref.current);
			}
		});

		return () => cancelAnimationFrame(frameId);
	}, [safeSource]);

	useEffect(() => {
		const container = ref.current;
		if (!container || !onToggleCheckbox) return;

		const handleClick = (event: MouseEvent) => {
			const input = (event.target as Element | null)?.closest?.("input[data-checkbox-offset]");
			if (!(input instanceof HTMLInputElement)) return;
			// The markdown source owns the state: re-rendering it sets the box, not this click.
			event.preventDefault();
			const offset = Number(input.dataset.checkboxOffset);
			if (Number.isInteger(offset)) {
				onToggleCheckbox(toSourceOffset(offset, escapes));
			}
		};

		container.addEventListener("click", handleClick);
		return () => container.removeEventListener("click", handleClick);
	}, [onToggleCheckbox, escapes]);

	return (
		<div ref={ref} className="wmde-markdown">
			<MDEditor.Markdown
				source={safeSource}
				urlTransform={keepHashLinksInCurrentRoute}
				remarkPlugins={remarkPlugins}
			/>
		</div>
	);
}
