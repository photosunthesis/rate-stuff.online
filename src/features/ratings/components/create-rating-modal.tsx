import { useEffect, useId, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CreateRatingForm } from "./create-rating-form";
import { useCreateRating } from "../hooks";

interface CreateRatingModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateRatingModal({ isOpen, onClose }: CreateRatingModalProps) {
	const modalId = useId();
	const [isClosing, setIsClosing] = useState(false);
	const EXIT_ANIMATION_MS = 250;
	const { createRating, isPending, error, validationErrors, reset } =
		useCreateRating();

	const handleClose = useCallback(() => {
		if (isClosing) return;
		setIsClosing(true);
		setTimeout(() => {
			onClose();
			setIsClosing(false);
			reset();
		}, EXIT_ANIMATION_MS);
	}, [onClose, isClosing, reset]);

	useEffect(() => {
		if (isOpen) setIsClosing(false);
	}, [isOpen]);

	// Handle Escape key
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

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [isOpen]);

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		// Only close if clicking directly on the backdrop, not the modal
		// Also prevent closing if the event is from a file input or other interactive elements
		if (
			e.target === e.currentTarget &&
			!(e.target as HTMLElement).closest("input[type='file']")
		) {
			handleClose();
		}
	};

	const handleFormSuccess = () => {
		handleClose();
	};

	if (!isOpen) {
		return null;
	}

	const modalContent = (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={`modal-title-${modalId}`}
			className={`fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 ${
				isClosing ? "animate-fade-out" : "animate-fade-in"
			}`}
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					handleClose();
				}
			}}
		>
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-neutral-950/70 ${
					isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
				}`}
			/>

			{/* Modal Container */}
			<div
				role="document"
				className={`relative w-full max-h-[90vh] md:max-w-2xl md:max-h-[85vh] md:rounded-2xl bg-neutral-900 border border-neutral-800 rounded-t-3xl shadow-2xl z-10 overflow-y-auto md:overflow-visible flex flex-col ${
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
				{/* Modal Content */}
				<div className="relative px-6 pt-12 pb-6 md:pb-8 overflow-y-auto">
					<button
						type="button"
						onClick={handleClose}
						className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
						aria-label="Close modal"
					>
						<X className="w-5 h-5" />
					</button>
					<div className="mb-4">
						<h2
							id={`modal-title-${modalId}`}
							className="text-2xl font-bold text-white"
						>
							Create Rating
						</h2>
					</div>
					<CreateRatingForm
						onSubmit={createRating}
						isPending={isPending}
						error={error}
						validationErrors={validationErrors}
						onSuccess={handleFormSuccess}
					/>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
