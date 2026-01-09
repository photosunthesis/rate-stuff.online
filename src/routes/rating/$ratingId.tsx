import { createFileRoute, redirect } from "@tanstack/react-router";
import { MobileHeader } from "~/components/layout/mobile-header";
import { LeftSidebar } from "~/components/layout/left-sidebar";
import { RightSidebar } from "~/components/layout/right-sidebar";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
	useRating,
	ratingQueryOptions,
} from "~/features/display-ratings/queries";
import { Lightbox } from "~/components/ui/lightbox";
import { Avatar } from "~/components/ui/avatar";
import type { RatingWithRelations } from "~/features/display-ratings/types";
import { getRatingEmoji, getTimeAgo } from "~/utils/rating-utils";

function excerptFromMarkdown(md: string, max = 160) {
	if (!md) return "";
	const text = md
		// remove image markdown
		.replace(/!\[.*?\]\(.*?\)/g, "")
		// convert links to text
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		// remove remaining markdown chars
		.replace(/[#>*_`~-]/g, "")
		// strip HTML tags if present
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();

	return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

export const Route = createFileRoute("/rating/$ratingId")({
	beforeLoad: async ({ params, context }) => {
		const ratingId = params.ratingId;
		if (!ratingId) {
			throw redirect({ to: "/" });
		}

		await context.queryClient.ensureQueryData(ratingQueryOptions(ratingId));
	},
	component: RouteComponent,
	head: ({ params, match }) => {
		const cached = match.context.queryClient.getQueryData(
			ratingQueryOptions(params.ratingId).queryKey,
		);

		const rating = cached?.success ? cached.data : null;
		const title = rating
			? `${rating.title} - ${rating.score}/10`
			: "Rating - Rate Stuff Online";
		const description = rating
			? excerptFromMarkdown(rating.content, 160)
			: "View a community rating on Rate Stuff Online.";

		// extract the first image if present (handles stringified arrays or single-string URLs)
		let image: string | undefined;
		if (rating?.images) {
			if (typeof rating.images === "string") {
				try {
					const imgs = JSON.parse(rating.images);
					if (Array.isArray(imgs) && imgs.length > 0) image = imgs[0];
					else if (typeof imgs === "string") image = imgs;
				} catch {
					// not JSON — treat as single URL string
					image = rating.images;
				}
			} else {
				// fallback for unexpected runtime types (be defensive)
				const maybeArray = rating.images as unknown;
				if (Array.isArray(maybeArray) && maybeArray.length > 0) {
					image = (maybeArray as string[])[0];
				}
			}
		}

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{ name: "og:title", property: "og:title", content: title },
			{
				name: "og:description",
				property: "og:description",
				content: description,
			},
			{ name: "og:type", property: "og:type", content: "article" },
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

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/rating/${params.ratingId}` }],
		};
	},
});

function MarkdownContent({ content }: { content: string }) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			rehypePlugins={[rehypeRaw]}
			components={{
				p: ({ children }) => <span>{children}</span>,
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
			{content}
		</ReactMarkdown>
	);
}

function RatingHeader({ rating }: { rating: RatingWithRelations }) {
	const usernameHandle = rating.user.username ?? rating.user.id;
	const displayName = rating.user.name;
	const userName = displayName
		? `${displayName} (@${usernameHandle})`
		: `@${usernameHandle}`;

	return (
		<div className="flex items-center gap-3">
			<Avatar
				src={rating.user.avatarUrl ?? null}
				alt={userName}
				size="sm"
				className="shrink-0"
			/>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1 flex-wrap text-sm">
					<a
						href={`/@${usernameHandle}`}
						className="font-medium text-white hover:underline"
					>
						{userName}
					</a>
					<span className="text-neutral-500">has rated</span>
					<a
						href={`/stuff/${rating.stuff.name.toLowerCase().replace(/\s+/g, "-")}`}
						className="font-medium text-white hover:underline"
					>
						{rating.stuff.name}
					</a>
					<span className="text-neutral-500">•</span>
					<span className="text-neutral-500">
						{getTimeAgo(rating.createdAt)}
					</span>
				</div>
			</div>
		</div>
	);
}

function BackButton() {
	return (
		<button
			type="button"
			onClick={() => window.history.back()}
			className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold mb-4 cursor-pointer"
		>
			← Back
		</button>
	);
}

function TitleBlock({ rating }: { rating: RatingWithRelations }) {
	return (
		<h3 className="text-lg md:text-xl font-semibold text-white mb-2 ml-11">
			{getRatingEmoji(rating.score)} {rating.score}/10 - {rating.title}
		</h3>
	);
}

function ContentSection({ rating }: { rating: RatingWithRelations }) {
	let image: string | undefined;
	if (rating?.images) {
		if (typeof rating.images === "string") {
			try {
				const imgs = JSON.parse(rating.images as string);
				if (Array.isArray(imgs) && imgs.length > 0) image = imgs[0];
				else if (typeof imgs === "string") image = imgs;
			} catch {
				image = rating.images as string;
			}
		} else if (
			Array.isArray(rating.images) &&
			(rating.images as string[]).length > 0
		) {
			image = (rating.images as string[])[0];
		}
	}

	return (
		<div className="ml-11 mb-3 text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p]:leading-normal">
			<MarkdownContent content={rating.content} />
			{/* JSON-LD structured data for SEO (rendered server-side) */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Review",
						author: {
							"@type": "Person",
							name: rating.user.name ?? rating.user.username ?? "User",
							url: `https://rate-stuff.online/@${rating.user.username ?? rating.user.id}`,
						},
						datePublished: new Date(rating.createdAt).toISOString(),
						reviewBody: excerptFromMarkdown(rating.content, 500),
						name: rating.title,
						reviewRating: {
							"@type": "Rating",
							ratingValue: rating.score,
							bestRating: 10,
							worstRating: 1,
						},
						itemReviewed: {
							"@type": "Thing",
							name: rating.stuff.name,
							url: `https://rate-stuff.online/stuff/${rating.stuff.name.toLowerCase().replace(/\s+/g, "-")}`,
						},
						image: image,
					}),
				}}
			/>
		</div>
	);
}

function ImagesGallery({
	images,
	onImageClick,
}: {
	images: string[];
	onImageClick: (src: string) => void;
}) {
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

	return (
		<div className="ml-11 mb-3 flex gap-2">
			{images.map((src) => (
				<div key={src} className="flex-1 aspect-square">
					<button
						type="button"
						onClick={() => onImageClick(src)}
						className="w-full h-full"
					>
						<img
							src={src}
							alt="Rating"
							className="w-full h-full object-cover rounded-xl cursor-pointer"
						/>
					</button>
				</div>
			))}
		</div>
	);
}

function TagsList({ tags }: { tags?: string[] }) {
	if (!tags || tags.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-2 mb-3 ml-11">
			{tags.map((tag: string) => (
				<a
					key={tag}
					href={`#${tag}`}
					className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
				>
					#{tag}
				</a>
			))}
		</div>
	);
}

function RouteComponent() {
	const ratingId = Route.useParams().ratingId;
	const { data, isLoading, isError } = useRating(ratingId);
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	if (isLoading) return null;
	if (isError || !data || !data.success)
		return <div className="min-h-screen">Rating not found</div>;

	const rating = data.data;
	if (!rating) return <div className="min-h-screen">Rating not found</div>;

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
		<div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
			<MobileHeader isAuthenticated={true} />
			<div className="flex flex-1 justify-center">
				<LeftSidebar />

				<main className="border-x border-neutral-800 w-full max-w-2xl pb-16 lg:pb-0">
					<div className="px-4 py-4">
						<BackButton />

						<div className="-mx-4 border-t border-neutral-800 mb-4" />

						<RatingHeader rating={ratingTyped} />

						<TitleBlock rating={ratingTyped} />

						<ImagesGallery
							images={parsedImages}
							onImageClick={handleImageClick}
						/>

						<ContentSection rating={ratingTyped} />

						<TagsList tags={ratingTyped.tags} />
					</div>
				</main>

				<RightSidebar isAuthenticated={true} />
			</div>
			<Lightbox
				src={lightboxSrc}
				onClose={() => setLightboxSrc(null)}
				alt={rating.title}
			/>
		</div>
	);
}
