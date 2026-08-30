import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import tailwind from "bun-plugin-tailwind";
import { installLocalBinary } from "./local-install.ts";

type PackageJson = {
	version: string;
};

const packageJson = (await Bun.file("package.json").json()) as PackageJson;
const outfile = process.env.BACKLOG_BUILD_OUTFILE ?? "dist/backlog";
const outdir = process.env.BACKLOG_BUILD_OUTDIR;
const version = process.env.BACKLOG_BUILD_VERSION ?? packageJson.version;
const target = process.env.BACKLOG_BUILD_TARGET;
const outputDirectory = outdir ?? dirname(outfile);
const installLocal = process.env.BACKLOG_INSTALL_LOCAL === "1";

if (installLocal && outdir) {
	throw new Error("BACKLOG_INSTALL_LOCAL requires a compiled binary, not BACKLOG_BUILD_OUTDIR");
}

if (outputDirectory !== ".") {
	await mkdir(outputDirectory, { recursive: true });
}

const result = await Bun.build({
	entrypoints: ["src/cli.ts"],
	target: "bun",
	minify: true,
	define: {
		__EMBEDDED_VERSION__: JSON.stringify(version),
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	plugins: [tailwind],
	...(outdir
		? { outdir }
		: {
				compile: {
					outfile,
					...(target ? { target: target as Bun.Build.CompileTarget } : {}),
				},
			}),
	throw: false,
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}
	process.exit(1);
}

if (installLocal) {
	const result = await installLocalBinary(outfile);
	console.log(
		result === "installed"
			? "Installed local backlog binary at ~/.local/bin/backlog"
			: "Local backlog binary already installed at ~/.local/bin/backlog",
	);
}
