import { file } from "bun";
import { readdir } from "node:fs/promises";

// Because im lazy as hell :3
await file("./src/index.ts").write(
	(await readdir("./src/lib", { withFileTypes: true }))
		.filter((f) => f.isFile() && f.name.endsWith(".ts"))
		.map((f) => `export * from "./lib/${f.name.replace(".ts", "")}";`)
		.join("\n"),
);
