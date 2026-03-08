type TimeUnitTypes = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

const UNITS: Record<
	TimeUnitTypes,
	{ label: string; short: string; ms: number }
> = {
	y: { label: "year", short: "y", ms: 31536000000 },
	mo: { label: "month", short: "mo", ms: 2628000000 },
	w: { label: "week", short: "w", ms: 604800000 },
	d: { label: "day", short: "d", ms: 86400000 },
	h: { label: "hour", short: "h", ms: 3600000 },
	m: { label: "minute", short: "m", ms: 60000 },
	s: { label: "second", short: "s", ms: 1000 },
	ms: { label: "millisecond", short: "ms", ms: 1 },
};

const ALL_UNITS_ORDER: Array<TimeUnitTypes> = [
	"y",
	"mo",
	"w",
	"d",
	"h",
	"m",
	"s",
	"ms",
];

export function formatSeconds(
	seconds: number,
	options: {
		includeZeroUnits?: boolean;
		onlyUnits?: Array<TimeUnitTypes>;
		format?: "long" | "short";
		customFormatter?: (
			unit: TimeUnitTypes,
			value: number,
			label: string,
		) => string;
	} = {},
): string {
	const {
		includeZeroUnits = false,
		onlyUnits = [],
		format = "long",
		customFormatter,
	} = options;
	let totalMs = Math.max(0, Math.round(seconds * 1000));
	const unitsToDisplay = ALL_UNITS_ORDER.filter((u) =>
		onlyUnits.length ? onlyUnits.includes(u) : true,
	);

	const diff: Partial<Record<TimeUnitTypes, number>> = {};
	const now = new Date();
	const end = new Date(now.getTime() + totalMs);

	if (unitsToDisplay.includes("y")) {
		let y = end.getFullYear() - now.getFullYear();
		const tempDate = new Date(now);
		tempDate.setFullYear(now.getFullYear() + y);
		if (tempDate > end) y--;
		diff.y = y;
		totalMs -= new Date(now).setFullYear(now.getFullYear() + y) - now.getTime();
	}

	if (unitsToDisplay.includes("mo")) {
		const startTotalMonths = now.getFullYear() * 12 + now.getMonth();
		const endTotalMonths = end.getFullYear() * 12 + end.getMonth();
		let mo = endTotalMonths - startTotalMonths;
		if (diff.y) mo -= diff.y * 12;

		const tempDate = new Date(now);
		tempDate.setFullYear(now.getFullYear() + (diff.y || 0));
		tempDate.setMonth(now.getMonth() + mo);
		if (tempDate > end) mo--;

		diff.mo = Math.max(0, mo);
		const jumpDate = new Date(now);
		jumpDate.setFullYear(now.getFullYear() + (diff.y || 0));
		jumpDate.setMonth(now.getMonth() + (diff.mo || 0));
		totalMs = end.getTime() - jumpDate.getTime();
	}

	for (const unit of ["w", "d", "h", "m", "s", "ms"] as const) {
		if (unitsToDisplay.includes(unit)) {
			diff[unit] = Math.floor(totalMs / UNITS[unit].ms);
			totalMs %= UNITS[unit].ms;
		}
	}

	const parts: string[] = [];
	for (const unit of unitsToDisplay) {
		const value = diff[unit] ?? 0;
		if (value > 0 || includeZeroUnits) {
			const label =
				format === "short"
					? UNITS[unit].short
					: value === 1
						? UNITS[unit].label
						: `${UNITS[unit].label}s`;

			parts.push(
				customFormatter
					? customFormatter(unit, value, label)
					: format === "short"
						? `${value}${label}`
						: `${value} ${label}`,
			);
		}
	}

	if (parts.length === 0) return format === "short" ? "0s" : "0 seconds";
	if (format === "long" && parts.length > 1) {
		const last = parts.pop();
		return `${parts.join(", ")} and ${last}`;
	}
	return parts.join(format === "short" ? " " : ", ");
}
