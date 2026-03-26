const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes: Record<Intl.LDMLPluralRule, string> = {
	one: "st",
	two: "nd",
	few: "rd",
	other: "th",
	// Included for type safety
	zero: "th",
	many: "th",
};

/**
 * Converts a number to its English ordinal string (e.g. 1 → "1st", 12 → "12th").
 * Handles teens, zero, negatives, and infinities.
 * @param n - The number to convert.
 * @returns The number with its ordinal suffix appended.
 */
export function toOrdinal(n: number): string {
	return `${n}${suffixes[pr.select(n)]}`;
}
