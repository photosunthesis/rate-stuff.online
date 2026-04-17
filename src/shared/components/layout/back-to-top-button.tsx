import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 150);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<button
			type="button"
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			aria-label="Back to top"
			className={`hidden md:flex fixed md:left-1/2 md:bottom-6 md:-translate-x-1/2 lg:left-[calc(50%-2rem)] w-10 h-10 rounded-xl border border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-500 items-center justify-center z-30 active:scale-95 cursor-pointer transition-all duration-300 ${
				visible
					? "opacity-100 pointer-events-auto"
					: "opacity-0 pointer-events-none"
			}`}
		>
			<ArrowUp className="w-4 h-4" />
		</button>
	);
}
