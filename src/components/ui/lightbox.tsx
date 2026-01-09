import { useEffect } from "react";

interface LightboxProps {
	src: string | null;
	alt?: string;
	onClose: () => void;
}

export function Lightbox({ src, alt = "", onClose }: LightboxProps) {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}

		if (src) {
			document.body.style.overflow = "hidden";
			window.addEventListener("keydown", onKey);
		}

		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
		};
	}, [src, onClose]);

	if (!src) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
			<div className="relative max-w-[96vw] max-h-[96vh] w-full">
				<button
					type="button"
					aria-label="Close"
					onClick={onClose}
					className="absolute right-2 top-2 z-60 text-white bg-neutral-900/60 hover:bg-neutral-900/80 rounded-full p-1"
				>
					✕
				</button>
				<img
					src={src}
					alt={alt}
					className="w-full h-auto max-h-[92vh] object-contain rounded"
				/>
			</div>
		</div>
	);
}
