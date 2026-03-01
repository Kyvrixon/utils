import { readdir } from "node:fs/promises";
import { version } from "./package.json";

await Bun.write(
	"./src/index.ts",
	(await readdir("./src/lib", { recursive: true, withFileTypes: true }))
		.filter((f) => f.isFile() && f.name.endsWith(".ts"))
		.map(
			(f) =>
				`export * from "./${f.parentPath.replace("src/lib", "").replace(/\\/g, "/").replace("src/", "")}/${f.name.replace(".ts", "")}";`,
		)
		.join("\n"),
);

await Bun.write(
	"./README.md",
	`
# @kyvrixon/utils

General utility files I use for alot of projects! Designed for use with [bun runtime](https://bun.sh/)!

\`\`\`bash
bun install @kyvrixon/utils
# or
bun install github:kyvrixon/utils#${version}

# if you want the absolute latest changes (unstable)
bun install github:kyvrixon/utils#main
\`\`\`
`.trim(),
);
