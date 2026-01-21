import { useState, memo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { RatingWithRelations } from "../../features/display-ratings/types";
import { Avatar } from "~/components/ui/avatar";
import { VoteSection } from "~/components/ui/vote-section";
import { Image } from "~/components/ui/image";
import { RichTextRenderer } from "~/components/ui/rich-text-renderer";
import { getPlainTextFromContent } from "~/utils/rich-text";
import { AuthModal } from "~/features/auth/components/auth-modal";
import { formatCompactNumber } from "~/utils/numbers";
import { MessageSquare } from "lucide-react";
import { getTimeAgo } from "~/utils/datetime";

interface RatingCardProps {
	rating: RatingWithRelations;
	hideAvatar?: boolean;
	noIndent?: boolean;
	isAuthenticated?: boolean;
	variant?: "default" | "userProfile";
}

export const RatingCard = memo(function RatingCard({
	rating,
	hideAvatar,
	noIndent,
	isAuthenticated = false,
	variant = "default",
}: RatingCardProps) {
	const navigate = useNavigate();
	const isAuthModalOpenState = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = isAuthModalOpenState;
	const plainText = getPlainTextFromContent(rating.content);
	const shouldTruncate =
		plainText.length > 300 || plainText.split("\n").length > 4;
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
			{variant === "default" ? (
				<div className="flex items-start gap-3">
					{!hideAvatar && (
						<Avatar
							src={image ?? null}
							alt={displayText}
							size="sm"
							className="shrink-0"
							username={rating.user?.username ?? undefined}
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="text-sm leading-normal py-1.5">
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
							<span className="text-neutral-500"> rated </span>
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
							<span className="text-neutral-500"> • </span>
							<span className="text-neutral-500">{timeAgo}</span>
							{rating.updatedAt &&
								new Date(rating.updatedAt).getTime() >
									new Date(rating.createdAt).getTime() + 1000 && (
									<span className="text-neutral-500"> (edited)</span>
								)}
						</div>
					</div>
				</div>
			) : (
				<div className="text-sm text-neutral-500 mb-2 leading-relaxed">
					<span className="text-neutral-400">A rating of</span>{" "}
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
					)}{" "}
					<span>•</span> <span>{timeAgo}</span>
					{rating.updatedAt &&
						new Date(rating.updatedAt).getTime() >
							new Date(rating.createdAt).getTime() + 1000 && (
							<span> (edited)</span>
						)}
				</div>
			)}

			<div className="flex items-baseline gap-2 mb-2">
				<h3
					className={`text-2xl font-semibold text-white ${
						noIndent ? "" : "ml-11"
					}`}
				>
					{rating.score}/10
				</h3>
			</div>

			{parsedImages && parsedImages.length > 0 && (
				<div className={`${noIndent ? "" : "ml-11"} mb-3`}>
					{parsedImages.length === 1 ? (
						<Image
							src={parsedImages[0]}
							alt="Rating"
							variant="card"
							className="block aspect-video object-cover rounded-xl"
						/>
					) : parsedImages.length === 2 ? (
						<div className="flex gap-1.5">
							{parsedImages.map((image, idx) => (
								<div
									key={image}
									className="flex-1 overflow-hidden"
									style={{ aspectRatio: "1 / 1" }}
								>
									<Image
										src={image}
										alt="Rating"
										variant="card"
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
						<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-1.5">
							<div
								className="row-span-2 overflow-hidden"
								style={{ aspectRatio: "1 / 1" }}
							>
								<Image
									src={parsedImages[0]}
									alt="Rating"
									variant="card"
									className="w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm"
								/>
							</div>

							<div className="overflow-hidden" style={{ aspectRatio: "2 / 1" }}>
								<Image
									src={parsedImages[1]}
									alt="Rating"
									variant="card"
									className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm"
								/>
							</div>
							<div className="overflow-hidden" style={{ aspectRatio: "2 / 1" }}>
								<Image
									src={parsedImages[2]}
									alt="Rating"
									variant="card"
									className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm"
								/>
							</div>
						</div>
					) : (
						<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-1.5">
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
									<div
										key={image}
										className="overflow-hidden"
										style={{ aspectRatio: "1 / 1" }}
									>
										<Image
											src={image}
											alt="Rating"
											variant="card"
											className={`w-full h-full object-cover object-center ${cornerClass}`}
										/>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			<div className={`${noIndent ? "" : "ml-11"} mb-3`}>
				<div className="text-slate-200 text-sm leading-normal line-clamp-4">
					<RichTextRenderer
						content={rating.content}
						className="[&_p]:mt-3 [&_p]:last:inline [&_p]:first:mt-0"
					/>
				</div>
				{shouldTruncate && (
					<span className="text-neutral-500 text-sm font-semibold hover:text-neutral-400">
						See more
					</span>
				)}
			</div>

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

			<div className={`${noIndent ? "" : "ml-11"} flex items-center gap-3`}>
				<VoteSection rating={rating} isAuthenticated={isAuthenticated} />

				<button
					type="button"
					className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors group px-3 py-1.5 rounded-full hover:bg-neutral-800/50"
					onClick={(e) => {
						e.stopPropagation();
						navigate({
							to: "/rating/$ratingId",
							params: { ratingId: rating.id },
						});
					}}
				>
					<div className="relative">
						<MessageSquare className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
						{rating.commentsCount === 0 && (
							<div className="absolute top-0 right-0 w-1.5 h-1.5 bg-neutral-500 rounded-full border-2 border-neutral-900 translate-x-[2px] -translate-y-[2px] opacity-0" />
						)}
					</div>
					{rating.commentsCount > 0 && (
						<span className="text-sm font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors">
							{formatCompactNumber(rating.commentsCount)}
						</span>
					)}
				</button>
			</div>

			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</div>
	);
});
