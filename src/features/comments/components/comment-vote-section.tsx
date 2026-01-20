import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { useVoteComment } from "../queries";
import { formatCompactNumber } from "~/utils/numbers";
import { AuthModal } from "~/features/auth/components/auth-modal";

interface CommentVoteSectionProps {
	commentId: string;
	initialUpvotes: number;
	initialDownvotes: number;
	initialUserVote: "up" | "down" | null;
	isOwner: boolean;
	isAuthenticated?: boolean;
	className?: string;
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
	const hoverStyles =
		type === "up" ? "hover:text-emerald-300" : "hover:text-neutral-300";

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				if (!disabled) onClick();
			}}
			disabled={disabled}
			className={`group flex items-center justify-center p-1.5 rounded-full transition-all ${
				disabled
					? "cursor-not-allowed"
					: "cursor-pointer hover:bg-neutral-800/50"
			}`}
		>
			<Icon
				className={`w-5 h-5 transition-all ${
					isActive
						? `${activeColor} fill-current`
						: `text-neutral-500 ${!disabled && hoverStyles}`
				}`}
				strokeWidth={1.5}
			/>
		</button>
	);
}

export function CommentVoteSection({
	commentId,
	initialUpvotes,
	initialDownvotes,
	initialUserVote,
	isOwner,
	isAuthenticated = false,
	className = "",
}: CommentVoteSectionProps) {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const { mutate: vote } = useVoteComment();

	// Local state for optimistic updates
	const [userVote, setUserVote] = useState(initialUserVote);
	const [voteScore, setVoteScore] = useState(initialUpvotes - initialDownvotes);

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
		else if (currentVote === "down") newScore++;

		if (newVote === "up") newScore++;
		else if (newVote === "down") newScore--;

		// Apply optimistic update
		setUserVote(newVote === "none" ? null : newVote);
		setVoteScore(newScore);

		// Fire in background
		vote({ commentId, type: newVote === "none" ? type : newVote }); // API handles toggle if we send same type?
		// Wait, my API implementation for voteOnComment handles toggling?
		// Let's check api implementation.
		// API impl: if (existingVote.type === type) { remove vote }
		// So if I send 'up' and it is 'up', it removes.
		// So I should send the 'type' that was clicked.
		vote({ commentId, type });
	};

	return (
		<>
			<fieldset
				className={`relative group flex items-center gap-2.5 rounded-full w-fit border-none m-0 p-0 ${className}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				tabIndex={-1}
			>
				<VoteButton
					type="up"
					isActive={userVote === "up"}
					onClick={() => handleVote("up")}
					disabled={isOwner}
				/>
				<span className="text-sm font-semibold min-w-[1.5ch] text-center text-neutral-500">
					{formatCompactNumber(voteScore)}
				</span>
				<VoteButton
					type="down"
					isActive={userVote === "down"}
					onClick={() => handleVote("down")}
					disabled={isOwner}
				/>
			</fieldset>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
}
