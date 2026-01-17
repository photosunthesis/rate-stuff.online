import {
	createFileRoute,
	redirect,
	Link,
	useRouter,
	useCanGoBack,
	notFound,
} from "@tanstack/react-router";
import { NotFound } from "~/components/ui/not-found";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ratingQueryOptions } from "~/features/display-ratings/queries";
import { Lightbox } from "~/components/ui/lightbox";
import { Avatar } from "~/components/ui/avatar";
import type { RatingWithRelations } from "~/features/display-ratings/types";
import { getTimeAgo } from "~/utils/datetime";
import { ArrowLeft, ArrowBigUp, ArrowBigDown } from "lucide-react";
import { MainLayout } from "~/components/layout/main-layout";
import { AuthModal } from "~/features/auth/components/auth-modal";
import { useVoteRating } from "~/features/vote-rating/queries";
import { formatCompactNumber } from "~/utils/numbers";
import { useUmami } from "@danielgtmn/umami-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/queries";
import { mapToCurrentUser } from "~/utils/user-mapping";

const excerptFromMarkdown = (md: string, max = 160) => {
	if (!md) return "";
	const text = md
		.replace(/!\[.*?\]\(.*?\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[#>*_`~-]/g, "")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();

	return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
};

export const Route = createFileRoute("/rating/$ratingId")({
	beforeLoad: async ({ params, context }) => {
		const ratingId = params.ratingId;

		if (!ratingId) throw redirect({ to: "/" });

		const rating = await context.queryClient.ensureQueryData(
			ratingQueryOptions(ratingId),
		);

		if (!rating || !rating.success) {
			throw notFound();
		}

		return { rating: rating?.data };
	},
	component: RouteComponent,
	notFoundComponent: NotFound,
	head: ({ params, match }) => {
		const cached = match.context.queryClient.getQueryData(
			ratingQueryOptions(params.ratingId).queryKey,
		);

		const rating = cached?.success ? cached.data : null;
		const stuffName = rating?.stuff?.name ?? "Rating";
		const title = rating
			? `${stuffName} - ${rating.score}/10`
			: "Rating - Rate Stuff Online";
		const description = rating
			? excerptFromMarkdown(rating.content, 160)
			: "View a community rating on Rate Stuff Online.";

		let image: string | undefined;

		if (rating?.images) {
			if (typeof rating.images === "string") {
				try {
					const imgs = JSON.parse(rating.images);
					if (Array.isArray(imgs) && imgs.length > 0) image = imgs[0];
					else if (typeof imgs === "string") image = imgs;
				} catch {
					image = rating.images;
				}
			} else {
				const maybeArray = rating.images as unknown;
				if (Array.isArray(maybeArray) && maybeArray.length > 0) {
					image = (maybeArray as string[])[0];
				}
			}
		}

		const pageUrl = `https://rate-stuff.online/rating/${params.ratingId}`;

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{
				name: "og:site_name",
				property: "og:site_name",
				content: "Rate Stuff Online",
			},
			{ name: "og:title", property: "og:title", content: title },
			{
				name: "og:description",
				property: "og:description",
				content: description,
			},
			{ name: "og:type", property: "og:type", content: "article" },
			{ name: "og:url", property: "og:url", content: pageUrl },
			{
				name: "twitter:card",
				content: image ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "robots", content: "index, follow" },
		];

		if (image) {
			metas.push({ name: "og:image", property: "og:image", content: image });
			metas.push({ name: "twitter:image", content: image });
		}

		if (rating?.createdAt) {
			metas.push({
				name: "article:published_time",
				property: "article:published_time",
				content: new Date(rating.createdAt).toISOString(),
			});
		}

		const scripts: { type: string; children: string }[] = [];
		if (rating) {
			const authorName =
				rating.user?.name ?? rating.user?.username ?? "Anonymous User";
			const authorUrl = rating.user
				? `https://rate-stuff.online/@${rating.user.username ?? rating.user.id}`
				: "https://rate-stuff.online";

			const ldJson: Record<string, unknown> = {
				"@context": "https://schema.org",
				"@type": "Review",
				url: pageUrl,
				mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
				author: {
					"@type": "Person",
					name: authorName,
					url: authorUrl,
				},
				datePublished: new Date(rating.createdAt).toISOString(),
				reviewBody: excerptFromMarkdown(rating.content, 500),
				name: `${stuffName} - ${rating.score}/10`,
				reviewRating: {
					"@type": "Rating",
					ratingValue: rating.score,
					bestRating: 10,
					worstRating: 1,
				},
				publisher: {
					"@type": "Organization",
					name: "Rate Stuff Online",
					url: "https://rate-stuff.online",
				},
				image: image,
			};

			if (rating.stuff) {
				ldJson.itemReviewed = {
					"@type": "Thing",
					name: rating.stuff.name,
					url: `https://rate-stuff.online/stuff/${rating.stuff.slug}`,
				};
			}

			scripts.push({
				type: "application/ld+json",
				children: JSON.stringify(ldJson),
			});
		}

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/rating/${params.ratingId}` }],
			scripts,
		};
	},
});

const MarkdownContent = ({ content }: { content: string }) => {
	const safe = content.replace(/<[^>]*>/g, "");

	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				p: ({ children }) => <p>{children}</p>,
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

const RatingHeader = ({ rating }: { rating: RatingWithRelations }) => {
	const usernameHandle = rating.user?.username ?? "unknown";
	const name = rating.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const image = rating.user?.image ?? null;

	return (
		<div className="flex items-center gap-3">
			<Avatar src={image} alt={displayText} size="sm" className="shrink-0" />

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
						<span className="font-medium text-neutral-400">{displayText}</span>
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
						<span className="text-neutral-400 font-semibold">Unknown Item</span>
					)}
					<span className="text-neutral-500">•</span>
					<span className="text-neutral-500">
						{getTimeAgo(rating.createdAt)}
					</span>
				</div>
			</div>
		</div>
	);
};

const TitleBlock = ({ rating }: { rating: RatingWithRelations }) => {
	return (
		<h3 className={`text-2xl font-semibold text-white mb-2 ml-11`}>
			{rating.score}/10
		</h3>
	);
};

const ContentSection = ({ rating }: { rating: RatingWithRelations }) => {
	return (
		<div className="ml-11 mb-3 text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mt-3 [&_p]:mb-0 [&_p]:leading-normal">
			<MarkdownContent content={rating.content} />
		</div>
	);
};

const ImagesGallery = ({
	images,
	onImageClick,
}: {
	images: string[];
	onImageClick: (src: string) => void;
}) => {
	if (!images || images.length === 0) return null;
	if (images.length === 1) {
		return (
			<div className="ml-11 mb-3">
				<button
					type="button"
					onClick={() => onImageClick(images[0])}
					className="block w-full"
				>
					<img
						src={images[0]}
						alt="Rating"
						className="block aspect-video object-cover rounded-xl w-full cursor-pointer"
					/>
				</button>
			</div>
		);
	}

	if (images.length === 2) {
		return (
			<div className="ml-11 mb-3 flex gap-1.5">
				{images.map((src, idx) => (
					<div key={src} className="flex-1 aspect-square overflow-hidden">
						<button
							type="button"
							onClick={() => onImageClick(src)}
							className="w-full h-full"
						>
							{(() => {
								let cornerClass = "rounded-xl";
								switch (idx) {
									case 0:
										cornerClass = "rounded-xl rounded-br-sm";
										break;
									case 1:
										cornerClass = "rounded-xl rounded-bl-sm";
										break;
									case 2:
										cornerClass = "rounded-xl rounded-tr-sm";
										break;
									case 3:
										cornerClass = "rounded-xl rounded-tl-sm";
										break;
								}
								return (
									<img
										src={src}
										alt="Rating"
										className={`w-full h-full object-cover object-center ${cornerClass} cursor-pointer`}
									/>
								);
							})()}
						</button>
					</div>
				))}
			</div>
		);
	}

	if (images.length === 3) {
		return (
			<div className="ml-11 mb-3 aspect-video grid grid-cols-2 grid-rows-2 gap-1.5">
				<div className="row-span-2 h-full overflow-hidden">
					<button
						type="button"
						onClick={() => onImageClick(images[0])}
						className="w-full h-full"
					>
						<img
							src={images[0]}
							alt="Rating"
							className="w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm cursor-pointer"
						/>
					</button>
				</div>
				<div className="h-full overflow-hidden">
					<button
						type="button"
						onClick={() => onImageClick(images[1])}
						className="w-full h-full"
					>
						<img
							src={images[1]}
							alt="Rating"
							className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm cursor-pointer"
						/>
					</button>
				</div>
				<div className="h-full overflow-hidden">
					<button
						type="button"
						onClick={() => onImageClick(images[2])}
						className="w-full h-full"
					>
						<img
							src={images[2]}
							alt="Rating"
							className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm cursor-pointer"
						/>
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="ml-11 mb-3 aspect-video grid grid-cols-2 grid-rows-2 gap-1.5">
			{images.slice(0, 4).map((src, idx) => {
				let cornerClass = "rounded-xl";
				switch (idx) {
					case 0:
						cornerClass = "rounded-xl rounded-br-sm";
						break;
					case 1:
						cornerClass = "rounded-xl rounded-bl-sm";
						break;
					case 2:
						cornerClass = "rounded-xl rounded-tr-sm";
						break;
					case 3:
						cornerClass = "rounded-xl rounded-tl-sm";
						break;
				}
				return (
					<button
						key={src}
						type="button"
						onClick={() => onImageClick(src)}
						className="w-full h-full"
					>
						<img
							src={src}
							alt="Rating"
							className={`w-full h-full object-cover object-center ${cornerClass} cursor-pointer`}
						/>
					</button>
				);
			})}
		</div>
	);
};

const TagsList = ({
	tags,
	isAuthenticated = false,
}: {
	tags?: string[];
	isAuthenticated?: boolean;
}) => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	if (!tags || tags.length === 0) return null;
	return (
		<>
			<div className="flex flex-wrap gap-2 mb-3 ml-11">
				{tags.map((tag: string) =>
					isAuthenticated ? (
						<Link
							key={tag}
							to="/"
							search={{ tag }}
							className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
						>
							#{tag}
						</Link>
					) : (
						<button
							key={tag}
							type="button"
							onClick={() => setIsAuthModalOpen(true)}
							className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md cursor-pointer"
						>
							#{tag}
						</button>
					),
				)}
			</div>
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
		</>
	);
};

interface VoteButtonProps {
	type: "up" | "down";
	isActive: boolean;
	onClick: () => void;
}

const VoteButton = ({ type, isActive, onClick }: VoteButtonProps) => {
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
};

function VoteSection({
	rating,
	isAuthenticated,
}: {
	rating: RatingWithRelations;
	isAuthenticated: boolean;
}) {
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
				className="flex items-center gap-1.5 rounded-lg py-1 w-fit ml-11 mb-2"
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

function RouteComponent() {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	// const { user, rating } = Route.useRouteContext();
	const { rating } = Route.useRouteContext();
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);

	if (!rating) return <NotFound />;

	const ratingTyped = rating as RatingWithRelations;
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

	const handleImageClick = (src: string) => setLightboxSrc(src);

	return (
		<>
			<MainLayout user={currentUser}>
				<div className="border-b border-neutral-800 px-4 py-2">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
							onClick={(e) => {
								e.stopPropagation();
								if (canGoBack) {
									router.history.back();
								} else {
									router.navigate({ to: "/" });
								}
							}}
						>
							<ArrowLeft className="h-5 w-5 shrink-0" />
						</button>
						<h2 className="text-lg font-semibold text-white">Rating</h2>
					</div>
				</div>
				<div className="px-4">
					<RatingHeader rating={ratingTyped} />
					<TitleBlock rating={ratingTyped} />
					<ImagesGallery
						images={parsedImages}
						onImageClick={handleImageClick}
					/>
					<ContentSection rating={ratingTyped} />
					<TagsList tags={ratingTyped.tags} isAuthenticated={!!currentUser} />
					<VoteSection rating={ratingTyped} isAuthenticated={!!currentUser} />
					<div className="-mx-4 border-t border-neutral-800 my-4" />
				</div>
			</MainLayout>

			<Lightbox
				src={lightboxSrc}
				onClose={() => setLightboxSrc(null)}
				alt={`${rating.stuff?.name ?? "Rating"} - ${rating.score}/10`}
			/>
		</>
	);
}
