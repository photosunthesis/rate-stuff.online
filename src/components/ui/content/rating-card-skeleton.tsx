interface Props {
	variant?: "rating" | "user" | "stuff";
	noIndent?: boolean;
	hideAvatar?: boolean;
	showImage?: boolean;
}

export function RatingCardSkeleton({
	variant = "rating",
	noIndent = false,
	hideAvatar = false,
	showImage = false,
}: Props) {
	const indent = noIndent ? "" : "ml-11";
	const titleMargin = variant === "user" ? "mb-3" : "mb-2";

	const header =
		hideAvatar || variant === "user" ? (
			<div
				className={`flex items-center gap-1 text-base ${variant === "user" ? "mb-2" : "mb-0"}`}
			>
				<div
					className={`h-3 bg-neutral-800/40 rounded w-28 ${variant === "user" ? "" : "mb-2"}`}
				/>
			</div>
		) : (
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-neutral-800/40" />
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 flex-wrap text-base">
						<div className="h-3 bg-neutral-800/40 rounded w-48 mb-2" />
					</div>
				</div>
			</div>
		);

	const imagePlaceholder = showImage ? (
		<div className={`${indent} mb-3`}>
			<div className="h-40 bg-neutral-900/40 rounded-xl" />
		</div>
	) : null;

	return (
		<div className="px-8 py-4 animate-pulse pointer-events-none">
			{header}

			<div className={`${titleMargin} ${indent}`}>
				<div className="h-4 bg-neutral-800/40 rounded w-56" />
			</div>

			{imagePlaceholder}

			<div className={`${indent} mb-3`}>
				<div className="h-3 bg-neutral-800/40 rounded w-full mb-2" />
				<div className="h-3 bg-neutral-800/40 rounded w-5/6 mb-2" />
				<div className="h-3 bg-neutral-800/40 rounded w-3/4" />
			</div>

			<div className={`flex flex-wrap gap-2 mb-3 ${indent}`}>
				<div className="h-6 w-16 bg-neutral-800/40 rounded-md" />
				<div className="h-6 w-12 bg-neutral-800/40 rounded-md" />
			</div>

			<div className={`${noIndent ? "" : "ml-11"} flex items-center gap-3`}>
				<div className="h-6 w-24 bg-neutral-800/40 rounded-md" />
				<div className="h-6 w-16 bg-neutral-800/40 rounded-md" />
			</div>
		</div>
	);
}
