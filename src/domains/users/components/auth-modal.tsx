import { Link } from "@tanstack/react-router";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalTitle,
	ModalDescription,
} from "~/components/ui/modal/modal";
import { Button } from "~/components/ui/form/button";
import { m } from "~/paraglide/messages";

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	description?: string;
}

export function AuthModal({
	isOpen,
	onClose,
	title = m.auth_modal_title(),
	description = m.auth_modal_description(),
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
						<Button variant="secondary">{m.nav_sign_in()}</Button>
					</Link>
					<Link to="/sign-up">
						<Button variant="primary">{m.nav_create_account()}</Button>
					</Link>
				</div>
			</ModalContent>
		</Modal>
	);
}
