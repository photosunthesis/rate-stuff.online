import { IKImage } from "imagekitio-react";
import { imagesBucketUrl } from "~/features/file-storage/service";

// Define the presets as per user requirements
const PRESETS = {
	avatar: {
		transformation: [
			{ height: 240, width: 240, quality: 60, format: "webp" as const },
		],
	},
	card: {
		transformation: [{ width: 640, quality: 80, format: "webp" as const }],
	},
	lightbox: {
		transformation: [{ quality: 90, format: "webp" as const }],
	},
	raw: {
		transformation: [],
	},
};

type ImageVariant = keyof typeof PRESETS;

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src?: string;
	path?: string;
	variant?: ImageVariant;
	width?: number | string;
	height?: number | string;
}

export function Image({
	src,
	path,
	variant = "raw",
	className,
	alt,
	...props
}: ImageProps) {
	// If path is explicitly provided, use it.
	// If src is provided and matches our bucket URL, extract path.
	// Otherwise, fallback to a standard img tag (or handle external image via IK if needed, but for now standard img).

	let imagePath = path;

	if (!imagePath && src && src.startsWith(imagesBucketUrl)) {
		imagePath = src.replace(`${imagesBucketUrl}/`, "");
	}

	if (imagePath) {
		const { loading, ...rest } = props;
		const preset = PRESETS[variant];
		return (
			<IKImage
				path={imagePath}
				transformation={preset.transformation}
				className={className}
				loading={loading as "lazy" | undefined}
				alt={alt}
				{...rest}
			/>
		);
	}

	// Fallback for external images or null src
	if (!src) return null;

	return <img src={src} className={className} alt={alt} {...props} />;
}
