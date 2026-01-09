import { Link } from "@tanstack/react-router";
import { Footer } from "~/components/layout/footer";
import { useMemo } from "react";
import {
	useRecentTags,
	useRecentStuff,
} from "~/features/display-ratings/queries";

export function RightSidebar({
	isAuthenticated = true,
}: {
	isAuthenticated?: boolean;
}) {
	const { data: recentStuff, isLoading: loadingStuff } = useRecentStuff();
	const { data: recentTags, isLoading: loadingTags } = useRecentTags();

	const skeletonStuffKeys = useMemo(
		() => Array.from({ length: 5 }, () => crypto.randomUUID()),
		[],
	);
	const skeletonTagKeys = useMemo(
		() => Array.from({ length: 6 }, () => crypto.randomUUID()),
		[],
	);

	return (
		<aside className="w-80 px-4 py-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
			<div className="space-y-4">
				{isAuthenticated && (
					<>
						{/* Recent Reviewed */}
						<section>
							<p className="text-md font-semibold text-white mb-2 px-1">
								Recently Reviewed
							</p>
							<div className="bg-neutral-800/30 rounded-xl border border-neutral-800/50 overflow-hidden">
								{loadingStuff
									? skeletonStuffKeys.map((sKey, i) => (
											<div
												key={sKey}
												className={`block px-4 py-2 ${
													i !== skeletonStuffKeys.length - 1
														? "border-b border-neutral-800/50"
														: ""
												}`}
											>
												<div className="h-4 bg-neutral-800 rounded w-3/4" />
											</div>
										))
									: (recentStuff ?? []).map((thing, i) => (
											<Link
												key={thing.id}
												to="/"
												className={`block px-4 py-2 hover:bg-neutral-800/50 transition-colors ${
													i !== (recentStuff ?? []).length - 1
														? "border-b border-neutral-800/50"
														: ""
												}`}
											>
												<p className="text-sm font-medium text-white">
													{thing.name}
												</p>
											</Link>
										))}
							</div>
						</section>

						{/* Recent Tags */}
						<section>
							<p className="text-md font-semibold text-white mb-2 px-1">
								Popular Tags
							</p>
							<div className="flex flex-wrap gap-1.5 px-1">
								{loadingTags
									? skeletonTagKeys.map((sKey) => (
											<div
												key={sKey}
												className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 text-sm font-medium rounded-md"
											>
												<div className="h-4 bg-neutral-800 rounded w-12" />
											</div>
										))
									: (recentTags ?? []).map((tag) => (
											<Link
												key={tag.name}
												to="/"
												className="inline-flex items-center px-1.5 py-0.5 bg-neutral-800/70 text-neutral-400 hover:text-neutral-300 text-sm font-medium transition-colors rounded-md"
											>
												#{tag.name}
											</Link>
										))}
							</div>
						</section>
					</>
				)}

				{/* Footer Links */}
				<Footer />
			</div>
		</aside>
	);
}
