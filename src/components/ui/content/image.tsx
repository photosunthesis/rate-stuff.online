import { imagesBucketUrl } from "~/infrastructure/file-storage/service";

const PRESETS = {
	avatar: "avatar",
	card: "card",
	lightbox: "lightbox",
	raw: "raw",
} as const;

type ImageVariant = keyof typeof PRESETS;

const IK_TRANSFORMATIONS: Record<ImageVariant, string> = {
	avatar: "tr:h-240,w-240,q-60,f-webp",
	card: "tr:w-640,q-80,f-webp",
	lightbox: "tr:q-90,f-webp",
	raw: "",
};

const urlEndpoint = (
	import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string
).replace(/\/$/, "");

function buildImageKitUrl(path: string, variant: ImageVariant): string {
	const tr = IK_TRANSFORMATIONS[variant];
	if (!tr) return `${urlEndpoint}/${path}`;
	return `${urlEndpoint}/${tr}/${path}`;
}

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

	// Pre-signed IK URLs (from server) are used as-is; no further transformation.
	if (src && src.startsWith(urlEndpoint)) {
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

	if (imagePath) {
		const imageUrl = buildImageKitUrl(imagePath, variant);

		return (
			<img
				src={imageUrl}
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
