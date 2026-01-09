import { Link } from "@tanstack/react-router";
import { Footer } from "~/components/layout/footer";

const recentThings = [
	{ id: "1", name: "The Moon", category: "Space" },
	{ id: "2", name: "Espresso", category: "Drinks" },
	{ id: "3", name: "Mechanical Keyboards", category: "Tech" },
	{ id: "4", name: "Rust Programming Language", category: "Coding" },
	{ id: "5", name: "Interstellar (2014)", category: "Movies" },
];

const recentTags = [
	{ name: "space", count: 128 },
	{ name: "coffee", count: 85 },
	{ name: "tech", count: 243 },
	{ name: "coding", count: 156 },
	{ name: "movies", count: 92 },
];

export function RightSidebar({
	isAuthenticated = true,
}: {
	isAuthenticated?: boolean;
}) {
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
								{recentThings.map((thing, i) => (
									<Link
										key={thing.id}
										to="/"
										className={`block px-4 py-2 hover:bg-neutral-800/50 transition-colors ${
											i !== recentThings.length - 1
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
								{recentTags.map((tag) => (
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
