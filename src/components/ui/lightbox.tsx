import { useEffect, useCallback, useState } from "react";
import { X } from "lucide-react";

interface LightboxProps {
	src: string | null;
	alt?: string;
	onClose: () => void;
}

export function Lightbox({ src, alt = "", onClose }: LightboxProps) {
	const [isClosing, setIsClosing] = useState(false);
	const EXIT_ANIMATION_MS = 250;

	const handleClose = useCallback(() => {
		if (isClosing) return;
		setIsClosing(true);
		setTimeout(() => {
			onClose();
			setIsClosing(false);
		}, EXIT_ANIMATION_MS);
	}, [isClosing, onClose]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") handleClose();
		}

		if (src) {
			document.body.style.overflow = "hidden";
			window.addEventListener("keydown", onKey);
		}

		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
		};
	}, [src, handleClose]);

	useEffect(() => {
		if (src) setIsClosing(false);
	}, [src]);

	if (!src) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
				isClosing ? "animate-fade-out" : "animate-fade-in"
			}`}
			onClick={handleClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") handleClose();
			}}
		>
			<div
				className={`absolute inset-0 bg-neutral-950/70 ${
					isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
				}`}
			/>

			<div
				role="document"
				className={`relative max-w-[96vw] max-h-[96vh] w-full z-10 ${
					isClosing
						? "animate-zoom-out animate-fade-out"
						: "animate-zoom-in animate-fade-in"
				}`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					aria-label="Close"
					onClick={handleClose}
					className="absolute top-3 right-3 z-20 p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
				>
					<X size={18} />
				</button>

				<img
					src={src}
					alt={alt}
					className="w-full h-auto max-h-[92vh] object-contain"
				/>
			</div>
		</div>
	);
}
