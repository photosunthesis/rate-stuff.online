import {
	useEffect,
	useId,
	useState,
	useContext,
	createContext,
	type ReactNode,
	type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalContextValue {
	isOpen: boolean;
	onClose: () => void;
	isVisible: boolean;
	modalId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
	const context = useContext(ModalContext);
	if (!context) {
		throw new Error("useModal must be used within a Modal");
	}
	return context;
}

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
	const modalId = useId();
	const [isVisible, setIsVisible] = useState(false);
	const [shouldRender, setShouldRender] = useState(isOpen);

	useEffect(() => {
		if (isOpen) {
			setShouldRender(true);
		} else {
			setIsVisible(false);
			const timer = setTimeout(() => {
				setShouldRender(false);
			}, 300); // Match transition duration
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		if (shouldRender && isOpen) {
			// Double rAF ensures the browser paints the initial state (opacity-0) before transitioning
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsVisible(true);
				});
			});
		}
	}, [shouldRender, isOpen]);

	// Handle Escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	// Lock body scroll
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "";
			};
		}
	}, [isOpen]);

	if (!shouldRender) return null;

	const content = (
		<ModalContext.Provider value={{ isOpen, onClose, isVisible, modalId }}>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={`modal-title-${modalId}`}
				className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
			>
				{/* Backdrop */}
				<button
					type="button"
					data-testid="modal-backdrop"
					className={`absolute inset-0 w-full h-full bg-neutral-950/60 border-none cursor-default focus:outline-none transition-all duration-300 ease-out ${
						isVisible
							? "opacity-100 backdrop-blur-[3px]"
							: "opacity-0 backdrop-blur-none"
					}`}
					onClick={onClose}
					tabIndex={-1}
				/>
				{children}
			</div>
		</ModalContext.Provider>
	);

	return createPortal(content, document.body);
}

interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
	width?: "sm" | "md" | "lg" | "xl" | "full";
}

export function ModalContent({
	children,
	className = "",
	width = "md",
	...props
}: ModalContentProps) {
	const { isVisible } = useModal();

	const widthClasses = {
		sm: "md:max-w-md",
		md: "md:max-w-2xl",
		lg: "md:max-w-4xl",
		xl: "md:max-w-6xl",
		full: "md:max-w-[96vw]",
	};

	return (
		<div
			role="document"
			className={`relative w-full h-screen md:h-auto ${widthClasses[width]} max-h-[85vh] rounded-t-xl md:rounded-xl bg-neutral-900 md:border md:border-neutral-800 shadow-2xl z-10 overflow-hidden flex flex-col transition-all duration-300 ease-out ${
				isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
			} ${className}`}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			{...props}
		>
			{children}
		</div>
	);
}

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({
	children,
	className = "",
	...props
}: ModalHeaderProps) {
	return (
		<div
			className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b border-neutral-800 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function ModalTitle({
	children,
	className = "",
	...props
}: ModalTitleProps) {
	const { modalId } = useModal();
	return (
		<h2
			id={`modal-title-${modalId}`}
			className={`text-lg font-semibold leading-none tracking-tight text-white ${className}`}
			{...props}
		>
			{children}
		</h2>
	);
}

interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export function ModalDescription({
	children,
	className = "",
	...props
}: ModalDescriptionProps) {
	return (
		<p className={`text-sm text-neutral-400 ${className}`} {...props}>
			{children}
		</p>
	);
}

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function ModalFooter({
	children,
	className = "",
	...props
}: ModalFooterProps) {
	return (
		<div
			className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-3 border-t border-neutral-800 bg-neutral-900/50 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

interface ModalCloseProps extends HTMLAttributes<HTMLButtonElement> {}

export function ModalClose({ className = "", ...props }: ModalCloseProps) {
	const { onClose } = useModal();
	return (
		<button
			type="button"
			onClick={onClose}
			className={`absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-neutral-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer ${className}`}
			{...props}
		>
			<X className="h-4 w-4" />
			<span className="sr-only">Close</span>
		</button>
	);
}
