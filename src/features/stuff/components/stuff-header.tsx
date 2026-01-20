import { useState } from "react";
import type { StuffWithAggregates } from "../types";
import { Lightbox } from "~/components/ui/lightbox";
import { MessageSquareQuote } from "lucide-react";
import { Image } from "~/components/ui/image";

const getRatingEmoji = (rating: number) => {
	if (rating >= 9.5) return "🤩";
	if (rating >= 9) return "😍";
	if (rating >= 8) return "🥰";
	if (rating >= 7) return "😄";
	if (rating >= 6) return "🙂";
	if (rating >= 5) return "🤔";
	if (rating >= 3) return "🫢";
	return "😑";
};

export function StuffHeader({ stuff }: { stuff: StuffWithAggregates }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const images = Array.isArray(stuff.images) ? stuff.images.slice(0, 4) : [];

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<div className="flex flex-col gap-3">
				{images.length > 0 && (
					<div className="bg-neutral-900/50">
						{images.length === 1 ? (
							<div className="aspect-2/1 w-full">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
									className="rounded-xl"
								/>
							</div>
						) : images.length === 2 ? (
							<div className="aspect-2/1 grid grid-cols-2 gap-1.5">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
									className="rounded-xl rounded-tr-sm rounded-br-sm"
								/>
								<GalleryButton
									src={images[1]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[1])}
									className="rounded-xl rounded-tl-sm rounded-bl-sm"
								/>
							</div>
						) : (
							<div className="aspect-2/1 grid grid-cols-2 gap-1.5">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
									className="rounded-xl rounded-tr-sm rounded-br-sm"
								/>
								<div className="grid grid-rows-2 gap-1.5">
									<GalleryButton
										src={images[1]}
										alt={stuff.name}
										onClick={() => setLightboxSrc(images[1])}
										className="rounded-xl rounded-tl-sm rounded-bl-sm"
									/>
									<GalleryButton
										src={images[2]}
										alt={stuff.name}
										onClick={() => setLightboxSrc(images[2])}
										className="rounded-xl rounded-tl-sm rounded-bl-sm"
									/>
								</div>
							</div>
						)}
					</div>
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
				<div className="flex items-center gap-1.5 text-sm md:text-base font-medium text-neutral-400">
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

function GalleryButton({
	src,
	alt,
	onClick,
	className,
}: {
	src: string;
	alt: string;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full h-full relative group overflow-hidden cursor-pointer ${className}`}
		>
			<Image
				src={src}
				alt={alt}
				variant="card"
				className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
		</button>
	);
}
