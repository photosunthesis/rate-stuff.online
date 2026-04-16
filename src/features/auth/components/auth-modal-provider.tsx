import { createContext, useContext, useState, useCallback } from "react";
import { AuthModal } from "./auth-modal";

const AuthModalContext = createContext<{ openAuthModal: () => void } | null>(
	null,
);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const openAuthModal = useCallback(() => setIsOpen(true), []);

	return (
		<AuthModalContext value={{ openAuthModal }}>
			{children}
			<AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</AuthModalContext>
	);
}

export function useAuthModal() {
	const context = useContext(AuthModalContext);
	if (!context) {
		throw new Error("useAuthModal must be used within an AuthModalProvider");
	}
	return context;
}
