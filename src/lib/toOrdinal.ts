const suffixes: Record<string, string> = {
	one: "st",
	two: "nd",
	few: "rd",
	other: "th",
};

/**
 * Converts a number to its ordinal value
 * 
 * @param n Number to convert
 * @returns string
 */
export function toOrdinal(n: number): string {
	return `${n}${suffixes[new Intl.PluralRules("en-US", { type: "ordinal" }).select(n)]}`;
}
