import { Link } from "@tanstack/react-router";
import { Footer } from "./footer";

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
		<aside className="w-80 px-6 py-6 hidden lg:block sticky top-0 h-screen overflow-y-auto">
			<div className="space-y-4">
				{isAuthenticated && (
					<>
						{/* Recent Things */}
						<section>
							<h2 className="text-md font-bold text-white mb-2 px-1">
								Recent Things
							</h2>
							<div className="bg-neutral-800/30 rounded-xl border border-neutral-800/50 overflow-hidden">
								{recentThings.map((thing, i) => (
									<Link
										key={thing.id}
										to="/"
										className={`block px-4 py-3 hover:bg-neutral-800/50 transition-colors ${
											i !== recentThings.length - 1
												? "border-b border-neutral-800/50"
												: ""
										}`}
									>
										<p className="text-sm font-medium text-white">
											{thing.name}
										</p>
										<p className="text-xs text-neutral-500 mt-0.5">
											{thing.category}
										</p>
									</Link>
								))}
							</div>
						</section>

						{/* Recent Tags */}
						<section>
							<h2 className="text-md font-bold text-white mb-2 px-1">
								Popular Tags
							</h2>
							<div className="flex flex-wrap gap-2 px-1">
								{recentTags.map((tag) => (
									<Link
										key={tag.name}
										to="/"
										className="px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs font-medium transition-all"
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
