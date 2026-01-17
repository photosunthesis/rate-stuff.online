import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { useVoteRating } from "~/features/vote-rating/queries";
import { formatCompactNumber } from "~/utils/numbers";
import { useUmami } from "@danielgtmn/umami-react";
import { AuthModal } from "~/features/auth/components/auth-modal";
import type { RatingWithRelations } from "~/features/display-ratings/types";

interface VoteSectionProps {
	rating: RatingWithRelations;
	isAuthenticated?: boolean;
	className?: string;
	onVote?: () => void;
}

interface VoteButtonProps {
	type: "up" | "down";
	isActive: boolean;
	onClick: () => void;
}

function VoteButton({ type, isActive, onClick }: VoteButtonProps) {
	const Icon = type === "up" ? ArrowBigUp : ArrowBigDown;
	const activeColor = type === "up" ? "text-emerald-400" : "text-neutral-200";
	const hoverColor =
		type === "up"
			? "group-hover:text-emerald-300"
			: "group-hover:text-neutral-300";

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			className="group flex items-center justify-center p-1 rounded hover:bg-neutral-700/50 transition-colors"
		>
			<Icon
				className={`w-5 h-5 transition-colors ${
					isActive
						? `${activeColor} fill-current`
						: `text-neutral-500 ${hoverColor}`
				}`}
				strokeWidth={1.5}
			/>
		</button>
	);
}

export function VoteSection({
	rating,
	isAuthenticated = false,
	className = "",
	onVote,
}: VoteSectionProps) {
	const umami = useUmami();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const { mutate: vote } = useVoteRating();

	const handleVote = (type: "up" | "down") => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		const currentVote = rating.userVote;
		let newVote: "up" | "down" | "none" = type;

		if (currentVote === type) {
			newVote = "none";
		}

		vote({ ratingId: rating.id, vote: newVote });

		if (onVote) {
			onVote();
		}

		if (umami) {
			umami.track("vote", {
				type: newVote,
				ratingId: rating.id,
			});
		}
	};

	const voteScore = rating.upvotesCount - rating.downvotesCount;
	const voteColor =
		rating.userVote === "up"
			? "text-emerald-400"
			: rating.userVote === "down"
				? "text-neutral-200"
				: "text-neutral-400";

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: interaction mainly for stopping propagation */}
			<div
				className={`flex items-center gap-1.5 rounded-lg py-1 w-fit ${className}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<VoteButton
					type="up"
					isActive={rating.userVote === "up"}
					onClick={() => handleVote("up")}
				/>
				<span
					className={`text-sm font-bold min-w-[1.5ch] text-center ${voteColor}`}
				>
					{formatCompactNumber(voteScore)}
				</span>
				<VoteButton
					type="down"
					isActive={rating.userVote === "down"}
					onClick={() => handleVote("down")}
				/>
			</div>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
}
