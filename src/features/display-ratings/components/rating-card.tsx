import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { RatingWithRelations } from "../types";
import { Avatar } from "~/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getRatingEmoji, getTimeAgo } from "~/utils/rating-utils";

interface RatingCardProps {
	rating: RatingWithRelations;
}

interface MarkdownContentProps {
	content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
	const safe = content.replace(/<[^>]*>/g, "");

	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
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
			{safe}
		</ReactMarkdown>
	);
}

export function RatingCard({ rating }: RatingCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const maxContentLength = 256;
	const plainText = rating.content;
	const shouldTruncate = plainText.length > maxContentLength;
	const avatarUrl = rating.user.avatarUrl ?? null;
	const usernameHandle = rating.user.username ?? rating.user.id;
	const displayName = rating.user.name;
	const userName = displayName
		? `${displayName} (@${usernameHandle})`
		: `@${usernameHandle}`;
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
		<div className="block border-b border-neutral-800 px-4 py-3 hover:bg-neutral-800/50 transition-colors">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Avatar
					src={avatarUrl ?? null}
					alt={userName}
					size="sm"
					className="shrink-0"
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 flex-wrap text-sm">
						<button
							type="button"
							className="font-medium text-white hover:underline"
							onClick={(e) => {
								e.stopPropagation();
								window.location.href = `/@${usernameHandle}`;
							}}
						>
							{userName}
						</button>
						<span className="text-neutral-500">has rated</span>
						<button
							type="button"
							className="font-medium text-white hover:underline"
							onClick={(e) => {
								e.stopPropagation();
								window.location.href = `/stuff/${rating.stuff.name.toLowerCase().replace(/\s+/g, "-")}`;
							}}
						>
							{rating.stuff.name}
						</button>
						<span className="text-neutral-500">•</span>
						<span className="text-neutral-500">{timeAgo}</span>
					</div>
				</div>
			</div>

			{/* Rating and Title */}
			<h3 className="text-lg md:text-xl font-semibold text-white mb-2 ml-11">
				<Link
					to="/rating/$ratingId"
					params={{ ratingId: rating.id }}
					className="hover:underline"
				>
					{getRatingEmoji(rating.score)} {rating.score}/10 - {rating.title}
				</Link>
			</h3>

			{/* Images */}
			{parsedImages && parsedImages.length > 0 && (
				<div className="ml-11 mb-3">
					{parsedImages.length === 1 ? (
						<img
							src={parsedImages[0]}
							alt="Rating"
							className="block aspect-video object-cover rounded-xl"
						/>
					) : (
						<div className="flex gap-2">
							{parsedImages.map((image) => (
								<div key={image} className="flex-1 aspect-square">
									<img
										src={image}
										alt="Rating"
										className="w-full h-full object-cover rounded-xl"
									/>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Content */}
			<div className="ml-11 mb-3">
				{shouldTruncate && !isExpanded ? (
					<>
						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p]:leading-normal inline">
							<MarkdownContent
								content={`${plainText.replace(/\\+/g, "").replace(/\s+/g, " ").trim().slice(0, maxContentLength)}...`}
							/>
						</div>
						<button
							type="button"
							onClick={() => setIsExpanded(true)}
							className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
						>
							See more
						</button>
					</>
				) : (
					<>
						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p]:leading-normal inline">
							<MarkdownContent content={rating.content} />
						</div>
						{shouldTruncate && (
							<button
								type="button"
								onClick={() => setIsExpanded(false)}
								className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
							>
								See less
							</button>
						)}
					</>
				)}
			</div>

			{/* Tags */}
			{parsedTags && parsedTags.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3 ml-11">
					{parsedTags.map((tag: string) => (
						<a
							key={tag}
							href={`#${tag}`}
							className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
						>
							#{tag}
						</a>
					))}
				</div>
			)}
		</div>
	);
}
