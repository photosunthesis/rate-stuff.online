import { useEffect, useState } from "react";
import { Modal, useModal } from "~/components/ui/modal";
import { X } from "lucide-react";

interface LightboxProps {
	src: string | null;
	alt?: string;
	onClose: () => void;
}

function LightboxContent({ src, alt }: { src: string; alt?: string }) {
	const { isVisible, onClose } = useModal();

	return (
		<div
			role="document"
			className={`relative max-w-[96vw] max-h-[96vh] w-full z-10 transition-all duration-300 ease-out ${
				isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
			}`}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				aria-label="Close"
				onClick={onClose}
				className="absolute top-3 right-3 z-50 p-3 md:p-3 rounded-full text-neutral-200 hover:text-white transition-colors backdrop-blur-sm bg-neutral-900/30 hover:bg-neutral-900/40 shadow-sm cursor-pointer"
			>
				<X size={24} />
			</button>

			<img
				src={src}
				alt={alt}
				className="w-full h-auto max-h-[92vh] object-contain"
			/>
		</div>
	);
}

export function Lightbox({ src, alt = "", onClose }: LightboxProps) {
	const [displaySrc, setDisplaySrc] = useState(src);

	useEffect(() => {
		if (src) {
			setDisplaySrc(src);
		}
	}, [src]);

	// We render the Modal even if src is null, relying on isOpen to trigger entry/exit animations.
	// We use displaySrc to ensure the image remains visible during the exit animation.
	return (
		<Modal isOpen={!!src} onClose={onClose} mobileVariant="bottom-sheet">
			{displaySrc && <LightboxContent src={displaySrc} alt={alt} />}
		</Modal>
	);
}
