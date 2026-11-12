// [FORK] Renders checkbox spans and rewrites repo-relative links against documentBaseUrl. See FORK.md; git diff upstream/main..main -- src/web/components/MermaidMarkdown.tsx
import { useEffect, useMemo, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useDocumentBaseUrl } from "../contexts/DocumentBaseUrlContext";
import { useTaskIdIndex } from "../contexts/TaskIdIndexContext";
import { createCheckboxSpanPlugin } from "../utils/checkbox-spans";
import { resolveRepoLinkUrl } from "../utils/document-url";
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

/**
 * Remark plugin that switches HTML syntax off in the Markdown parser, so tag-like text such
 * as `<repo>` is always plain text and the preview shows it as written, in prose and in code alike.
 *
 * This is also what keeps HTML in Markdown files inert. The preview library turns any HTML
 * the parser reports into real elements, and its `skipHtml` option does not switch that step
 * off, so `<script>`, `<img onerror=...>` and type strings such as `Result<List<MenuItem>>`
 * must never be reported as HTML. Autolinks (`<https://example.com>`, `<user@example.com>`)
 * are separate Markdown syntax and still link.
 * Mermaid diagrams are drawn from code blocks afterwards; `renderMermaidIn` keeps HTML out of those.
 */
function treatHtmlAsText(this: { data(): object }): void {
	// The processor's shared settings, where the Markdown parser looks up its extensions.
	const settings: { micromarkExtensions?: unknown[] } = this.data();
	settings.micromarkExtensions ??= [];
	// "htmlFlow" is block-level HTML and "htmlText" is inline HTML in micromark, the parser behind remark.
	settings.micromarkExtensions.push({ disable: { null: ["htmlFlow", "htmlText"] } });
}

type CheckboxSpanInputProps = React.InputHTMLAttributes<HTMLInputElement> & { node?: unknown };

/**
 * Our checkbox spans are controlled (`checked`) with no `onChange` - the
 * markdown source is the state, not the DOM - so a click's native toggle is
 * reverted by preventDefault() and the real change comes from a later
 * re-render. Without a `key` tied to that value, React can reconcile the
 * existing <input> in place and leave its native `checked` DOM property out
 * of sync with the prop (observed: unchecking a box that started checked, or
 * a box checked earlier in the same session, left it visually checked even
 * though the underlying markdown had correctly flipped). Keying by the
 * checked value forces a fresh DOM node on every change instead.
 */
function CheckboxSpanInput({ node: _node, className, checked, ...rest }: CheckboxSpanInputProps) {
	if (typeof className === "string" && className.includes("backlog-checkbox-span")) {
		return (
			<input
				key={`${(rest as Record<string, string | undefined>)["data-checkbox-offset"] ?? "readonly"}-${checked ? "1" : "0"}`}
				className={className}
				checked={checked}
				{...rest}
			/>
		);
	}
	return (
		<input className={className} checked={checked} {...rest} />
	);
}

const MARKDOWN_COMPONENTS = { input: CheckboxSpanInput };

function keepHashLinksInCurrentRoute(url: string, key: string): string {
	if (key !== "href" || !url.startsWith("#") || typeof window === "undefined") {
		return url;
	}

	return `${window.location.pathname}${window.location.search}${url}`;
}

function createUrlTransform(documentBaseUrl?: string) {
	return (url: string, key: string): string => {
		// Repo-relative links point at files the app does not serve; send them to
		// the configured viewer instead of leaving a dead in-app link.
		if (key === "href") {
			const external = resolveRepoLinkUrl(url, documentBaseUrl);
			if (external) return external;
		}
		return keepHashLinksInCurrentRoute(url, key);
	};
}

export default function MermaidMarkdown({ source, onToggleCheckbox }: Props) {
	const ref = useRef<HTMLDivElement | null>(null);
	const taskIdIndex = useTaskIdIndex();
	const documentBaseUrl = useDocumentBaseUrl();
	const urlTransform = useMemo(() => createUrlTransform(documentBaseUrl), [documentBaseUrl]);
	const interactiveCheckboxes = Boolean(onToggleCheckbox);
	const remarkPlugins = useMemo(
		() => [treatHtmlAsText, createTaskIdLinkPlugin(taskIdIndex), createCheckboxSpanPlugin(interactiveCheckboxes)],
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
	}, [source]);

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
				onToggleCheckbox(offset);
			}
		};

		container.addEventListener("click", handleClick);
		return () => container.removeEventListener("click", handleClick);
	}, [onToggleCheckbox]);

	return (
		<div ref={ref} className="wmde-markdown">
			<MDEditor.Markdown
				source={source}
				urlTransform={urlTransform}
				remarkPlugins={remarkPlugins}
				components={MARKDOWN_COMPONENTS}
			/>
		</div>
	);
}
