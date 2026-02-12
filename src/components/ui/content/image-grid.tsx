import { Image } from "~/components/ui/content/image";

interface ImageGridProps {
	images: string[];
	alt?: string;
	maxImages?: number;
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

	const renderImage = (src: string) => {
		const img = (
			<Image
				src={src}
				alt={alt}
				variant="card"
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
						onImageClick(src);
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
			<div className={className}>
				<div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800 aspect-video">
					{renderImage(displayImages[0])}
				</div>
			</div>
		);
	}

	if (displayImages.length === 2) {
		return (
			<div className={`flex gap-1.5 ${className}`}>
				{displayImages.map((src, idx) => (
					<div
						key={src}
						className={`flex-1 overflow-hidden border border-neutral-700/50 bg-neutral-800 ${
							idx === 0
								? "rounded-xl rounded-tr-sm rounded-br-sm"
								: "rounded-xl rounded-tl-sm rounded-bl-sm"
						}`}
						style={{ aspectRatio: "1 / 1" }}
					>
						{renderImage(src)}
					</div>
				))}
			</div>
		);
	}

	if (displayImages.length === 3) {
		return (
			<div
				className={`aspect-video grid grid-cols-2 grid-rows-2 gap-1.5 ${className}`}
			>
				<div
					className="row-span-2 overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopRightRadius: "6px",
						borderBottomRightRadius: "6px",
					}}
				>
					{renderImage(displayImages[0])}
				</div>

				<div
					className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopLeftRadius: "6px",
						borderBottomLeftRadius: "6px",
						borderBottomRightRadius: "6px",
					}}
				>
					{renderImage(displayImages[1])}
				</div>
				<div
					className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800"
					style={{
						borderTopLeftRadius: "6px",
						borderBottomLeftRadius: "6px",
						borderTopRightRadius: "6px",
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
			borderTopLeftRadius: "0.75rem",
			borderTopRightRadius: "6px",
			borderBottomLeftRadius: "6px",
			borderBottomRightRadius: "6px",
		},
		{
			borderTopRightRadius: "0.75rem",
			borderTopLeftRadius: "6px",
			borderBottomLeftRadius: "6px",
			borderBottomRightRadius: "6px",
		},
		{
			borderBottomLeftRadius: "0.75rem",
			borderTopLeftRadius: "6px",
			borderTopRightRadius: "6px",
			borderBottomRightRadius: "6px",
		},
		{
			borderBottomRightRadius: "0.75rem",
			borderTopLeftRadius: "6px",
			borderTopRightRadius: "6px",
			borderBottomLeftRadius: "6px",
		},
	];

	return (
		<div
			className={`aspect-video grid grid-cols-2 grid-rows-2 gap-1.5 ${className}`}
		>
			{displayImages.map((src, idx) => (
				<div
					key={src}
					className="overflow-hidden border border-neutral-700/50 bg-neutral-800"
					style={cornerStyles[idx]}
				>
					{renderImage(src)}
				</div>
			))}
		</div>
	);
}
