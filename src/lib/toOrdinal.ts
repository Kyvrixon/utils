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

export function toOrdinal(n: number): string {
	return `${n}${suffixes[pr.select(n)]}`;
}
