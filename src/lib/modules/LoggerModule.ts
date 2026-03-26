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

/**
 * Chalk-based structured logger with timestamped, color-coded output.
 * Supports levels: `notif`, `alert`, `error`, `debug`.
 */
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

		let content: string;
		if (message instanceof Error) {
			const stack = this.sanitizeStack(message.stack || "");
			content = stack
				? `${red(message.message)}\n${stack}`
				: red(message.message);
		} else {
			content = String(message);
		}

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

	/** Logs at the `notif` (info) level. If `raw` is true, returns the string instead of printing. */
	public notif(m: unknown, raw = false) {
		return this.log("notif", m, raw);
	}
	/** Logs at the `alert` (warn) level. If `raw` is true, returns the string instead of printing. */
	public alert(m: unknown, raw = false) {
		return this.log("alert", m, raw);
	}
	/**
	 * Logs at the `error` level. Pass an optional `Error` to include its sanitized stack trace.
	 * If `raw` is true, returns the string instead of printing.
	 */
	public error(m: unknown, e?: Error, raw = false) {
		return this.log("error", e ?? m, raw);
	}
	/** Logs at the `debug` level. If `raw` is true, returns the string instead of printing. */
	public debug(m: unknown, raw = false) {
		return this.log("debug", m, raw);
	}

	/** Prints a centered `─` divider line with the given text. */
	public divider(text: string): void {
		const trimmed = text.trim();
		const remaining = Math.max(0, 50 - trimmed.length - 2);
		const left = dim("─".repeat(Math.ceil(remaining / 2)));
		const right = dim("─".repeat(Math.floor(remaining / 2)));
		console.log(`\n${left} ${bold(trimmed)} ${right}`);
	}
}
