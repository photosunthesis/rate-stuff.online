import { createFileRoute } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";

export const Route = createFileRoute("/terms")({
	component: RouteComponent,
	head: () => {
		const title = "Terms & Conditions - Rate Stuff Online";
		const description =
			"Terms and conditions for using Rate Stuff Online, a small hobby project.";

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ name: "robots", content: "index, follow" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: "https://rate-stuff.online/terms" },
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "/terms" }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						name: title,
						description,
						url: "https://rate-stuff.online/terms",
						dateModified: "2026-01-15",
						publisher: {
							"@type": "Organization",
							name: "Rate Stuff Online",
							url: "https://rate-stuff.online",
						},
					}),
				},
			],
		};
	},
});

function RouteComponent() {
	return (
		<main className="max-w-2xl mx-auto px-4 py-12 text-sm text-neutral-200">
			<div className="flex justify-start mb-6">
				<AppLogo size={48} />
			</div>
			<h1 className="text-2xl font-semibold mb-4">Terms &amp; Conditions</h1>

			<p className="mb-4">
				Welcome to Rate Stuff Online. These Terms &amp; Conditions govern your
				use of this website. By using the site you agree to these terms, so
				please read them carefully.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">About this project</h2>
			<p className="mb-4">
				Rate Stuff Online is a small hobby project. We (the site maintainers)
				operate and maintain the service. This site is provided "as-is" for
				personal and community use.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Accounts &amp; Content</h2>
			<p className="mb-2">
				You may create an account to post reviews, ratings, and images. You are
				responsible for anything you post. You retain ownership of your content
				but by posting it you grant the site a license to display and transmit
				it as part of the service.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Prohibited conduct</h2>
			<p className="mb-4">
				Do not post illegal, infringing, or abusive content. The site may remove
				content or restrict accounts that violate these terms.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">
				Disclaimer &amp; liability
			</h2>
			<p className="mb-4">
				This site is provided for informational and entertainment purposes. To
				the fullest extent permitted by law, we disclaim all warranties and will
				not be liable for damages arising from use of the service.{" "}
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Changes</h2>
			<p className="mb-4">
				We may update these terms occasionally. Continued use of the site after
				changes means you accept the new terms.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Contact</h2>
			<p>
				Questions about these Terms can be sent to the site maintainers at
				<a
					className="text-emerald-400 underline ml-1"
					href="mailto:hello@rate-stuff.online"
				>
					hello@rate-stuff.online
				</a>
				.
			</p>

			<div className="mt-6 text-sm text-neutral-500">
				Last updated: January 15, 2026
			</div>
		</main>
	);
}
