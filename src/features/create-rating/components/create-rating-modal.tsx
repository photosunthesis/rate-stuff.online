import { Modal, ModalContent } from "~/components/ui/modal";
import { CreateRatingForm } from "~/features/create-rating/components/create-rating-form";
import { useCreateRating } from "~/features/create-rating/hooks";

interface CreateRatingModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateRatingModal({ isOpen, onClose }: CreateRatingModalProps) {
	const { createRating, isPending, errorMessage, validationErrors } =
		useCreateRating();

	const handleFormSuccess = () => {
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			preventClose={isPending}
			mobileVariant="bottom-sheet"
		>
			<ModalContent>
				<div className="relative flex-1 flex flex-col min-h-0">
					<CreateRatingForm
						onSubmit={createRating}
						isPending={isPending}
						errorMessage={errorMessage}
						validationErrors={validationErrors}
						onSuccess={handleFormSuccess}
						onCancel={onClose}
					/>
				</div>
			</ModalContent>
		</Modal>
	);
}
