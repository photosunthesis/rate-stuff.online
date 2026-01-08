import { useState } from "react";
import { useIsAuthenticated } from "~/features/session/queries";
import { CreateRatingModal } from "~/features/create-rating/components/create-rating-modal";
import { CreateRatingTrigger } from "~/features/create-rating/components/create-rating-trigger";

export function CreateRatingSection() {
	const [isOpen, setIsOpen] = useState(false);
	const { isAuthenticated } = useIsAuthenticated();

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="p-4 border-b border-neutral-800 bg-neutral-950/50 sticky top-0 backdrop-blur-md z-10 space-y-4">
			<CreateRatingTrigger onTrigger={() => setIsOpen(true)} />
			<CreateRatingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</div>
	);
}
