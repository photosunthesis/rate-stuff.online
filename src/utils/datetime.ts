export const getTimeAgo = (date: Date | number | string): string => {
	const now = new Date();
	let dateObj: Date;

	if (date instanceof Date) {
		dateObj = date;
	} else if (typeof date === "number") {
		// Distinguish seconds (10-digit) vs milliseconds (13+ digits)
		const ts = date as number;
		dateObj = new Date(ts < 1e12 ? ts * 1000 : ts);
	} else if (typeof date === "string") {
		// If it's an all-digits string, treat like a timestamp
		if (/^\d+$/.test(date)) {
			const num = Number(date);
			dateObj = new Date(num < 1e12 ? num * 1000 : num);
		} else {
			dateObj = new Date(date);
		}
	} else {
		return "Invalid Date";
	}

	if (!dateObj || Number.isNaN(dateObj.getTime())) return "Invalid Date";

	let seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

	// If the date is slightly in the future (clock skew), treat as now
	if (seconds < 0) {
		const futureBy = -seconds;
		if (futureBy < 60) {
			seconds = 0;
		} else if (futureBy < 24 * 60 * 60) {
			seconds = Math.abs(seconds);
		} else {
			return dateObj.toLocaleString();
		}
	}

	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}w ago`;

	if (dateObj.getFullYear() !== now.getFullYear()) {
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	}

	return dateObj.toLocaleDateString();
};
