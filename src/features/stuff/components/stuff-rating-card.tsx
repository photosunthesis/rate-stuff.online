import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { RatingWithRelations } from "~/features/display-ratings/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "~/components/ui/avatar";
import { getTimeAgo } from "~/lib/utils/datetime";

interface Props {
	rating: RatingWithRelations;
}

function MarkdownContent({
	content,
	inlineParagraphs = false,
}: {
	content: string;
	inlineParagraphs?: boolean;
}) {
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
}

export function StuffRatingCard({ rating }: Props) {
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(false);
	const maxContentLength = 256;
	const plainText = rating.content;
	const shouldTruncate = plainText.length > maxContentLength;
	const image = rating.user.image ?? null;
	const usernameHandle = rating.user.username;
	const name = rating.user.name;
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
			<div className="flex items-center gap-3">
				<Avatar src={image} alt={displayText} size="sm" className="shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 flex-wrap text-sm">
						<Link
							to="/user/$username"
							params={{ username: usernameHandle }}
							className="font-medium text-white hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{displayText}
						</Link>
						<span className="text-neutral-500">•</span>
						<span className="text-neutral-500">{timeAgo}</span>
					</div>
				</div>
			</div>

			<h3 className="text-lg md:text-xl font-semibold text-white mb-2 ml-11">
				<Link
					to="/rating/$ratingId"
					params={{ ratingId: rating.id }}
					className="hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{rating.stuff.name} - {rating.score}/10
				</Link>
			</h3>

			{parsedImages && parsedImages.length > 0 && (
				<div className="ml-11 mb-3">
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
							<div className="row-span-2 h-full overflow-hidden">
								<img
									src={parsedImages[0]}
									alt="Rating"
									className="w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm"
								/>
							</div>
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
						<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-2">
							{parsedImages.slice(0, 4).map((image, idx) => {
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

			<div className="ml-11 mb-3">
				{shouldTruncate && !isExpanded ? (
					<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:mt-3 [&_p]:mb-0 [&_p]:leading-normal [&_p:last-child]:inline">
						<MarkdownContent
							content={`${plainText.replace(/\\+/g, "").replace(/\s+/g, " ").trim().slice(0, maxContentLength)}...`}
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

			{parsedTags && parsedTags.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-1 ml-11">
					{parsedTags.map((tag: string) => (
						<Link
							key={tag}
							to="/"
							search={{ tag }}
							onClick={(e) => e.stopPropagation()}
							className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
						>
							#{tag}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
