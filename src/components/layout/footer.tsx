import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="px-1 pt-4">
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
				<Link
					to="/terms"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					Terms of Service
				</Link>
				<Link
					to="/privacy"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					Privacy Policy
				</Link>
				<a
					href="mailto:hello@rate-stuff.online"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					Contact Us
				</a>
				<span>
					<a
						href="https://github.com/photosunthesis/rate-stuff.online"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
					>
						GitHub
					</a>
				</span>
				<span>{`© 2025-${new Date().getFullYear()} Rate Stuff Online`}</span>
			</div>
		</footer>
	);
}
