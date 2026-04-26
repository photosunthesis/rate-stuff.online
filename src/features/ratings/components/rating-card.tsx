import { memo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { RatingListItem } from "~/features/ratings/types/display";
import { Avatar } from "~/shared/components/ui/avatar";
import { VoteSection } from "~/features/ratings/components/vote-section";
import { ImageGrid } from "~/shared/components/ui/image-grid";
import { RichTextRenderer } from "~/shared/components/ui/rich-text-renderer";
import { useAuthModal } from "~/features/auth/components/auth-modal-provider";
import { formatCompactNumber } from "~/shared/lib/format";
import { MessageSquare } from "lucide-react";
import { TimeAgo } from "~/shared/components/ui/time-ago";
import { useUmami } from "@danielgtmn/umami-react";
import { RatingEmoji } from "~/shared/components/ui/rating-emoji";
import { m } from "~/paraglide/messages";

interface RatingCardProps {
	rating: RatingListItem;
	noIndent?: boolean;
	isAuthenticated?: boolean;
}

export const RatingCard = memo(function RatingCard({
	rating,
	noIndent,
	isAuthenticated = false,
}: RatingCardProps) {
	const navigate = useNavigate();
	const { openAuthModal } = useAuthModal();
	const image = rating.user?.image ?? null;
	const usernameHandle = rating.user?.username ?? "unknown";
	const name = rating.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;

	const umami = useUmami();

	const parsedImages = rating.signedImages;

	const parsedTags: string[] = Array.isArray(rating.tags) ? rating.tags : [];

	return (
		// biome-ignore lint/a11y/useSemanticElements: <div> with role="link" for card clickable area
		<div
			className="block cursor-pointer p-4"
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
			<div className="flex items-start gap-3">
				<Avatar
					src={image ?? null}
					alt={displayText}
					size="sm"
					className="shrink-0"
					username={rating.user?.username ?? undefined}
				/>
				<div className="flex-1 min-w-0">
					<div className="text-base leading-normal py-1.5">
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
							<span className="font-medium text-neutral-300">
								{displayText}
							</span>
						)}
						<span className="text-neutral-400">{m.rating_card_rated()}</span>
						<Link
							to="/stuff/$stuffSlug"
							params={{ stuffSlug: rating.stuff.slug }}
							className="text-white hover:underline font-medium"
							onClick={(e) => e.stopPropagation()}
						>
							{rating.stuff.name}
						</Link>
						<span className="text-neutral-400"> • </span>
						<TimeAgo date={rating.createdAt} className="text-neutral-400" />
						{rating.updatedAt &&
							new Date(rating.updatedAt).getTime() >
								new Date(rating.createdAt).getTime() + 1000 && (
								<span className="text-neutral-400">
									{m.rating_card_edited()}
								</span>
							)}
					</div>
				</div>
			</div>

			<div className="flex items-baseline gap-2 mb-3">
				<h3
					className={`text-2xl md:text-3xl font-semibold text-white ${
						noIndent ? "" : "ml-11"
					}`}
				>
					<Link
						to="/rating/$ratingId"
						params={{ ratingId: rating.id }}
						className="hover:underline text-white"
						onClick={(e) => e.stopPropagation()}
					>
						{rating.score}/10 <RatingEmoji score={rating.score} />
					</Link>
				</h3>
			</div>

			{parsedImages && parsedImages.length > 0 && (
				<ImageGrid
					images={parsedImages}
					alt="Rating"
					maxImages={3}
					className={`${noIndent ? "" : "ml-11"} mb-3`}
				/>
			)}

			{rating.contentPreview && (
				<div className={`${noIndent ? "" : "ml-11"} mb-3`}>
					<div className="text-slate-200 text-base leading-normal line-clamp-4">
						<RichTextRenderer
							content={rating.contentPreview}
							className="[&_p]:inline [&_p]:!m-0 [&_p]:after:content-['_'] [&_br]:hidden"
						/>
					</div>
				</div>
			)}

			{parsedTags && parsedTags.length > 0 && (
				<div className={`flex flex-wrap gap-2 mb-3 ${noIndent ? "" : "ml-11"}`}>
					{parsedTags.map((tag: string) =>
						isAuthenticated ? (
							<Link
								key={tag}
								to="/"
								search={{ tag }}
								onClick={(e) => {
									e.stopPropagation();
									if (umami) umami.track("click_tag", { tag, context: "feed" });
								}}
								className="inline-flex items-center pl-1.5 pr-2 py-0.5 bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-sm font-medium transition-colors rounded-full"
							>
								#{tag}
							</Link>
						) : (
							<button
								key={tag}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									openAuthModal();
									if (umami) umami.track("click_tag", { tag, context: "feed" });
								}}
								className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-300 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md cursor-pointer"
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
					className="flex items-center gap-2 text-neutral-300 hover:text-neutral-300 transition-colors group px-3 py-1.5 rounded-full hover:bg-neutral-800/50"
					onClick={(e) => {
						e.stopPropagation();
						navigate({
							to: "/rating/$ratingId",
							params: { ratingId: rating.id },
						});
					}}
				>
					<div className="relative">
						<MessageSquare className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-colors" />
						{rating.commentsCount === 0 && (
							<div className="absolute top-0 right-0 w-1.5 h-1.5 bg-neutral-500 rounded-full border-2 border-neutral-900 translate-x-[2px] -translate-y-[2px] opacity-0" />
						)}
					</div>
					{rating.commentsCount > 0 && (
						<span className="text-base font-semibold text-neutral-400 group-hover:text-neutral-300 transition-colors">
							{formatCompactNumber(rating.commentsCount)}
						</span>
					)}
				</button>
			</div>
		</div>
	);
});
