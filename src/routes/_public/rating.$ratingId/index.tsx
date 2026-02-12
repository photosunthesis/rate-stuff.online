import {
	createFileRoute,
	redirect,
	Link,
	useRouter,
	useCanGoBack,
	notFound,
} from "@tanstack/react-router";
import { NotFound } from "~/components/ui/feedback/not-found";
import { useState, useId, useRef, useEffect } from "react";
import { RichTextRenderer } from "~/components/ui/content/rich-text-renderer";
import { ratingQueryOptions } from "~/domains/ratings/queries/display";
import { Lightbox } from "~/components/ui/modal/lightbox";
import { Avatar } from "~/components/ui/misc/avatar";
import { ImageGrid } from "~/components/ui/content/image-grid";
import type { RatingWithRelations } from "~/domains/ratings/types/display";
import { TimeAgo } from "~/components/ui/misc/time-ago";
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { MainLayout } from "~/components/layout/main-layout";
import { AuthModal } from "~/domains/users/components/auth-modal";

import { VoteSection } from "~/components/ui/content/vote-section";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/domains/users/queries";
import { mapToCurrentUser } from "~/domains/users/utils/user-mapping";
import { CommentsSection } from "~/domains/comments/components/comments-section";
import { MessageSquare } from "lucide-react";
import { formatCompactNumber } from "~/utils/numbers";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalTitle,
	ModalDescription,
	ModalFooter,
	ModalClose,
} from "~/components/ui/modal/modal";
import { Button } from "~/components/ui/form/button";
import { useDeleteRatingMutation } from "~/domains/ratings/queries/create";
import { useUmami } from "@danielgtmn/umami-react";

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

export const Route = createFileRoute("/_public/rating/$ratingId/")({
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
		const fallbackImage =
			"https://rate-stuff.online/web-app-manifest-512x512.png";
		const finalImage = image || fallbackImage;

		const keywords = ["rating", "review", stuffName, "rate stuff online"].join(
			", ",
		);

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{ name: "keywords", content: keywords },
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
			{ name: "og:image", property: "og:image", content: finalImage },
			{
				name: "twitter:card",
				content: image ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: finalImage },
		];

		const contentText = excerptFromMarkdown(rating?.content ?? "", 1000);
		const isThinContent = contentText.length < 50;

		if (isThinContent) {
			metas.push({ name: "robots", content: "noindex" });
		} else {
			metas.push({ name: "robots", content: "index, follow" });
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

const RatingHeader = ({
	rating,
	isOwner,
}: {
	rating: RatingWithRelations;
	isOwner: boolean;
}) => {
	const usernameHandle = rating.user?.username ?? "unknown";
	const name = rating.user?.name;
	const displayText = name ? name : `@${usernameHandle}`;
	const image = rating.user?.image ?? null;
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const deleteMutation = useDeleteRatingMutation();
	const umami = useUmami();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen]);

	const handleDelete = async () => {
		await deleteMutation.mutateAsync({ ratingId: rating.id });
		if (umami) umami.track("delete_rating");
		setIsDeleteModalOpen(false);
	};

	return (
		<div className="flex items-start gap-3">
			<Avatar
				src={image}
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
						<span className="font-medium text-neutral-400">{displayText}</span>
					)}
					<span className="text-neutral-500"> rated </span>
					{rating.stuff ? (
						<Link
							to="/stuff/$stuffSlug"
							params={{ stuffSlug: rating.stuff.slug }}
							className="text-white hover:underline font-medium"
							onClick={(e) => e.stopPropagation()}
						>
							{rating.stuff.name}
						</Link>
					) : (
						<span className="text-neutral-400 font-medium">Unknown Item</span>
					)}
					<span className="text-neutral-500"> • </span>
					<TimeAgo date={rating.createdAt} className="text-neutral-500" />
					{rating.updatedAt &&
						new Date(rating.updatedAt).getTime() >
							new Date(rating.createdAt).getTime() + 1000 && (
							<span className="text-neutral-500"> (edited)</span>
						)}
				</div>
			</div>

			{isOwner && (
				<div className="relative -mr-2" ref={menuRef}>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsMenuOpen(!isMenuOpen);
						}}
						className="p-1.5 text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800 rounded-lg"
					>
						<MoreVertical className="w-5 h-5" />
					</button>

					{isMenuOpen && (
						<div className="absolute right-0 top-full mt-1 w-36 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-10">
							<Link
								to="/rating/$ratingId/edit"
								params={{ ratingId: rating.id }}
								className="flex items-center gap-2 px-3 py-2 text-base text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors w-full text-left"
								onClick={() => setIsMenuOpen(false)}
							>
								<Pencil className="w-4 h-4" />
								Edit
							</Link>
							<button
								type="button"
								onClick={() => {
									setIsMenuOpen(false);
									setIsDeleteModalOpen(true);
								}}
								className="flex items-center gap-2 px-3 py-2 text-base text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors w-full text-left"
							>
								<Trash2 className="w-4 h-4" />
								Delete
							</button>
						</div>
					)}
				</div>
			)}

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			>
				<ModalContent width="sm">
					<ModalHeader>
						<ModalTitle>Delete this rating?</ModalTitle>
						<ModalDescription>
							Are you sure you want to remove this rating?
						</ModalDescription>
					</ModalHeader>
					<ModalFooter>
						<div className="flex w-full gap-2 sm:justify-end">
							<Button
								variant="secondary"
								className="w-full sm:w-auto"
								onClick={() => setIsDeleteModalOpen(false)}
								disabled={deleteMutation.isPending}
							>
								Nevermind
							</Button>
							<Button
								variant="destructive"
								className="w-full sm:w-auto"
								onClick={handleDelete}
								isLoading={deleteMutation.isPending}
							>
								Delete rating
							</Button>
						</div>
					</ModalFooter>
					<ModalClose />
				</ModalContent>
			</Modal>
		</div>
	);
};

const TitleBlock = ({ rating }: { rating: RatingWithRelations }) => {
	return (
		<div className="flex items-start justify-between mb-2 ml-11">
			<div className="flex items-baseline gap-2">
				<h3 className="text-2xl font-semibold text-white">{rating.score}/10</h3>
			</div>
		</div>
	);
};

const ContentSection = ({ rating }: { rating: RatingWithRelations }) => {
	return (
		<div className="ml-11 mb-1 text-slate-200 text-base leading-normal">
			<RichTextRenderer
				content={rating.content}
				className="[&_p]:mt-3 [&_p]:mb-0 [&_p]:leading-normal"
			/>
		</div>
	);
};

const TagsList = ({
	tags,
	isAuthenticated = false,
	onTagClick,
}: {
	tags?: string[];
	isAuthenticated?: boolean;
	onTagClick?: (tag: string) => void;
}) => {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	if (!tags || tags.length === 0) return null;
	return (
		<>
			<div className="flex flex-wrap gap-2 mb-1 mt-2 ml-11">
				{tags.map((tag: string) =>
					isAuthenticated ? (
						<Link
							key={tag}
							to="/"
							search={{ tag }}
							className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
							onClick={() => onTagClick?.(tag)}
						>
							#{tag}
						</Link>
					) : (
						<button
							key={tag}
							type="button"
							onClick={() => {
								setIsAuthModalOpen(true);
								onTagClick?.(tag);
							}}
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

function RouteComponent() {
	const commentsSectionId = useId();
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const { ratingId } = Route.useParams();
	const { data: ratingRes } = useSuspenseQuery(ratingQueryOptions(ratingId));
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);
	const umami = useUmami();

	if (!ratingRes || !ratingRes.success || !ratingRes.data) return <NotFound />;

	const rating = ratingRes.data;
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

	const handleImageClick = (src: string) => {
		setLightboxSrc(src);
		if (umami) umami.track("view_image");
	};

	return (
		<>
			<MainLayout user={currentUser}>
				<div className="border-b border-neutral-800 px-3 py-2">
					<div className="flex items-center gap-3">
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
				<div className="px-4 pt-4">
					<RatingHeader
						rating={ratingTyped}
						isOwner={currentUser?.id === rating.userId}
					/>
					<TitleBlock rating={ratingTyped} />
					<ImageGrid
						images={parsedImages}
						alt="Rating"
						onImageClick={handleImageClick}
						className="ml-11 mb-3"
					/>
					<ContentSection rating={ratingTyped} />
					<TagsList
						tags={ratingTyped.tags}
						isAuthenticated={!!currentUser}
						onTagClick={(tag) => {
							if (umami) umami.track("click_tag", { tag });
						}}
					/>
					<div className="ml-10.5 mb-2 flex items-center gap-3">
						<VoteSection rating={ratingTyped} isAuthenticated={!!currentUser} />
						<button
							type="button"
							className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors group px-3 py-1.5 rounded-full hover:bg-neutral-800/50"
							onClick={() => {
								document
									.getElementById(commentsSectionId)
									?.scrollIntoView({ behavior: "smooth" });
							}}
						>
							<MessageSquare className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
							{rating.commentsCount > 0 && (
								<span className="text-base font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors">
									{formatCompactNumber(rating.commentsCount)}
								</span>
							)}
						</button>
					</div>
					<div className="-mx-4 border-t border-neutral-800 my-4" />
					<div id={commentsSectionId} className="mb-4">
						<CommentsSection ratingId={rating.id} currentUser={currentUser} />
					</div>
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
