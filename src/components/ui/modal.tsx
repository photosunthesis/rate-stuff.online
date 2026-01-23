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
	preventClose?: boolean;
	mobileVariant: "bottom-sheet" | "centered";
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
	preventClose?: boolean;
	mobileVariant?: "bottom-sheet" | "centered";
}

export function Modal({
	isOpen,
	onClose,
	children,
	preventClose,
	mobileVariant = "centered",
}: ModalProps) {
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
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		if (shouldRender && isOpen) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsVisible(true);
				});
			});
		}
	}, [shouldRender, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !preventClose) onClose();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose, preventClose]);

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
		<ModalContext.Provider
			value={{
				isOpen,
				onClose,
				isVisible,
				modalId,
				preventClose,
				mobileVariant,
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={`modal-title-${modalId}`}
				className={`fixed inset-0 z-50 flex justify-center md:items-center md:p-4 pointer-events-auto ${
					mobileVariant === "bottom-sheet" ? "items-end" : "items-center"
				}`}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					data-testid="modal-backdrop"
					className={`absolute inset-0 w-full h-full bg-neutral-950/60 border-none cursor-default focus:outline-none transition-all duration-300 ease-out pointer-events-auto ${
						isVisible
							? "opacity-100 backdrop-blur-[3px]"
							: "opacity-0 backdrop-blur-none"
					}`}
					onClick={(e) => {
						e.stopPropagation();
						if (!preventClose) onClose();
					}}
					onPointerDown={(e) => e.stopPropagation()}
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
	const { isVisible, mobileVariant } = useModal();

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
			className={`relative w-full z-10 overflow-hidden flex flex-col transition-all duration-300 ease-out pointer-events-auto
				${widthClasses[width]} 
				${
					mobileVariant === "bottom-sheet"
						? "h-dvh md:h-auto md:max-h-[85vh] rounded-t-xl md:rounded-xl md:border md:border-neutral-800"
						: "h-auto max-h-[90vh] rounded-xl m-4 border border-neutral-800"
				} 
				bg-neutral-950 shadow-2xl 
				${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"} 
				${className}`}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
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
			className={`flex flex-col space-y-1.5 text-left p-6 border-b border-neutral-800 ${className}`}
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
		<p className={`text-base text-neutral-400 ${className}`} {...props}>
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
	const { onClose, preventClose } = useModal();
	return (
		<button
			type="button"
			onClick={onClose}
			disabled={preventClose}
			className={`absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-neutral-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer ${className}`}
			{...props}
		>
			<X className="h-4 w-4" />
			<span className="sr-only">Close</span>
		</button>
	);
}
