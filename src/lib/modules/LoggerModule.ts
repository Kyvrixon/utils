import chalk from "chalk";

type LogLevel = "notif" | "alert" | "error" | "debug";
const { cyan, yellow, red, magenta, dim, gray, bold } = chalk;
const formatter = new Intl.DateTimeFormat("en-AU", {
	weekday: "short",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
});

export class LoggerModule {
	private readonly colors: Record<LogLevel, typeof chalk> = {
		notif: cyan,
		alert: yellow,
		error: red,
		debug: magenta,
	};

	private readonly logMethods: Record<
		LogLevel,
		"log" | "warn" | "error" | "debug"
	> = {
		notif: "log",
		alert: "warn",
		error: "error",
		debug: "debug",
	};

	private getTimestamp(): string {
		const d = new Date();
		return `${formatter.format(d)}.${d.getMilliseconds().toString().padStart(3, "0")}`;
	}

	private formatMessage(level: LogLevel, message: unknown): string {
		const timestamp = gray(`[${this.getTimestamp()}]`);
		const levelLabel = bold(this.colors[level](level.toUpperCase().padEnd(5)));

		const content =
			message instanceof Error
				? `${red(message.message)}\n${this.sanitizeStack(message.stack || "")}`
				: String(message);

		return `${timestamp} ${levelLabel} ${dim("»")} ${content}`;
	}

	private sanitizeStack(stack: string): string {
		return stack
			.split("\n")
			.slice(1)
			.filter((line) => line.includes(":") && !line.includes("node_modules"))
			.map((line) => {
				return line
					.trim()
					.replace(/\\/g, "/")
					.replace(
						/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/,
						(_, fn, f, l, c) => `  └─ ${fn} ${dim(f)} ${bold(`(L${l} C${c})`)}`,
					)
					.replace(
						/at\s+(.+):(\d+):(\d+)/,
						(_, f, l, c) => `  └─ ${dim(f)} ${bold(`(L${l} C${c})`)}`,
					);
			})
			.join("\n");
	}

	private log(
		level: LogLevel,
		message: unknown,
		raw = false,
	): string | undefined {
		const msg = this.formatMessage(level, message);
		if (raw) return msg;
		console[this.logMethods[level]](msg);
	}

	public notif(m: unknown, raw = false) {
		return this.log("notif", m, raw);
	}
	public alert(m: unknown, raw = false) {
		return this.log("alert", m, raw);
	}
	public error(m: unknown, e?: Error, raw = false) {
		return this.log("error", e ?? m, raw);
	}
	public debug(m: unknown, raw = false) {
		return this.log("debug", m, raw);
	}

	public divider(text: string): void {
		const line = dim("─".repeat(Math.max(0, (50 - text.length - 2) / 2)));
		console.log(`\n${line} ${bold(text.trim())} ${line}`);
	}
}
