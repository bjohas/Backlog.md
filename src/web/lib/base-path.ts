/**
 * The path this page is served under, taken from its `<base href>`: "" at the root (the
 * default `<base href="/">`), "/tasks-ui/ORG/PROJECT" when a proxy serves the board under that
 * prefix and puts its own `<base>` into the page. Root-anchored addresses ignore `<base>`, so
 * every address the page builds (data, WebSocket, router, links) starts from this instead of "/".
 */
export const APP_BASE_PATH =
	typeof document === "undefined" ? "" : new URL(".", document.baseURI).pathname.replace(/\/$/, "");

/** The WebSocket address of the server behind this page. */
export function appWebSocketUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}${APP_BASE_PATH}/`;
}
