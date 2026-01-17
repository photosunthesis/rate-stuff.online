import { useState } from "react";
import type { StuffWithAggregates } from "../types";
import { Lightbox } from "~/components/ui/lightbox";
import { MessageSquare } from "lucide-react";

const getRatingEmoji = (rating: number) => {
	if (rating >= 9.5) return "🤩";
	if (rating >= 9) return "😍";
	if (rating >= 8) return "😊";
	if (rating >= 7) return "🙂";
	if (rating >= 6) return "🙂";
	if (rating >= 5) return "🤔";
	if (rating >= 3) return "🫢";
	return "😑";
};

export function StuffHeader({ stuff }: { stuff: StuffWithAggregates }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const images = Array.isArray(stuff.images) ? stuff.images.slice(0, 4) : [];

	return (
		<div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-6">
			<div className="flex flex-col gap-3 mb-6">
				{images.length > 0 && (
					<div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-neutral-900/50">
						{images.length === 1 ? (
							<div className="aspect-video w-full">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
								/>
							</div>
						) : images.length === 2 ? (
							<div className="aspect-2/1 grid grid-cols-2 gap-px bg-neutral-900">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
								/>
								<GalleryButton
									src={images[1]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[1])}
								/>
							</div>
						) : images.length === 3 ? (
							<div className="aspect-2/1 grid grid-cols-2 gap-px bg-neutral-900">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
								/>
								<div className="grid grid-rows-2 gap-px">
									<GalleryButton
										src={images[1]}
										alt={stuff.name}
										onClick={() => setLightboxSrc(images[1])}
									/>
									<GalleryButton
										src={images[2]}
										alt={stuff.name}
										onClick={() => setLightboxSrc(images[2])}
									/>
								</div>
							</div>
						) : (
							<div className="aspect-2/1 grid grid-cols-2 gap-px bg-neutral-900">
								<GalleryButton
									src={images[0]}
									alt={stuff.name}
									onClick={() => setLightboxSrc(images[0])}
								/>
								<div className="grid grid-rows-2 gap-px">
									<GalleryButton
										src={images[1]}
										alt={stuff.name}
										onClick={() => setLightboxSrc(images[1])}
									/>
									<div className="grid grid-cols-2 gap-px">
										<GalleryButton
											src={images[2]}
											alt={stuff.name}
											onClick={() => setLightboxSrc(images[2])}
										/>
										<GalleryButton
											src={images[3]}
											alt={stuff.name}
											onClick={() => setLightboxSrc(images[3])}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				<div className="flex items-baseline justify-between gap-6">
					<h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-[1.1]">
						{stuff.name}
					</h1>
					<div className="shrink-0 flex items-baseline gap-2 bg-neutral-900/50 px-3 py-2 rounded-xl border border-neutral-800/50 backdrop-blur-sm">
						<span className="text-xl md:text-3xl grayscale-[0.2] -mt-1 select-none">
							{getRatingEmoji(Number(stuff.averageRating))}
						</span>
						<div className="flex items-baseline gap-1">
							<span className="text-xl md:text-3xl font-bold text-white tabular-nums">
								{Number(stuff.averageRating).toFixed(1)}
							</span>
							<span className="text-base text-neutral-500 font-medium">
								/ 10
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2 text-base font-medium text-neutral-400">
					<MessageSquare className="w-4 h-4" />
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
}: {
	src: string;
	alt: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full h-full relative group overflow-hidden cursor-pointer"
		>
			<img
				src={src}
				alt={alt}
				className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
		</button>
	);
}
