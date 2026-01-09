export function getRatingEmoji(rating: number): string {
	const roundedRating = Math.round(rating);

	if (roundedRating >= 10) return "🤩";
	if (roundedRating >= 9) return "😍";
	if (roundedRating >= 8) return "😄";
	if (roundedRating >= 7) return "😊";
	if (roundedRating >= 6) return "🙂";
	if (roundedRating >= 5) return "😑";
	if (roundedRating >= 4) return "😐";
	if (roundedRating >= 3) return "😕";
	if (roundedRating >= 2) return "😞";
	return "😭";
}

export function getTimeAgo(date: Date | string | number): string {
	const now = new Date();

	let dateObj: Date;
	if (date instanceof Date) {
		dateObj = date;
	} else if (typeof date === "string" || typeof date === "number") {
		dateObj = new Date(date);
	} else {
		return "Invalid Date";
	}

	if (!dateObj || Number.isNaN(dateObj.getTime())) {
		return "Invalid Date";
	}

	const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}w`;

	if (dateObj.getFullYear() !== now.getFullYear()) {
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	}

	return dateObj.toLocaleDateString();
}
