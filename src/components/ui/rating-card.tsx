import { useState, memo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { RatingWithRelations } from "../../features/display-ratings/types";
import { Avatar } from "~/components/ui/avatar";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { useVoteRating } from "~/features/vote-rating/queries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AuthModal } from "~/features/auth/components/auth-modal";

import { getTimeAgo } from "~/utils/datetime";
import { formatCompactNumber } from "~/utils/numbers";
import { useUmami } from "@danielgtmn/umami-react";

interface RatingCardProps {
	rating: RatingWithRelations;
	hideAvatar?: boolean;
	noIndent?: boolean;
	isAuthenticated?: boolean;
	variant?: "default" | "userProfile";
}

interface MarkdownContentProps {
	content: string;
	inlineParagraphs?: boolean;
}

const MarkdownContent = ({
	content,
	inlineParagraphs,
}: MarkdownContentProps) => {
	const safe = content.replace(/<[^>]*>/g, "");

	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ children }) =>
					inlineParagraphs ? <span>{children}</span> : <p>{children}</p>,
				em: ({ children }) => <em className="italic">{children}</em>,
				strong: ({ children }) => (
					<strong className="font-bold">{children}</strong>
				),
				del: ({ children }) => <del className="line-through">{children}</del>,
				u: ({ children }) => <u className="underline">{children}</u>,
				a: ({ href, children }) => (
					<a
						href={href}
						className="text-emerald-400 underline hover:text-emerald-300"
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
					>
						{children}
					</a>
				),
			}}
		>
			{safe}
		</ReactMarkdown>
	);
};

const truncateMarkdown = (content: string, limit: number): string => {
	if (content.length <= limit) return content;

	// Slice the string
	let truncated = content.slice(0, limit);

	// Try to avoid cutting in the middle of a word
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > limit * 0.8) {
		truncated = truncated.slice(0, lastSpace);
	}

	// Close basic markdown tags to prevent broken rendering
	const stars = (truncated.match(/\*/g) || []).length;
	const doubleStars = (truncated.match(/\*\*/g) || []).length;
	const singleStars = stars - doubleStars * 2;

	const underscores = (truncated.match(/_/g) || []).length;
	const doubleUnderscores = (truncated.match(/__/g) || []).length;
	const singleUnderscores = underscores - doubleUnderscores * 2;

	const codeCount = (truncated.match(/`/g) || []).length;
	const strikeCount = (truncated.match(/~~/g) || []).length;

	let suffix = "";
	if (codeCount % 2 !== 0) suffix += "`";
	if (doubleStars % 2 !== 0) suffix += "**";
	if (singleStars % 2 !== 0) suffix += "*";
	if (doubleUnderscores % 2 !== 0) suffix += "__";
	if (singleUnderscores % 2 !== 0) suffix += "_";
	if (strikeCount % 2 !== 0) suffix += "~~";

	return `${truncated + suffix}...`;
};

export const RatingCard = memo(function RatingCard({
	rating,
	hideAvatar,
	noIndent,
	isAuthenticated = false,
	variant = "default",
}: RatingCardProps) {
	const umami = useUmami();
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const maxContentLength = 256;
	const shouldTruncate = rating.content.length > maxContentLength;
	const image = rating.user?.image ?? null;
	const usernameHandle = rating.user?.username ?? "unknown";
	const name = rating.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const timeAgo = getTimeAgo(rating.createdAt);

	let parsedImages: string[] = [];
	if (typeof rating.images === "string") {
		try {
			parsedImages = JSON.parse(rating.images);
		} catch {
			parsedImages = [];
		}
	} else if (Array.isArray(rating.images)) {
		parsedImages = rating.images;
	}

	const parsedTags: string[] = Array.isArray(rating.tags) ? rating.tags : [];
	const { mutate: vote } = useVoteRating();

	const handleVote = (type: "up" | "down") => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true);
			return;
		}

		// We rely on React Query invalidation for UI updates for simplicity and safety.

		const currentVote = rating.userVote;
		let newVote: "up" | "down" | "none" = type;

		if (currentVote === type) {
			newVote = "none";
		}

		vote({ ratingId: rating.id, vote: newVote });

		// Track vote
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
		// biome-ignore lint/a11y/useSemanticElements: <div> with role="link" for card clickable area
		<div
			className={`block cursor-pointer ${
				variant === "userProfile"
					? "hover:bg-neutral-800/50 transition-colors px-5 pt-3 pb-2"
					: "p-4"
			}`}
			role="link"
			tabIndex={0}
			onClick={() =>
				navigate({
					to: "/rating/$ratingId",
					params: { ratingId: rating.id },
				})
			}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					navigate({
						to: "/rating/$ratingId",
						params: { ratingId: rating.id },
					});
				}
			}}
		>
			{/* Header */}
			{variant === "default" ? (
				<div className="flex items-center gap-3">
					{!hideAvatar && (
						<Avatar
							src={image ?? null}
							alt={displayText}
							size="sm"
							className="shrink-0"
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1 flex-wrap text-sm">
							{rating.user ? (
								<Link
									to="/user/$username"
									params={{ username: usernameHandle }}
									className="font-medium text-white hover:underline"
									onClick={(e) => e.stopPropagation()}
								>
									{displayText}
								</Link>
							) : (
								<span className="font-medium text-neutral-400">
									{displayText}
								</span>
							)}
							<span className="text-neutral-500">rated</span>
							{rating.stuff ? (
								<Link
									to="/stuff/$stuffSlug"
									params={{ stuffSlug: rating.stuff.slug }}
									className="text-white hover:underline font-semibold"
									onClick={(e) => e.stopPropagation()}
								>
									{rating.stuff.name}
								</Link>
							) : (
								<span className="text-neutral-400 font-semibold">
									Unknown Item
								</span>
							)}
							<span className="text-neutral-500">•</span>
							<span className="text-neutral-500">{timeAgo}</span>
						</div>
					</div>
				</div>
			) : (
				// User Profile Header
				<div className="flex items-center gap-1 text-sm text-neutral-500 mb-2">
					<span className="text-neutral-400">A rating of</span>
					{rating.stuff ? (
						<Link
							to="/stuff/$stuffSlug"
							params={{ stuffSlug: rating.stuff.slug }}
							className="text-white hover:underline font-semibold"
							onClick={(e) => e.stopPropagation()}
						>
							{rating.stuff.name}
						</Link>
					) : (
						<span className="text-neutral-400 font-semibold">Unknown Item</span>
					)}
					<span>•</span>
					<span>{timeAgo}</span>
				</div>
			)}

			{/* Rating */}
			<h3
				className={`text-2xl font-semibold text-white mb-2 ${
					noIndent ? "" : "ml-11"
				}`}
			>
				{rating.score}/10
			</h3>

			{/* Images */}
			{parsedImages && parsedImages.length > 0 && (
				<div className={`${noIndent ? "" : "ml-11"} mb-3`}>
					{parsedImages.length === 1 ? (
						<img
							src={parsedImages[0]}
							alt="Rating"
							className="block aspect-video object-cover rounded-xl"
						/>
					) : parsedImages.length === 2 ? (
						<div className="flex gap-2">
							{parsedImages.map((image, idx) => (
								<div
									key={image}
									className="flex-1 aspect-square overflow-hidden"
								>
									<img
										src={image}
										alt="Rating"
										className={
											idx === 0
												? "w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm"
												: "w-full h-full object-cover object-center rounded-xl rounded-tl-sm rounded-bl-sm"
										}
									/>
								</div>
							))}
						</div>
					) : parsedImages.length === 3 ? (
						<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-2">
							{/* Left: large image spanning both rows */}
							<div className="row-span-2 h-full overflow-hidden">
								<img
									src={parsedImages[0]}
									alt="Rating"
									className="w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm"
								/>
							</div>
							{/* Right: two stacked images (equal height, center-cropped) */}
							<div className="h-full overflow-hidden">
								<img
									src={parsedImages[1]}
									alt="Rating"
									className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm"
								/>
							</div>
							<div className="h-full overflow-hidden">
								<img
									src={parsedImages[2]}
									alt="Rating"
									className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm"
								/>
							</div>
						</div>
					) : (
						/* 4 or more: show a 2x2 grid using first 4 images */
						<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-2">
							{parsedImages.slice(0, 4).map((image, idx) => {
								let cornerClass = "rounded-xl";
								switch (idx) {
									case 0:
										cornerClass = "rounded-xl rounded-br-sm"; // top-left: inner bottom-right small
										break;
									case 1:
										cornerClass = "rounded-xl rounded-bl-sm"; // top-right: inner bottom-left small
										break;
									case 2:
										cornerClass = "rounded-xl rounded-tr-sm"; // bottom-left: inner top-right small
										break;
									case 3:
										cornerClass = "rounded-xl rounded-tl-sm"; // bottom-right: inner top-left small
										break;
								}
								return (
									<div key={image} className="w-full h-full overflow-hidden">
										<img
											src={image}
											alt="Rating"
											className={`w-full h-full object-cover object-center ${cornerClass}`}
										/>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Content */}
			<div className={`${noIndent ? "" : "ml-11"} mb-3`}>
				{shouldTruncate && !isExpanded ? (
					<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mt-3 [&_p]:mb-0 [&_p]:leading-normal [&_p:last-child]:inline">
						<MarkdownContent
							content={truncateMarkdown(rating.content, maxContentLength)}
							inlineParagraphs={true}
						/>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setIsExpanded(true);
							}}
							className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
						>
							See more
						</button>
					</div>
				) : (
					<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mt-3 [&_p]:mb-0 [&_p]:leading-normal [&_p:last-child]:inline">
						<MarkdownContent content={rating.content} />
						{shouldTruncate && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(false);
								}}
								className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer"
							>
								See less
							</button>
						)}
					</div>
				)}
			</div>

			{/* Tags */}
			{parsedTags && parsedTags.length > 0 && (
				<div className={`flex flex-wrap gap-2 mb-3 ${noIndent ? "" : "ml-11"}`}>
					{parsedTags.map((tag: string) =>
						isAuthenticated ? (
							<Link
								key={tag}
								to="/"
								search={{ tag }}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
							>
								#{tag}
							</Link>
						) : (
							<button
								key={tag}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsAuthModalOpen(true);
								}}
								className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md cursor-pointer"
							>
								#{tag}
							</button>
						),
					)}
				</div>
			)}

			{/* Votes */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: interaction mainly for stopping propagation */}
			<div
				className={`flex items-center gap-1.5 rounded-lg py-1 w-fit ${
					noIndent ? "" : "ml-11"
				}`}
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

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</div>
	);
});

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
