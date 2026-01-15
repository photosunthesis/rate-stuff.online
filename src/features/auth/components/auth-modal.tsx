import { Link } from "@tanstack/react-router";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalTitle,
	ModalDescription,
} from "~/components/ui/modal";
import { Button } from "~/components/ui/button";

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	description?: string;
}

export function AuthModal({
	isOpen,
	onClose,
	title = "Curious to see more?",
	description = "Sign in or create an account to start exploring opinions on literally anything.",
}: AuthModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent width="sm">
				<ModalHeader>
					<ModalTitle>{title}</ModalTitle>
					<div className="mb-2" />
					<ModalDescription>{description}</ModalDescription>
				</ModalHeader>

				<div className="p-4 flex justify-end gap-3">
					<Link to="/sign-in">
						<Button variant="secondary">Sign In</Button>
					</Link>
					<Link to="/sign-up">
						<Button variant="primary">Create Account</Button>
					</Link>
				</div>
			</ModalContent>
		</Modal>
	);
}
