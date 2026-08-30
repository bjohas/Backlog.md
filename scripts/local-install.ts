import { lstat, mkdir, readlink, symlink, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

export type LocalInstallResult = "installed" | "unchanged";

export async function installLocalBinary(binaryPath: string, homeDirectory = homedir()): Promise<LocalInstallResult> {
	const destination = resolve(homeDirectory, ".local", "bin", "backlog");
	const target = resolve(binaryPath);

	await mkdir(dirname(destination), { recursive: true });
	try {
		const existing = await lstat(destination);
		if (!existing.isSymbolicLink()) {
			throw new Error(`Refusing to replace non-symlink executable at ${destination}`);
		}
		if (resolve(dirname(destination), await readlink(destination)) === target) {
			return "unchanged";
		}
		await unlink(destination);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}

	await symlink(target, destination);
	return "installed";
}
