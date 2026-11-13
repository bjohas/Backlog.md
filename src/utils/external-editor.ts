/**
 * An editor elsewhere that owns the document files, named when `backlog browser` starts
 * (`--external-editor` and `--external-editor-label`). The Docs page then sends Edit and New document
 * there instead of offering its own editor, so only one program writes a document.
 */
export interface ExternalEditor {
	/** An http(s) address containing `{path}`, which is replaced by the file's path from the project root. */
	urlPattern: string;
	/** The editor's name, shown as "Edit in <label>". */
	label: string;
}

const PATH_PLACEHOLDER = "{path}";

/**
 * The external editor given on the command line, or undefined when neither option is set. Throws
 * when only one of the two is given or the pattern is not an http(s) address with `{path}`.
 */
export function parseExternalEditor(urlPattern?: string, label?: string): ExternalEditor | undefined {
	const pattern = urlPattern?.trim() ?? "";
	const name = label?.trim() ?? "";
	if (!pattern && !name) return undefined;
	if (!pattern || !name) {
		throw new Error("--external-editor and --external-editor-label must be given together.");
	}
	if (!pattern.includes(PATH_PLACEHOLDER)) {
		throw new Error(
			`--external-editor must contain ${PATH_PLACEHOLDER}, e.g. https://github.com/OWNER/REPO/edit/main/{path}`,
		);
	}
	let protocol = "";
	try {
		protocol = new URL(pattern.replaceAll(PATH_PLACEHOLDER, "x")).protocol;
	} catch {}
	if (protocol !== "http:" && protocol !== "https:") {
		throw new Error(`--external-editor must be an http(s) address, got "${pattern}".`);
	}
	return { urlPattern: pattern, label: name };
}

/**
 * The editor's address for one file. `filePath` is the file's path from the project root with `/`
 * between folders; each folder and file name is percent-encoded, so a space becomes `%20`.
 */
export function externalEditorUrl(urlPattern: string, filePath: string): string {
	const encodedPath = filePath.split("/").filter(Boolean).map(encodeURIComponent).join("/");
	return urlPattern.replaceAll(PATH_PLACEHOLDER, encodedPath);
}
