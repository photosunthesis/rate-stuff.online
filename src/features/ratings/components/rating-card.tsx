import { useState } from "react";
import { Avatar } from "~/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

function getRatingEmoji(rating: number): string {
	const roundedRating = Math.round(rating);

	if (roundedRating >= 10) return "🤩";
	if (roundedRating >= 9) return "😍";
	if (roundedRating >= 8) return "😄";
	if (roundedRating >= 7) return "😊";
	if (roundedRating >= 6) return "🙂";
	if (roundedRating >= 5) return "😑";
	if (roundedRating >= 4) return "😐";
	if (roundedRating >= 3) return "😕";
	if (roundedRating >= 2) return "😞";
	return "😭";
}

function getTimeAgo(date: Date | string | number): string {
	const now = new Date();

	let dateObj: Date;
	if (date instanceof Date) {
		dateObj = date;
	} else if (typeof date === "string" || typeof date === "number") {
		dateObj = new Date(date);
	} else {
		return "Invalid Date";
	}

	if (!dateObj || Number.isNaN(dateObj.getTime())) {
		return "Invalid Date";
	}

	const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}w`;

	if (dateObj.getFullYear() !== now.getFullYear()) {
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	}

	return dateObj.toLocaleDateString();
}

interface RatingWithRelations {
	id: string;
	userId: string;
	stuffId: string;
	title: string;
	score: number;
	content: string;
	images: string | null;
	tags: string | null | string[] | { tag: { name: string } }[];
	createdAt: string;
	user: {
		id: string;
		name: string | null;
		username?: string;
		avatarUrl?: string | null;
	};
	stuff: {
		id: string;
		name: string;
	};
}

interface RatingCardProps {
	rating: RatingWithRelations;
}

interface MarkdownContentProps {
	content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
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

export function RatingCard({ rating }: RatingCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const maxContentLength = 256;
	const plainText = rating.content;
	const shouldTruncate = plainText.length > maxContentLength;
	const userName = rating.user.name || rating.user.username || "User";
	const avatarUrl = rating.user.avatarUrl ?? null;

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

	let parsedTags: string[] = [];
	if (typeof rating.tags === "string") {
		try {
			parsedTags = JSON.parse(rating.tags);
		} catch {
			parsedTags = [];
		}
	} else if (Array.isArray(rating.tags)) {
		if (
			rating.tags.length > 0 &&
			typeof rating.tags[0] === "object" &&
			"tag" in rating.tags[0]
		) {
			parsedTags = (rating.tags as { tag: { name: string } }[]).map(
				(t) => t.tag.name,
			);
		} else {
			parsedTags = rating.tags as string[];
		}
	}

	return (
		<div className="border-b border-neutral-800 px-4 py-3 hover:bg-neutral-800/50 transition-colors cursor-pointer">
			{/* Header */}
			<div className="flex items-center gap-3 mb-2">
				<Avatar
					src={avatarUrl ?? null}
					alt={userName}
					size="sm"
					className="shrink-0"
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 flex-wrap text-sm">
						<a
							href={`/@${rating.user.username ?? rating.userId}`}
							className="font-semibold text-white hover:underline"
						>
							{userName}
						</a>
						<span className="text-neutral-500">has rated</span>
						<a
							href={`/stuff/${rating.stuff.name.toLowerCase().replace(/\s+/g, "-")}`}
							className="font-semibold text-white hover:underline"
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

			{/* Rating and Title */}
			<h3 className="text-lg md:text-xl font-semibold text-white mb-2 ml-11">
				{getRatingEmoji(rating.score)} {rating.score}/10 - {rating.title}
			</h3>

			{/* Content */}
			<div className="ml-11 mb-3">
				{shouldTruncate && !isExpanded ? (
					<>
						<div className="text-slate-200 text-sm leading-normal prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_p]:leading-normal inline">
							<MarkdownContent
								content={`${plainText.slice(0, maxContentLength)}...`}
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

			{/* Tags */}
			{parsedTags && parsedTags.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3 ml-11">
					{parsedTags.map((tag: string) => (
						<a
							key={tag}
							href={`#${tag}`}
							className="px-0 py-0 text-neutral-500 hover:text-neutral-400 text-xs font-medium transition-all"
						>
							#{tag}
						</a>
					))}
				</div>
			)}
		</div>
	);
}
