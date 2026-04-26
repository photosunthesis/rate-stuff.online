const getRatingEmoji = (rating: number) => {
	if (rating >= 9.5) return "🤩";
	if (rating >= 9) return "😍";
	if (rating >= 8) return "🥰";
	if (rating >= 7) return "😄";
	if (rating >= 6) return "🙂";
	if (rating >= 5) return "🤔";
	if (rating >= 3) return "🫢";
	return "😑";
};

interface RatingEmojiProps {
	score: number;
	className?: string;
}

export function RatingEmoji({ score, className }: RatingEmojiProps) {
	return (
		<span
			className={`grayscale-[0.2] select-none${className ? ` ${className}` : ""}`}
		>
			{getRatingEmoji(score)}
		</span>
	);
}
