import { useState } from "react";
import { CreateRatingModal } from "~/lib/features/create-rating/components/create-rating-modal";
import { CreateRatingTrigger } from "~/lib/features/create-rating/components/create-rating-trigger";

export function CreateRatingSection({
	user,
}: {
	user: { name?: string; image?: string };
}) {
	const [isOpen, setIsOpen] = useState(false);

	if (!user) return null;

	return (
		<div className="p-4 border-b border-neutral-800 bg-neutral-950 space-y-4">
			<CreateRatingTrigger onTrigger={() => setIsOpen(true)} user={user} />
			<CreateRatingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</div>
	);
}
