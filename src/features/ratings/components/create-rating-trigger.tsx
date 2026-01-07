import { User } from "lucide-react";

interface CreateRatingTriggerProps {
	onTrigger: () => void;
}

export function CreateRatingTrigger({ onTrigger }: CreateRatingTriggerProps) {
	return (
		<div className="flex gap-4 items-center w-full">
			<div className="w-10 h-10 rounded-full bg-neutral-800 shrink-0 border border-neutral-700 flex items-center justify-center text-neutral-500">
				<User className="w-5 h-5" />
			</div>
			<button
				type="button"
				onClick={onTrigger}
				className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-500 hover:text-neutral-400 hover:border-neutral-700 transition-colors text-left font-normal"
			>
				What are you rating today?
			</button>
		</div>
	);
}
