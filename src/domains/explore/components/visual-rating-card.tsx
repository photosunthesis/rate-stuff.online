import { Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/misc/avatar";
import { Image } from "~/components/ui/content/image";

interface VisualRatingCardProps {
	rating: {
		id: string;
		score: number;
		content: string;
		images: string | null;
		createdAt: Date;
	};
	user: {
		name: string | null;
		username: string | null;
		image: string | null;
	};
	stuff: {
		name: string;
		slug: string;
	};
}

export function VisualRatingCard({
	rating,
	user,
	stuff,
}: VisualRatingCardProps) {
	let imageUrl: string | undefined;
	if (rating.images) {
		try {
			const parsed = JSON.parse(rating.images);
			if (Array.isArray(parsed) && parsed.length > 0) {
				imageUrl = parsed[0];
			}
		} catch {
			imageUrl = rating.images;
		}
	}

	if (!imageUrl) return null;

	const cardAspect = [
		"aspect-square",
		"aspect-[3/4]",
		"aspect-[4/5]",
		"aspect-[2/3]",
		"aspect-[16/9]",
	][(rating.id.charCodeAt(0) + rating.id.charCodeAt(rating.id.length - 1)) % 5];

	return (
		<Link
			to="/rating/$ratingId"
			params={{ ratingId: rating.id }}
			className="group relative block w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/10 transition-all"
		>
			<div className={`relative ${cardAspect}`}>
				<Image
					src={imageUrl}
					alt={`Rating for ${stuff.name}`}
					className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					noBorder
				/>
				<div className="absolute inset-0 bg-neutral-900/0 hover:bg-neutral-900/10 transition-colors" />
				<div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity" />

				<div className="absolute bottom-0 left-0 right-0 p-4">
					<div className="mb-1">
						<h3 className="font-bold text-white text-lg leading-7 line-clamp-2 text-shadow-lg">
							{stuff.name} - {rating.score}/10
						</h3>
					</div>
					<div className="flex items-center gap-2">
						<Avatar
							size="xs"
							src={user.image ?? null}
							alt={user.username ?? "User"}
							username={user.username ?? undefined}
							className="border border-white/20"
						/>
						<span className="text-xs text-neutral-300 font-medium truncate">
							@{user.username}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
