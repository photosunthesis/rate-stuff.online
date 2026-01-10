import { useState } from "react";
import type { StuffWithAggregates } from "../types";
import { Lightbox } from "~/components/ui/lightbox";

export function StuffHeader({ stuff }: { stuff: StuffWithAggregates }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	const images = Array.isArray(stuff.images) ? stuff.images.slice(0, 4) : [];

	return (
		<div className="mb-4">
			{/* Gallery: 1-4 images using same layout as RatingCard */}
			{images.length === 0 ? (
				<div className="w-full aspect-video bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-500 mb-4">
					<span className="text-xl">No cover image</span>
				</div>
			) : images.length === 1 ? (
				<div className="mb-4">
					<button
						type="button"
						className="block w-full"
						onClick={() => setLightboxSrc(images[0])}
					>
						<img
							src={images[0]}
							alt={stuff.name}
							className="block aspect-video object-cover rounded-xl w-full cursor-pointer"
						/>
					</button>
				</div>
			) : images.length === 2 ? (
				<div className="mb-4 flex gap-2">
					{images.map((src, idx) => (
						<div key={src} className="flex-1 aspect-square overflow-hidden">
							<button
								type="button"
								onClick={() => setLightboxSrc(src)}
								className="w-full h-full"
							>
								<img
									src={src}
									alt={stuff.name}
									className={
										idx === 0
											? "w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm cursor-pointer"
											: "w-full h-full object-cover object-center rounded-xl rounded-tl-sm rounded-bl-sm cursor-pointer"
									}
								/>
							</button>
						</div>
					))}
				</div>
			) : images.length === 3 ? (
				<div className="mb-4 aspect-video grid grid-cols-2 grid-rows-2 gap-2">
					<div className="row-span-2 h-full overflow-hidden">
						<button
							type="button"
							onClick={() => setLightboxSrc(images[0])}
							className="w-full h-full"
						>
							<img
								src={images[0]}
								alt={stuff.name}
								className="w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm cursor-pointer"
							/>
						</button>
					</div>
					<div className="h-full overflow-hidden">
						<button
							type="button"
							onClick={() => setLightboxSrc(images[1])}
							className="w-full h-full"
						>
							<img
								src={images[1]}
								alt={stuff.name}
								className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm cursor-pointer"
							/>
						</button>
					</div>
					<div className="h-full overflow-hidden">
						<button
							type="button"
							onClick={() => setLightboxSrc(images[2])}
							className="w-full h-full"
						>
							<img
								src={images[2]}
								alt={stuff.name}
								className="w-full h-full object-cover object-center rounded-xl rounded-tl-sm cursor-pointer"
							/>
						</button>
					</div>
				</div>
			) : (
				<div className="mb-4 aspect-video grid grid-cols-2 grid-rows-2 gap-2">
					{images.slice(0, 4).map((src, idx) => {
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
							<button
								key={src}
								type="button"
								onClick={() => setLightboxSrc(src)}
								className="w-full h-full"
							>
								<img
									src={src}
									alt={stuff.name}
									className={`w-full h-full object-cover object-center ${cornerClass} cursor-pointer`}
								/>
							</button>
						);
					})}
				</div>
			)}

			<div className="flex items-start justify-between gap-4 mt-3">
				<div className="min-w-0">
					<h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white truncate">
						{stuff.name}
					</h1>
					<div className="flex items-center gap-4 text-sm text-neutral-400">
						<div className="text-neutral-500">
							{stuff.ratingCount}{" "}
							{stuff.ratingCount === 1 ? "rating" : "ratings"}
						</div>
					</div>
				</div>
				<div className="shrink-0 text-right">
					<div className="text-2xl md:text-3xl font-semibold text-white mb-1">
						<span className="align-baseline">
							{Number(stuff.averageRating).toFixed(1)}
						</span>
						<span className="text-sm md:text-md text-neutral-400 ml-1">
							/ 10
						</span>
					</div>
					<div className="text-sm text-neutral-400">Avg. Rating</div>
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
