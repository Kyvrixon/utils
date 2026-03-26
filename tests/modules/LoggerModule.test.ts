/** biome-ignore-all lint/suspicious/noExplicitAny: test spies */
import { afterEach, beforeEach, describe, expect, test, spyOn } from "bun:test";
import { LoggerModule } from "../../src";

let logger: LoggerModule;
let logSpy: any;
let warnSpy: any;
let errorSpy: any;
let debugSpy: any;

beforeEach(() => {
	logger = new LoggerModule();
	logSpy = spyOn(console, "log").mockImplementation(() => {});
	warnSpy = spyOn(console, "warn").mockImplementation(() => {});
	errorSpy = spyOn(console, "error").mockImplementation(() => {});
	debugSpy = spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
	logSpy.mockRestore();
	warnSpy.mockRestore();
	errorSpy.mockRestore();
	debugSpy.mockRestore();
});

describe("LoggerModule", () => {
	describe("notif", () => {
		test("prints to console.log with NOTIF label", () => {
			logger.notif("hello");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0][0]).toContain("NOTIF");
			expect(logSpy.mock.calls[0][0]).toContain("hello");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.notif("raw test", true);
			expect(logSpy).not.toHaveBeenCalled();
			expect(typeof result).toBe("string");
			expect(result).toContain("raw test");
			expect(result).toContain("NOTIF");
		});
	});

	describe("alert", () => {
		test("prints to console.warn with ALERT label", () => {
			logger.alert("heads up");
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy.mock.calls[0][0]).toContain("ALERT");
			expect(warnSpy.mock.calls[0][0]).toContain("heads up");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.alert("raw alert", true);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(result).toContain("ALERT");
		});
	});

	describe("error", () => {
		test("prints to console.error with ERROR label", () => {
			logger.error("something broke");
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy.mock.calls[0][0]).toContain("ERROR");
			expect(errorSpy.mock.calls[0][0]).toContain("something broke");
		});

		test("logs the Error object when passed as second arg", () => {
			const err = new Error("db failed");
			logger.error("context ignored", err);
			const output = errorSpy.mock.calls[0][0];
			expect(output).toContain("db failed");
		});

		test("includes sanitized stack trace from Error", () => {
			const err = new Error("oops");
			logger.error("msg", err);
			const output = errorSpy.mock.calls[0][0];
			expect(output).toContain("└─");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.error("raw err", undefined, true);
			expect(errorSpy).not.toHaveBeenCalled();
			expect(result).toContain("ERROR");
		});
	});

	describe("debug", () => {
		test("prints to console.debug with DEBUG label", () => {
			logger.debug("trace info");
			expect(debugSpy).toHaveBeenCalledTimes(1);
			expect(debugSpy.mock.calls[0][0]).toContain("DEBUG");
			expect(debugSpy.mock.calls[0][0]).toContain("trace info");
		});

		test("raw flag returns the string without printing", () => {
			const result = logger.debug("raw debug", true);
			expect(debugSpy).not.toHaveBeenCalled();
			expect(result).toContain("DEBUG");
		});
	});

	describe("timestamp format", () => {
		test("matches [Day HH:mm:ss.ms] pattern", () => {
			const output = logger.notif("ts check", true) as string;
			expect(output).toMatch(/\[.*?\d{2}:\d{2}:\d{2}\.\d{3}]/);
		});

		test("milliseconds are zero-padded to 3 digits", () => {
			const output = logger.notif("pad check", true) as string;
			const match = output.match(/\.(\d{3})]/);
			expect(match).not.toBeNull();
			expect(match?.[1]?.length).toBe(3);
		});
	});

	describe("sanitizeStack", () => {
		test("filters out node_modules frames", () => {
			const err = new Error("msg");
			err.stack = `Error: msg
    at Object.<anonymous> (/project/index.ts:10:5)
    at Module._compile (node_modules/module.js:1:1)`;
			const output = logger.error(err, undefined, true) as string;
			expect(output).toContain("index.ts");
			expect(output).not.toContain("node_modules");
		});

		test("normalizes backslashes to forward slashes", () => {
			const err = new Error("msg");
			err.stack = `Error: msg
    at fn (C:\\Users\\dev\\project\\file.ts:5:3)`;
			const output = logger.error(err, undefined, true) as string;
			expect(output).not.toContain("\\");
		});

		test("formats line and column as (L# C#)", () => {
			const err = new Error("msg");
			err.stack = `Error: msg
    at myFunc (/project/src/app.ts:42:7)`;
			const output = logger.error(err, undefined, true) as string;
			expect(output).toContain("(L42 C7)");
		});

		test("handles stack frames without function names", () => {
			const err = new Error("msg");
			err.stack = `Error: msg
    at /project/src/index.ts:1:1`;
			const output = logger.error(err, undefined, true) as string;
			expect(output).toContain("(L1 C1)");
		});
	});

	describe("divider", () => {
		test("prints text surrounded by dash lines", () => {
			logger.divider("SECTION");
			expect(logSpy).toHaveBeenCalledTimes(1);
			const output = logSpy.mock.calls[0][0];
			expect(output).toContain("SECTION");
			expect(output).toContain("─");
		});

		test("trims whitespace from text", () => {
			logger.divider("  PADDED  ");
			const output = logSpy.mock.calls[0][0];
			expect(output).toContain("PADDED");
		});

		test("handles empty string", () => {
			logger.divider("");
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy.mock.calls[0][0]).toContain("─");
		});
	});

	describe("non-string messages", () => {
		test("numbers are stringified", () => {
			const output = logger.notif(42, true) as string;
			expect(output).toContain("42");
		});

		test("objects are stringified", () => {
			const output = logger.notif({ key: "val" }, true) as string;
			expect(output).toContain("[object Object]");
		});

		test("null and undefined are stringified", () => {
			expect(logger.notif(null, true)).toContain("null");
			expect(logger.notif(undefined, true)).toContain("undefined");
		});
	});
});
