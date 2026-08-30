import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { lstat, mkdir, readlink, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { installLocalBinary } from "../../scripts/local-install.ts";
import { createUniqueTestDir } from "./test-utils.ts";

let testDirectory: string;

async function createBinary(name: string): Promise<string> {
	const binaryPath = join(testDirectory, "dist", name);
	await mkdir(join(testDirectory, "dist"), { recursive: true });
	await writeFile(binaryPath, "binary");
	return binaryPath;
}

describe("installLocalBinary", () => {
	beforeEach(async () => {
		testDirectory = createUniqueTestDir("test-local-install");
		await mkdir(testDirectory, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDirectory, { recursive: true, force: true });
	});

	it("installs and updates the local binary symlink", async () => {
		const firstBinary = await createBinary("backlog-v1");
		const destination = join(testDirectory, ".local", "bin", "backlog");

		expect(await installLocalBinary(firstBinary, testDirectory)).toBe("installed");
		expect((await lstat(destination)).isSymbolicLink()).toBe(true);
		expect(resolve(join(testDirectory, ".local", "bin"), await readlink(destination))).toBe(resolve(firstBinary));
		expect(await installLocalBinary(firstBinary, testDirectory)).toBe("unchanged");

		const secondBinary = await createBinary("backlog-v2");
		expect(await installLocalBinary(secondBinary, testDirectory)).toBe("installed");
		expect(resolve(join(testDirectory, ".local", "bin"), await readlink(destination))).toBe(resolve(secondBinary));
	});

	it("refuses to replace an existing executable", async () => {
		const binary = await createBinary("backlog");
		const destination = join(testDirectory, ".local", "bin", "backlog");
		await mkdir(join(testDirectory, ".local", "bin"), { recursive: true });
		await writeFile(destination, "existing executable");

		await expect(installLocalBinary(binary, testDirectory)).rejects.toThrow(
			`Refusing to replace non-symlink executable at ${destination}`,
		);
	});
});
