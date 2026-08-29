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
