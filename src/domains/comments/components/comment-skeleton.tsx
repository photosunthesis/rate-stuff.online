export function CommentSkeleton() {
	return (
		<div className="flex gap-3 py-3 px-2 animate-pulse pointer-events-none">
			<div className="w-8 h-8 rounded-full bg-neutral-800/40 shrink-0" />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 h-8 mb-2">
					<div className="h-3 bg-neutral-800/40 rounded w-24" />
					<div className="h-3 bg-neutral-800/40 rounded w-12" />
				</div>

				<div className="space-y-2 mb-2">
					<div className="h-3 bg-neutral-800/40 rounded w-full" />
					<div className="h-3 bg-neutral-800/40 rounded w-5/6" />
				</div>

				<div className="flex items-center gap-1 mt-1">
					<div className="h-6 w-16 bg-neutral-800/40 rounded-md" />
				</div>
			</div>
		</div>
	);
}
