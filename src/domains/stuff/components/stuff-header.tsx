import { useState } from "react";
import type { StuffWithAggregates } from "../types";
import { Lightbox } from "~/components/ui/modal/lightbox";
import { MessageSquareQuote } from "lucide-react";
import { Image } from "~/components/ui/content/image";

import { getRatingEmoji } from "~/domains/ratings/utils";

export function StuffHeader({ stuff }: { stuff: StuffWithAggregates }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const images = Array.isArray(stuff.images) ? stuff.images.slice(0, 3) : [];

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<div className="flex flex-col gap-3">
				{images.length > 0 && (
					<div className="mb-3">
						{images.length === 1 ? (
							<button
								type="button"
								onClick={() => setLightboxSrc(images[0])}
								className="block w-full cursor-pointer"
							>
								<Image
									src={images[0]}
									alt={stuff.name}
									variant="card"
									className="block aspect-video object-cover rounded-xl bg-neutral-800 border border-neutral-700/50"
								/>
							</button>
						) : images.length === 2 ? (
							<div className="flex gap-1.5">
								{images.map((image, idx) => (
									<div
										key={image}
										className="flex-1 overflow-hidden"
										style={{ aspectRatio: "1 / 1" }}
									>
										<button
											type="button"
											onClick={() => setLightboxSrc(image)}
											className="block w-full h-full cursor-pointer"
										>
											<Image
												src={image}
												alt={stuff.name}
												variant="card"
												className={
													idx === 0
														? "w-full h-full object-cover object-center rounded-xl rounded-tr-sm rounded-br-sm bg-neutral-800 border border-neutral-700/50"
														: "w-full h-full object-cover object-center rounded-xl rounded-tl-sm rounded-bl-sm bg-neutral-800 border border-neutral-700/50"
												}
											/>
										</button>
									</div>
								))}
							</div>
						) : (
							<div className="aspect-video grid grid-cols-2 grid-rows-2 gap-1.5">
								<div
									className="row-span-2 overflow-hidden rounded-xl"
									style={{
										borderTopRightRadius: "6px",
										borderBottomRightRadius: "6px",
									}}
								>
									<button
										type="button"
										onClick={() => setLightboxSrc(images[0])}
										className="block w-full h-full cursor-pointer"
									>
										<Image
											src={images[0]}
											alt={stuff.name}
											variant="card"
											className="w-full h-full object-cover object-center bg-neutral-800 border border-neutral-700/50"
										/>
									</button>
								</div>

								<div
									className="overflow-hidden rounded-xl"
									style={{
										borderTopLeftRadius: "6px",
										borderBottomLeftRadius: "6px",
										borderBottomRightRadius: "6px",
									}}
								>
									<button
										type="button"
										onClick={() => setLightboxSrc(images[1])}
										className="block w-full h-full cursor-pointer"
									>
										<Image
											src={images[1]}
											alt={stuff.name}
											variant="card"
											className="w-full h-full object-cover object-center bg-neutral-800 border border-neutral-700/50"
										/>
									</button>
								</div>
								<div
									className="overflow-hidden rounded-xl"
									style={{
										borderTopLeftRadius: "6px",
										borderBottomLeftRadius: "6px",
										borderTopRightRadius: "6px",
									}}
								>
									<button
										type="button"
										onClick={() => setLightboxSrc(images[2])}
										className="block w-full h-full cursor-pointer"
									>
										<Image
											src={images[2]}
											alt={stuff.name}
											variant="card"
											className="w-full h-full object-cover object-center bg-neutral-800 border border-neutral-700/50"
										/>
									</button>
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
