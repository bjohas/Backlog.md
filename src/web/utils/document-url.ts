/**
 * Documentation entries are repo-relative paths (`docs/foo.md`). When the
 * project configures a base URL they become links against an external viewer;
 * entries that are already absolute URLs are left alone.
 */
export function resolveDocumentUrl(doc: string, baseUrl?: string): string | null {
	const path = doc.trim();
	if (!path) return null;
	if (/^https?:\/\//i.test(path)) return path;

	const base = baseUrl?.trim();
	if (!base) return null;
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

/** Routes the web UI serves itself; links into these must stay in the app. */
const APP_ROUTES = new Set(["board", "decisions", "documentation", "drafts", "settings", "statistics", "tasks"]);

/**
 * Rewrite a repo-relative markdown link (`docs/x.md`, `../../docs/x.md`) to the
 * configured document base URL. Returns null when the href is not ours to
 * rewrite: absolute URLs, data/mailto and friends, in-page anchors, and the
 * app's own routes - including the `/tasks/<id>` links the task-id plugin adds.
 */
export function resolveRepoLinkUrl(href: string, baseUrl?: string): string | null {
	const base = baseUrl?.trim();
	if (!base) return null;

	const target = href.trim();
	if (!target) return null;
	// Any scheme (http:, data:, mailto:), protocol-relative, or an anchor.
	if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//") || target.startsWith("#")) return null;

	// Drop ./ and ../ segments: task files live under backlog/tasks, so a
	// parent-relative link resolves to the same repo path as a plain one.
	const path = target.replace(/^\/+/, "").replace(/^(?:\.{1,2}\/)+/, "");
	if (!path || APP_ROUTES.has(path.split("/")[0] ?? "")) return null;

	return `${base.replace(/\/+$/, "")}/${path}`;
}
