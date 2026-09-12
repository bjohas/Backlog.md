/**
 * Bearer token loading and verification for the remote MCP HTTP runtime.
 *
 * The token lives in a file (not a CLI argument, so it never appears in `ps`
 * output or shell history) whose permissions must deny group/other access —
 * the same guarantee `systemd`'s `LoadCredential=` provides. Comparison is
 * timing-safe and independent of caller input length, and the token is never
 * logged or included in error messages.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

/** Bits granting any access to the file's group or other classes. */
const GROUP_OR_OTHER_ACCESS_MASK = 0o077;

export class TokenFilePermissionError extends Error {}

/**
 * Reads and validates the bearer token file for `mcp serve`.
 *
 * Refuses to start if the file grants any permission to group or other,
 * mirroring the "owner-only file" requirement so a misconfigured deployment
 * fails loudly instead of quietly widening the token's exposure.
 */
export async function loadBearerToken(tokenFilePath: string): Promise<string> {
	const fileStat = await stat(tokenFilePath);
	if (!fileStat.isFile()) {
		throw new Error(`Token file is not a regular file: ${tokenFilePath}`);
	}

	if (fileStat.mode & GROUP_OR_OTHER_ACCESS_MASK) {
		throw new TokenFilePermissionError(
			`Refusing to start: token file must be owner-only (chmod 600), got mode ${(fileStat.mode & 0o777).toString(8)}: ${tokenFilePath}`,
		);
	}

	const raw = await readFile(tokenFilePath, "utf8");
	const token = raw.trim();
	if (!token) {
		throw new Error(`Token file is empty: ${tokenFilePath}`);
	}

	return token;
}

/**
 * Constant-time comparison of a candidate bearer token against the expected
 * token. Both sides are hashed to a fixed-length SHA-256 digest before
 * comparison so `timingSafeEqual` never sees mismatched buffer lengths
 * (which would throw and would otherwise leak the expected token's length
 * through error timing).
 */
export function verifyBearerToken(candidate: string, expected: string): boolean {
	return timingSafeEqual(
		createHash("sha256").update(candidate, "utf8").digest(),
		createHash("sha256").update(expected, "utf8").digest(),
	);
}

/**
 * Extracts the bearer token from an `Authorization` header value, if present
 * and well-formed (`Bearer <token>`).
 */
export function extractBearerToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) {
		return null;
	}
	const match = /^Bearer\s+(\S+)$/.exec(authorizationHeader.trim());
	return match?.[1] ?? null;
}
