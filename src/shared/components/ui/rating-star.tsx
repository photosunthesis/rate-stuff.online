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

	// Fatter star: outer radius 10, inner radius 5.5 (ratio 0.55), center (12, 12)
	const points =
		"12 2 15.23 7.55 21.51 8.91 17.23 13.70 17.88 20.09 12 17.5 6.12 20.09 6.77 13.70 2.49 8.91 8.77 7.55";

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
			{/* Outline — neutral gray */}
			<polygon
				points={points}
				fill="none"
				stroke="#a3a3a3"
				strokeWidth="1"
				strokeLinejoin="round"
			/>
			{/* Fill — green with matching stroke so it fully covers the gray outline below the waterline */}
			<polygon
				points={points}
				fill="#10b981"
				stroke="#10b981"
				strokeWidth="1"
				strokeLinejoin="round"
				clipPath={`url(#${id})`}
			/>
		</svg>
	);
}
