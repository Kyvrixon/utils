import { expect, test } from "bun:test";
import { formatSeconds } from "../src/index";

test("formats basic seconds to long format", () => {
	expect(formatSeconds(3661)).toBe("1 hour, 1 minute and 1 second");
});

test("formats to short format", () => {
	expect(formatSeconds(3661, { format: "short" })).toBe("1h 1m 1s");
});

test("handles pluralization", () => {
	expect(formatSeconds(7200)).toBe("2 hours");
});

test("filters units using onlyUnits", () => {
	const result = formatSeconds(3661, { onlyUnits: ["h", "m"] });
	expect(result).toBe("1 hour and 1 minute");
});

test("handles calendar-aware months", () => {
	// 31 days in seconds (January length)
	expect(formatSeconds(2678400, { onlyUnits: ["mo", "d"] })).toContain(
		"1 month",
	);
});

test("includes zero units when requested", () => {
	expect(
		formatSeconds(60, {
			includeZeroUnits: true,
			onlyUnits: ["m", "s"],
		}),
	).toBe("1 minute and 0 seconds");
});

test("applies custom formatter", () => {
	expect(
		formatSeconds(60, {
			customFormatter: (unit, value) => `${value}${unit.toUpperCase()}`,
		}),
	).toBe("1M");
});

test("handles zero seconds input", () => {
	expect(formatSeconds(0)).toBe("0 seconds");
	expect(formatSeconds(0, { format: "short" })).toBe("0s");
});

test("handles large durations (years)", () => {
	expect(formatSeconds(31536000)).toContain("1 year");
});

test("onlyUnits with zero values does not show zeros when includeZeroUnits is false", () => {
	const result = formatSeconds(3600, {
		includeZeroUnits: false,
		onlyUnits: ["d", "h", "m", "s"],
		format: "long",
	});
	expect(result).toBe("1 hour");
});

test("onlyUnits with zero values shows zeros when includeZeroUnits is true", () => {
	const result = formatSeconds(3600, {
		includeZeroUnits: true,
		onlyUnits: ["d", "h", "m", "s"],
		format: "long",
	});
	expect(result).toBe("0 days, 1 hour, 0 minutes and 0 seconds");
});
