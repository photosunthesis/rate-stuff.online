import { useState } from "react";
import type { StuffWithAggregates } from "../types";
import { Lightbox } from "~/components/ui/modal/lightbox";
import { MessageSquareQuote } from "lucide-react";
import { ImageGrid } from "~/components/ui/content/image-grid";
import { getRatingEmoji } from "~/utils/ratings";

export function StuffHeader({ stuff }: { stuff: StuffWithAggregates }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const images = Array.isArray(stuff.images) ? stuff.images.slice(0, 3) : [];

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<div className="flex flex-col gap-3">
				{images.length > 0 && (
					<ImageGrid
						images={images}
						alt={stuff.name}
						maxImages={3}
						onImageClick={(src) => setLightboxSrc(src)}
						className="mb-3 max-h-[300px]"
					/>
				)}

				<div className="flex items-start justify-between gap-4">
					<h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-[1.1]">
						{stuff.name}
					</h1>
					<div className="shrink-0 flex items-baseline gap-2">
						<span className="text-xl md:text-3xl grayscale-[0.2] -mt-1 select-none">
							{getRatingEmoji(Number(stuff.averageRating))}
						</span>
						<div className="flex items-baseline gap-1">
							<span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
								{Number(stuff.averageRating).toFixed(1)}
							</span>
							<span className="text-base text-neutral-500 font-medium">
								/ 10
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-1.5 text-base md:text-base font-medium text-neutral-400">
					<MessageSquareQuote className="w-4 h-4" />
					<span>
						{stuff.ratingCount} {stuff.ratingCount === 1 ? "rating" : "ratings"}
					</span>
				</div>
			</div>

			{lightboxSrc && (
				<Lightbox
					src={lightboxSrc}
					alt={stuff.name}
					onClose={() => setLightboxSrc(null)}
				/>
			)}
		</div>
	);
}
