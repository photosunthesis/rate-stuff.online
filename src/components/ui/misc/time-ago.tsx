import { useEffect, useState } from "react";
import { getTimeAgo } from "~/utils/datetime";

interface TimeAgoProps {
	date: Date | string | number;
	className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
	const [timeString, setTimeString] = useState<string | null>(null);

	useEffect(() => {
		setTimeString(getTimeAgo(date));
	}, [date]);

	if (timeString === null) {
		return (
			<span className={className} style={{ opacity: 0 }}>
				Now
			</span>
		);
	}

	return <span className={className}>{timeString}</span>;
}
