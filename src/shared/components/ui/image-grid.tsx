import { Image } from "~/shared/components/ui/image";
import type { SignedImage } from "~/infrastructure/imagekit/sign";

interface ImageGridProps {
	images: SignedImage[];
	alt?: string;
	maxImages?: number;
	/** Called with the lightbox-quality signed URL when an image is clicked. */
	onImageClick?: (src: string) => void;
	className?: string;
}

export function ImageGrid({
	images,
	alt = "Image",
	maxImages = 4,
	onImageClick,
	className = "",
}: ImageGridProps) {
	if (!images || images.length === 0) return null;

	const displayImages = images.slice(0, Math.min(maxImages, 4));

	const renderImage = (image: SignedImage) => {
		const img = (
			<Image
				src={image.card}
				alt={alt}
				noBorder
				className="w-full h-full object-cover object-center"
			/>
		);

		if (onImageClick) {
			return (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onImageClick(image.lightbox);
					}}
					className="block w-full h-full cursor-pointer"
				>
					{img}
				</button>
			);
		}

		return img;
	};

	if (displayImages.length === 1) {
		return (
			<div
				className={`overflow-hidden rounded-2xl border border-neutral-700/50 bg-neutral-800 aspect-video ${className}`}
			>
				{renderImage(displayImages[0])}
			</div>
		);
	}

	if (displayImages.length === 2) {
		return (
			<div className={`flex gap-1.5 overflow-hidden ${className}`}>
				{displayImages.map((image, idx) => (
					<div
						key={image.card}
						className={`flex-1 overflow-hidden border border-neutral-700/50 bg-neutral-800 ${
							idx === 0
								? "rounded-2xl rounded-tr-md rounded-br-md"
								: "rounded-2xl rounded-tl-md rounded-bl-md"
						}`}
						style={{ aspectRatio: "1 / 1" }}
					>
						{renderImage(image)}
					</div>
				))}
			</div>
		);
	}

	if (displayImages.length === 3) {
		return (
			<div
				className={`aspect-video grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden ${className}`}
			>
				<div
					className="row-span-2 overflow-hidden rounded-2xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopRightRadius: "8px",
						borderBottomRightRadius: "8px",
					}}
				>
					{renderImage(displayImages[0])}
				</div>

				<div
					className="overflow-hidden rounded-2xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopLeftRadius: "8px",
						borderBottomLeftRadius: "8px",
						borderBottomRightRadius: "8px",
					}}
				>
					{renderImage(displayImages[1])}
				</div>
				<div
					className="overflow-hidden rounded-2xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopLeftRadius: "8px",
						borderBottomLeftRadius: "8px",
						borderTopRightRadius: "8px",
					}}
				>
					{renderImage(displayImages[2])}
				</div>
			</div>
		);
	}

	// 4 images: 2x2 grid
	const cornerStyles: React.CSSProperties[] = [
		{
			borderTopLeftRadius: "1rem",
			borderTopRightRadius: "8px",
			borderBottomLeftRadius: "8px",
			borderBottomRightRadius: "8px",
		},
		{
			borderTopRightRadius: "1rem",
			borderTopLeftRadius: "8px",
			borderBottomLeftRadius: "8px",
			borderBottomRightRadius: "8px",
		},
		{
			borderBottomLeftRadius: "1rem",
			borderTopLeftRadius: "8px",
			borderTopRightRadius: "8px",
			borderBottomRightRadius: "8px",
		},
		{
			borderBottomRightRadius: "1rem",
			borderTopLeftRadius: "8px",
			borderTopRightRadius: "8px",
			borderBottomLeftRadius: "8px",
		},
	];

	return (
		<div
			className={`aspect-video grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden ${className}`}
		>
			{displayImages.map((image, idx) => (
				<div
					key={image.card}
					className="overflow-hidden border border-neutral-700/50 bg-neutral-800"
					style={cornerStyles[idx]}
				>
					{renderImage(image)}
				</div>
			))}
		</div>
	);
}
