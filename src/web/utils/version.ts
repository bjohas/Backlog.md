// [FORK] Addresses start from the page's base path (lib/base-path.ts). See FORK.md; git diff upstream/main..main -- src/web/utils/version.ts
// Version utility for web UI
import { APP_BASE_PATH } from "../lib/base-path";
export async function getWebVersion(): Promise<string> {
	try {
		const response = await fetch(`${APP_BASE_PATH}/api/version`);
		const data = await response.json();
		return data.version;
	} catch {
		// If API call fails, just return empty string - UI can decide what to show
		return "";
	}
}
