type TimeUnitTypes = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

const UNITS: Record<
	TimeUnitTypes,
	{ label: string; short: string; ms: number }
> = {
	y: { label: "year", short: "y", ms: 0 },
	mo: { label: "month", short: "mo", ms: 0 },
	w: { label: "week", short: "w", ms: 7 * 24 * 3600 * 1000 },
	d: { label: "day", short: "d", ms: 24 * 3600 * 1000 },
	h: { label: "hour", short: "h", ms: 3600 * 1000 },
	m: { label: "minute", short: "m", ms: 60 * 1000 },
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
 * Format a number to a customisable and readable time string
 * 
 * @param seconds Number in seconds to format
 * @param options Options for formatting
 * @returns string
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
	const includeZeroUnits = options.includeZeroUnits ?? false;
	const onlyUnits = options.onlyUnits ?? [];
	const format = options.format ?? "long";
	const customFormatter = options.customFormatter;

	const totalMs = Math.max(0, Number(seconds) * 1000);
	const unitsToDisplay = ALL_UNITS_ORDER.filter((u) =>
		onlyUnits.length ? onlyUnits.includes(u) : true,
	);

	if (totalMs === 0) {
		const zeroParts: Array<string> = [];
		for (const u of unitsToDisplay) {
			if (format === "short") {
				zeroParts.push(`0${UNITS[u].short}`);
			} else {
				zeroParts.push(`0 ${UNITS[u].label}`);
			}
		}
		return zeroParts.join(format === "short" ? " " : ", ");
	}

	const now = new Date();
	const end = new Date(now.getTime() + totalMs);

	let years = 0;
	if (unitsToDisplay.includes("y") || unitsToDisplay.includes("mo")) {
		years = end.getFullYear() - now.getFullYear();
	}

	let months = 0;
	if (unitsToDisplay.includes("mo")) {
		months = end.getMonth() - now.getMonth();
		if (years < 0) months += 12;
	}

	const remainingMs =
		end.getTime() -
		new Date(
			now.getFullYear() + years,
			now.getMonth() + months,
			now.getDate(),
			now.getHours(),
			now.getMinutes(),
			now.getSeconds(),
			now.getMilliseconds(),
		).getTime();

	const diff: Record<TimeUnitTypes, number> = {
		y: years,
		mo: months,
		w: Math.floor(remainingMs / UNITS.w.ms),
		d: Math.floor((remainingMs % UNITS.w.ms) / UNITS.d.ms),
		h: Math.floor((remainingMs % UNITS.d.ms) / UNITS.h.ms),
		m: Math.floor((remainingMs % UNITS.h.ms) / UNITS.m.ms),
		s: Math.floor((remainingMs % UNITS.m.ms) / UNITS.s.ms),
		ms: remainingMs % 1000,
	};

	const showZeros = includeZeroUnits || onlyUnits.length > 0;

	const parts: Array<string> = [];
	for (const unit of unitsToDisplay) {
		const value = diff[unit] ?? 0;
		if (value || showZeros) {
			let label = "";
			if (format === "short") {
				label = UNITS[unit].short;
			} else {
				if (value === 1) {
					label = UNITS[unit].label;
				} else {
					label = `${UNITS[unit].label}s`;
				}
			}

			if (customFormatter) {
				parts.push(customFormatter(unit, value, label));
			} else {
				if (format === "short") {
					parts.push(`${value}${label}`);
				} else {
					parts.push(`${value} ${label}`);
				}
			}
		}
	}

	if (format === "long" && parts.length > 1) {
		const last = parts.pop();
		return `${parts.join(", ")} and ${last}`;
	}

	return parts.join(format === "short" ? " " : ",");
}
