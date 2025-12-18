export function Footer() {
	return (
		<footer className="px-1 pt-4">
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
				<a href="/" className="hover:underline">
					Terms & Conditions
				</a>
				<a href="/" className="hover:underline">
					Privacy Policy
				</a>
				<span>
					Built by{" "}
					<a
						href="https://sun-envidiado.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:underline"
					>
						Sun Envidiado
					</a>
				</span>
				<span>© 2025 Rate Stuff Online</span>
			</div>
		</footer>
	);
}
