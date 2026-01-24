import { imagesBucketUrl } from "~/features/file-storage/service";

const PRESETS = {
	avatar: "avatar",
	card: "card",
	lightbox: "lightbox",
	raw: "raw",
} as const;

type ImageVariant = keyof typeof PRESETS;

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src?: string;
	path?: string;
	variant?: ImageVariant;
	width?: number | string;
	height?: number | string;
	noBorder?: boolean;
}

export function Image({
	src,
	path,
	variant = "card",
	className,
	alt,
	noBorder,
	...props
}: ImageProps) {
	let imagePath = path;

	if (!imagePath && src && src.startsWith(imagesBucketUrl)) {
		imagePath = src.replace(`${imagesBucketUrl}/`, "");
	}

	if (imagePath) {
		const apiUrl = `/api/image?path=${encodeURIComponent(imagePath)}&variant=${variant}`;

		return (
			<img
				src={apiUrl}
				className={`${className} ${
					noBorder ? "" : "border border-white/5 bg-neutral-900"
				}`}
				alt={alt}
				{...props}
			/>
		);
	}

	if (!src) return null;

	return (
		<img
			src={src}
			className={`${className} ${
				noBorder ? "" : "border border-white/5 bg-neutral-900"
			}`}
			alt={alt}
			{...props}
		/>
	);
}
