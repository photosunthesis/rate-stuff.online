import { useState } from "react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalTitle,
	ModalDescription,
	ModalFooter,
} from "~/components/ui/modal";
import { Button } from "~/components/ui/button";

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
	const [isPending, setIsPending] = useState(false);

	const handleConfirm = async () => {
		setIsPending(true);
		try {
			await onConfirm();
		} finally {
			setIsPending(false);
			onClose();
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent width="sm">
				<ModalHeader>
					<ModalTitle>{title}</ModalTitle>
					<div className="mb-2" />
					{description && <ModalDescription>{description}</ModalDescription>}
				</ModalHeader>
				<ModalFooter className="flex-row! justify-end! space-x-2!">
					<Button
						type="button"
						onClick={() => onClose()}
						variant="secondary"
						className="w-auto!"
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						variant={destructive ? "destructive" : "primary"}
						className="w-auto!"
						isLoading={isPending}
						disabled={isPending}
					>
						{confirmLabel}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
