import { expect, test } from "bun:test";
import { toOrdinal } from "../src";

test("handles basic units", async () => {
	expect(toOrdinal(1)).toBe("1st");
	expect(toOrdinal(2)).toBe("2nd");
	expect(toOrdinal(3)).toBe("3rd");
	expect(toOrdinal(4)).toBe("4th");
	expect(toOrdinal(9)).toBe("9th");
});

test("handles teens (the 11, 12, 13 rule)", () => {
	expect(toOrdinal(11)).toBe("11th");
	expect(toOrdinal(12)).toBe("12th");
	expect(toOrdinal(13)).toBe("13th");
});

test("handles larger numbers", () => {
	expect(toOrdinal(21)).toBe("21st");
	expect(toOrdinal(22)).toBe("22nd");
	expect(toOrdinal(23)).toBe("23rd");
	expect(toOrdinal(100)).toBe("100th");
	expect(toOrdinal(1001)).toBe("1001st");
});

test("handles zero and negatives", () => {
	expect(toOrdinal(0)).toBe("0th");
	expect(toOrdinal(-1)).toBe("-1st");
	expect(toOrdinal(-0)).toBe("0th");
});

test("handles infinities", () => {
	expect(toOrdinal(Infinity)).toBe("Infinityth");
	expect(toOrdinal(-Infinity)).toBe("-Infinityth");
});
