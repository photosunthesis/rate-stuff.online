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
	disabled?: boolean;
}

function VoteButton({
	type,
	isActive,
	onClick,
	disabled = false,
}: VoteButtonProps) {
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
				if (!disabled) onClick();
			}}
			disabled={disabled}
			className={`group flex items-center justify-center p-1 rounded transition-colors ${
				disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-700/50"
			}`}
		>
			<Icon
				className={`w-5 h-5 transition-colors ${
					isActive
						? `${activeColor} fill-current`
						: `text-neutral-500 ${!disabled && hoverColor}`
				}`}
				strokeWidth={1.5}
			/>
		</button>
	);
}

import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/queries";

export function VoteSection({
	rating,
	isAuthenticated = false,
	className = "",
	onVote,
}: VoteSectionProps) {
	const umami = useUmami();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const { mutate: vote } = useVoteRating();
	const { data: user } = useQuery(authQueryOptions());

	const isOwner = user?.id === rating.userId;

	// Local state for optimistic updates
	const [userVote, setUserVote] = useState(rating.userVote);
	const [voteScore, setVoteScore] = useState(
		rating.upvotesCount - rating.downvotesCount,
	);

	const handleVote = (type: "up" | "down") => {
		if (isOwner) return;

		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		const currentVote = userVote;
		let newVote: "up" | "down" | "none" = type;

		if (currentVote === type) {
			newVote = "none";
		}

		// Calculate new score locally
		let newScore = voteScore;
		if (currentVote === "up") newScore--;
		else if (currentVote === "down") newScore++; // Removing a downvote adds 1 to score

		if (newVote === "up") newScore++;
		else if (newVote === "down") newScore--;

		// Apply optimistic update
		setUserVote(newVote === "none" ? null : newVote);
		setVoteScore(newScore);

		// Fire in background
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

	const voteColor =
		userVote === "up"
			? "text-emerald-400"
			: userVote === "down"
				? "text-neutral-200"
				: "text-neutral-400";

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: interaction mainly for stopping propagation */}
			<div
				className={`relative group flex items-center gap-1.5 rounded-lg py-1 w-fit ${className}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<VoteButton
					type="up"
					isActive={userVote === "up"}
					onClick={() => handleVote("up")}
					disabled={isOwner}
				/>
				<span
					className={`text-sm font-bold min-w-[1.5ch] text-center ${voteColor}`}
				>
					{formatCompactNumber(voteScore)}
				</span>
				<VoteButton
					type="down"
					isActive={userVote === "down"}
					onClick={() => handleVote("down")}
					disabled={isOwner}
				/>
			</div>
			{isOwner && (
				<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
					You cannot vote on your own rating
				</div>
			)}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
}
