import { Link } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";

export function Footer() {
	return (
		<footer className="px-1 pt-4">
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
				<Link
					to="/terms"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					{m.terms_of_service()}
				</Link>
				<Link
					to="/privacy"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					{m.privacy_policy()}
				</Link>
				<a
					href="mailto:hello@rate-stuff.online"
					className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
				>
					{m.footer_contact()}
				</a>
				<span>
					<a
						href="https://github.com/photosunthesis/rate-stuff.online"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline underline-offset-2 hover:text-neutral-400 transition-colors"
					>
						{m.footer_github()}
					</a>
				</span>
				<span>{m.copyright({ year: new Date().getFullYear() })}</span>
			</div>
		</footer>
	);
}
