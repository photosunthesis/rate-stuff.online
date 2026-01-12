import { useEffect, useState } from "react";
import { Avatar } from "~/components/ui/avatar";

const prompts = [
	"What's your take?",
	"Share your hot take",
	"Rate something cool",
	"Drop your opinion",
	"What's worth rating?",
	"What deserves a score?",
];

export function CreateRatingTrigger({
	onTrigger,
	user,
}: {
	onTrigger: () => void;
	user: { name?: string; image?: string };
}) {
	const [prompt, setPrompt] = useState("");

	useEffect(() => {
		setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
	}, []);

	return (
		<div className="flex gap-4 items-center w-full">
			<Avatar
				src={user?.image ?? null}
				alt={user?.name ?? "User"}
				size="sm"
				className="shrink-0"
			/>
			<button
				type="button"
				onClick={onTrigger}
				className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-500 hover:text-neutral-400 hover:border-neutral-700 transition-colors text-left font-normal"
			>
				{prompt}
			</button>
		</div>
	);
}
