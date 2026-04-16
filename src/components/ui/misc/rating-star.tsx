import { useId } from "react";

interface RatingStarIconProps {
	score: number; // 1–10
	size?: number | string;
	className?: string;
}

export function RatingStarIcon({
	score,
	size = "1em",
	className,
}: RatingStarIconProps) {
	const rawId = useId();
	const id = rawId.replace(/:/g, "");

	// Non-linear fill so the star reads more intuitively:
	//   score 1    : stays minimal (~10%) — lowest score, barely any fill
	//   scores 2–3 : ease-out boost so there's clearly visible fill
	//   scores 4–9 : ease-in compression so there's always visible empty space
	//   score 10   : always completely full
	const raw = Math.min(Math.max(score / 10, 0), 1);
	let fillPercent: number;
	if (raw >= 1) {
		fillPercent = 1;
	} else if (raw <= 0.1) {
		// Score 1 — keep linear, barely filled
		fillPercent = raw;
	} else if (raw <= 0.4) {
		// Scores 1–4 — ease-out: boost low scores so the fill is visible
		const t = (raw - 0.1) / 0.3; // normalize [0.1, 0.4] → [0, 1]
		fillPercent = 0.1 + t ** 0.5 * 0.3;
	} else {
		// Scores 4–9 — ease-in: compress so there's always noticeable empty space
		const t = (raw - 0.4) / 0.6; // normalize [0.4, 1) → [0, 1)
		fillPercent = 0.4 + t ** 1.5 * 0.6;
	}

	const clipY = 24 * (1 - fillPercent);
	const clipHeight = 24 * fillPercent;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			aria-hidden="true"
			className={className}
			style={{ display: "block", flexShrink: 0 }}
		>
			<defs>
				<clipPath id={id}>
					<rect x="0" y={clipY} width="24" height={clipHeight} />
				</clipPath>
			</defs>
			{/* Outline — always yellow */}
			<polygon
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				fill="none"
				stroke="#10b981"
				strokeWidth="0.75"
				strokeLinejoin="round"
			/>
			{/* Fill — revealed from bottom to top */}
			<polygon
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				fill="#10b981"
				clipPath={`url(#${id})`}
			/>
		</svg>
	);
}
