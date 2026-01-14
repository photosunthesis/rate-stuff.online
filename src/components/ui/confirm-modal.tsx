import { useEffect, useId, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	description?: string;
	confirmLabel?: string;
	destructive?: boolean;
	onConfirm: () => Promise<void> | void;
}

export function ConfirmModal({
	isOpen,
	onClose,
	title = "Are you sure?",
	description,
	confirmLabel = "Confirm",
	destructive = false,
	onConfirm,
}: ConfirmModalProps) {
	const modalId = useId();
	const [isClosing, setIsClosing] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const EXIT_ANIMATION_MS = 250;

	const handleClose = useCallback(
		(opts?: { immediate?: boolean }) => {
			const immediate = opts?.immediate ?? false;
			if (isClosing && !immediate) return;

			if (immediate) {
				onClose();
				setIsClosing(false);
				setIsPending(false);
				return;
			}

			setIsClosing(true);
			setTimeout(() => {
				onClose();
				setIsClosing(false);
				setIsPending(false);
			}, EXIT_ANIMATION_MS);
		},
		[onClose, isClosing],
	);

	useEffect(() => {
		if (isOpen) setIsClosing(false);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, handleClose]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [isOpen]);

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};

	const handleConfirm = async () => {
		setIsPending(true);
		try {
			await onConfirm();
		} finally {
			setIsPending(false);
			handleClose();
		}
	};

	const confirmBtnClass = destructive
		? "px-5 py-2 rounded-xl bg-red-500/40 hover:bg-red-500/30 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer font-medium"
		: "px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer font-medium";

	if (!isOpen) return null;

	const modalContent = (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={`modal-title-${modalId}`}
			className={`fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 ${
				isClosing ? "animate-fade-out" : "animate-fade-in"
			}`}
			onMouseDown={handleBackdropClick}
		>
			<div
				className={`absolute inset-0 bg-neutral-950/70 ${
					isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
				}`}
			/>

			<div
				role="document"
				className={`relative w-full md:max-w-md md:h-auto md:rounded-lg bg-neutral-900 border border-neutral-800 shadow-md z-10 overflow-hidden flex flex-col ${
					isClosing
						? "animate-zoom-out animate-fade-out"
						: "animate-zoom-in animate-fade-in"
				}`}
				onClick={(e) => {
					e.stopPropagation();
				}}
				onKeyDown={(e) => {
					e.stopPropagation();
				}}
			>
				<button
					type="button"
					onClick={() => handleClose()}
					aria-label="Close"
					className="absolute top-3 right-3 z-20 p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
				>
					<X size={18} />
				</button>

				<div className="relative flex-1 flex flex-col min-h-0 p-4">
					<div className="mb-4">
						<h2
							id={`modal-title-${modalId}`}
							className="text-lg font-semibold text-white"
						>
							{title}
						</h2>
						{description && (
							<p className="mt-2 text-sm text-neutral-400">{description}</p>
						)}
					</div>

					<div className="mt-auto flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={() => handleClose()}
							className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-800/60 text-neutral-300 transition-colors cursor-pointer font-medium"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							disabled={isPending}
							className={confirmBtnClass}
						>
							{confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
