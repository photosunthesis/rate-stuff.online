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

function RouteComponent() {
	const id = Route.useParams().ratingId;
	const { data, isLoading, isError } = useRating(id);
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
						<button
							type="button"
							onClick={() => window.history.back()}
							className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold mb-4"
						>
							← Back
						</button>

						<div className="flex items-center gap-3 mb-2">
							<a
								href={`/@${ratingTyped.user.username ?? ratingTyped.user.id}`}
								className="shrink-0"
							>
								<Avatar
									src={ratingTyped.user.avatarUrl ?? null}
									alt={
										ratingTyped.user.name ?? ratingTyped.user.username ?? "User"
									}
									size="sm"
								/>
							</a>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1 flex-wrap text-sm">
									<a
										href={`/@${ratingTyped.user.username ?? ratingTyped.user.id}`}
										className="font-semibold text-white hover:underline truncate"
									>
										{ratingTyped.user.name ||
											ratingTyped.user.username ||
											"User"}
									</a>
									<span className="text-neutral-500">has rated</span>
									<a
										href={`/stuff/${ratingTyped.stuff.name.toLowerCase().replace(/\s+/g, "-")}`}
										className="font-semibold text-white hover:underline"
									>
										{ratingTyped.stuff.name}
									</a>
									<span className="text-neutral-500">•</span>
									<span className="text-neutral-500">
										{getTimeAgo(ratingTyped.createdAt)}
									</span>
								</div>
							</div>
						</div>

						<h1 className="text-2xl font-semibold text-white mb-3">
							{getRatingEmoji(ratingTyped.score)} {ratingTyped.score}/10 —{" "}
							{ratingTyped.title}
						</h1>

						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p]:leading-normal mb-4">
							<MarkdownContent content={ratingTyped.content} />
							{/* JSON-LD structured data for SEO (rendered server-side) */}
							<script
								type="application/ld+json"
								dangerouslySetInnerHTML={{
									__html: JSON.stringify({
										"@context": "https://schema.org",
										"@type": "Review",
										author: {
											"@type": "Person",
											name:
												ratingTyped.user.name ??
												ratingTyped.user.username ??
												"User",
											url: `https://rate-stuff.online/@${ratingTyped.user.username ?? ratingTyped.user.id}`,
										},
										datePublished: new Date(
											ratingTyped.createdAt,
										).toISOString(),
										reviewBody: excerptFromMarkdown(ratingTyped.content, 500),
										name: ratingTyped.title,
										reviewRating: {
											"@type": "Rating",
											ratingValue: ratingTyped.score,
											bestRating: 10,
											worstRating: 1,
										},
										itemReviewed: {
											"@type": "Thing",
											name: ratingTyped.stuff.name,
											url: `https://rate-stuff.online/stuff/${ratingTyped.stuff.name.toLowerCase().replace(/\s+/g, "-")}`,
										},
										image:
											parsedImages && parsedImages.length > 0
												? parsedImages[0]
												: undefined,
									}),
								}}
							/>
						</div>

						{parsedImages && parsedImages.length > 0 && (
							<div className="mb-4">
								{parsedImages.length === 1 ? (
									<button
										type="button"
										onClick={() => handleImageClick(parsedImages[0])}
										className="block w-full"
									>
										<img
											src={parsedImages[0]}
											alt="Rating"
											className="block aspect-video object-cover rounded-xl w-full"
										/>
									</button>
								) : (
									<div className="grid grid-cols-2 gap-2">
										{parsedImages.map((src) => (
											<button
												key={src}
												type="button"
												onClick={() => handleImageClick(src)}
												className="w-full h-full"
											>
												<img
													src={src}
													alt="Rating"
													className="w-full h-full object-cover rounded-xl"
												/>
											</button>
										))}
									</div>
								)}
							</div>
						)}

						{ratingTyped.tags && ratingTyped.tags.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{ratingTyped.tags.map((tag: string) => (
									<a
										key={tag}
										href={`#${tag}`}
										className="px-0 py-0 text-emerald-600 hover:text-emerald-500 text-sm font-medium"
									>
										#{tag}
									</a>
								))}
							</div>
						)}
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
