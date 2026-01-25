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
	title = "Join the swarm",
	description = "We have opinions, ratings, and slightly better vibes.",
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
