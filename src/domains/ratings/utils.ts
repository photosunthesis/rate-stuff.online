export const getRatingEmoji = (rating: number) => {
	if (rating >= 9.5) return "🤩";
	if (rating >= 9) return "😍";
	if (rating >= 8) return "🥰";
	if (rating >= 7) return "😄";
	if (rating >= 6) return "🙂";
	if (rating >= 5) return "🤔";
	if (rating >= 3) return "🫢";
	return "😑";
};
