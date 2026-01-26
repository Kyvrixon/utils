import { env } from "bun";
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
 * To enable debuging make the env variable `__DEBUG_MODE` equal to "1"
 */
export class Logger {
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
		const now = new Date();
		const ms = now.getMilliseconds().toString().padStart(3, "0");
		const base = formatter.format(now).replace(",", " @");
		return `${base}.${ms}`;
	}

	private formatMessage(level: LogLevel, message: string | Error): string {
		const timestamp = gray(`[${this.getTimestamp()}]`);
		const levelLabel = bold(this.colors[level](level.toUpperCase().padEnd(5)));

		const content =
			message instanceof Error
				? `${red(message.message)}\n${dim(this.sanitizeStack(message.stack || ""))}`
				: message;

		return `${timestamp} ${levelLabel} ${dim("»")} ${content}`;
	}

	private sanitizeStack(stack: string): string {
		return stack
			.split("\n")
			.filter((line) => !line.includes("(native") && line.includes(":"))
			.map((line, index) => {
				if (index === 0) return false;
				return (
					line
						.trim()
						// .replace(/\\/g, "/")
						// .replace(
						// 	/(.*):(\d+):(\d+)/,
						// 	(_, f, l, c) => `${dim(f)} ${bold(`(L${l} C${c})`)}`,
						// )
						.replace(/at\s+/, "  └─ ")
				);
			})
			.filter(Boolean)
			.join("\n");
	}

	private log(level: LogLevel, message: unknown, forceError?: boolean): void {
		if (forceError) return void console.error(message);
		void console[this.logMethods[level]](
			this.formatMessage(level, message as string | Error),
		);
	}

	/**
	 * Pring a regular (info) message
	 * 
	 * @param m Message to display
	 */
	public notif(m: unknown) {
		this.log("notif", m);
	}

	/**
	 * Print an alert (warning)
	 * 
	 * @param m Message to display
	 */
	public alert(m: unknown) {
		this.log("alert", m);
	}

	/**
	 * Print an error
	 * 
	 * @param m Message to display
	 * @param e Error (optional)
	 * @param f Force error - directly calls `console.error()`
	 */
	public error(m: unknown, e?: Error, f?: boolean) {
		this.log("error", e ?? m, f);
	}

	/**
	 * Print a debug message
	 * 
	 * @param m Message to display
	 */
	public debug(m: unknown) {
		if ("__DEBUG_MODE" in env && env.__DEBUG_MODE === "1") this.log("debug", m);
	}

	public divider(text: string): void {
		const line = dim("─".repeat(Math.max(0, (50 - text.length - 2) / 2)));
		console.log(`\n${line} ${bold(text.trim())} ${line}`);
	}
}