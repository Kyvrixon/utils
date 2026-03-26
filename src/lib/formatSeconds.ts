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

/**
 * Calendar-aware duration formatter. Converts raw seconds into a human-readable string.
 * @param seconds - The duration in seconds to format.
 * @param options - Formatting options.
 * @param options.format - `"long"` (default) for full words, `"short"` for abbreviated units.
 * @param options.onlyUnits - Restrict output to specific time units.
 * @param options.includeZeroUnits - Include units with a value of zero.
 * @param options.customFormatter - Override per-unit rendering.
 * @returns A formatted duration string (e.g. `"2 hours and 30 minutes"` or `"2h 30m"`).
 */
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

	if (!Number.isFinite(seconds)) return format === "short" ? "0s" : "0 seconds";

	let totalMs = Math.max(0, Math.round(seconds * 1000));
	const unitsToDisplay = onlyUnits.length
		? ALL_UNITS_ORDER.filter((u) => onlyUnits.includes(u))
		: ALL_UNITS_ORDER;

	const diff: Partial<Record<TimeUnitTypes, number>> = {};
	const now = new Date();
	const end = new Date(now.getTime() + totalMs);

	if (unitsToDisplay.includes("y")) {
		let y = end.getFullYear() - now.getFullYear();
		const afterYears = new Date(now);
		afterYears.setFullYear(now.getFullYear() + y);
		if (afterYears > end) y--;
		diff.y = Math.max(0, y);
		totalMs -=
			new Date(now).setFullYear(now.getFullYear() + diff.y) - now.getTime();
	}

	if (unitsToDisplay.includes("mo")) {
		const startTotalMonths = now.getFullYear() * 12 + now.getMonth();
		const endTotalMonths = end.getFullYear() * 12 + end.getMonth();
		let mo = endTotalMonths - startTotalMonths;
		if (diff.y !== undefined) mo -= diff.y * 12;

		const afterYearsAndMonths = new Date(now);
		afterYearsAndMonths.setFullYear(now.getFullYear() + (diff.y ?? 0));
		afterYearsAndMonths.setMonth(now.getMonth() + mo);
		if (afterYearsAndMonths > end) mo--;

		diff.mo = Math.max(0, mo);
		const jumpDate = new Date(now);
		jumpDate.setFullYear(now.getFullYear() + (diff.y ?? 0));
		jumpDate.setMonth(now.getMonth() + diff.mo);
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
