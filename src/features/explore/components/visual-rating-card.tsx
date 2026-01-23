import { Link } from "@tanstack/react-router";
import { Avatar } from "~/components/ui/avatar";
import { Image } from "~/components/ui/image";

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

	return (
		<Link
			to="/rating/$ratingId"
			params={{ ratingId: rating.id }}
			className="group relative block w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/10 transition-all"
		>
			<div className="relative">
				<Image
					src={imageUrl}
					alt={`Rating for ${stuff.name}`}
					className="w-full h-auto max-w-full object-cover transition-transform duration-500 group-hover:scale-105"
					noBorder
				/>
				<div className="absolute inset-0 bg-neutral-900/0 hover:bg-neutral-900/10 transition-colors" />
				<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

				<div className="absolute bottom-0 left-0 right-0 p-4">
					<div className="mb-1">
						<h3 className="font-bold text-white text-md md:text-lg leading-7 line-clamp-2 text-shadow-sm">
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
