import { useEffect, useId, useCallback, useState } from "react";
import { createPortal } from "react-dom";
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

	const handleBackdropClick = () => {
		handleClose();
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
				className={`relative w-full h-screen md:h-auto md:max-w-2xl md:max-h-[85vh] md:rounded-2xl bg-neutral-900 md:border md:border-neutral-800 shadow-2xl z-10 overflow-hidden flex flex-col ${
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
				<div className="relative flex-1 flex flex-col min-h-0">
					<CreateRatingForm
						onSubmit={createRating}
						isPending={isPending}
						error={error}
						validationErrors={validationErrors}
						onSuccess={handleFormSuccess}
						onCancel={handleClose}
					/>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
