import { createFileRoute } from "@tanstack/react-router";
import AppLogo from "~/components/ui/app-logo";

export const Route = createFileRoute("/privacy")({
	component: RouteComponent,
	head: () => {
		const title = "Privacy Policy - Rate Stuff Online";
		const description =
			"Privacy policy for Rate Stuff Online — what we collect and how we use it.";

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ name: "robots", content: "index, follow" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: "https://rate-stuff.online/privacy" },
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
			links: [{ rel: "canonical", href: "/privacy" }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						name: title,
						description,
						url: "https://rate-stuff.online/privacy",
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
			<h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>

			<p className="mb-4">
				This privacy policy explains how Rate Stuff Online is operated and
				maintained. We (the site maintainers) collect, use, and protect
				information. The policy is intentionally simple and concise.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Information we collect</h2>
			<ul className="list-disc pl-6 mb-4">
				<li>Account information (email, username).</li>
				<li>Profile details you choose to provide.</li>
				<li>Ratings, reviews, and images you upload.</li>
				<li>Log data and technical information for security and debugging.</li>
			</ul>

			<h2 className="text-lg font-medium mt-4 mb-2">How we use information</h2>
			<p className="mb-4">
				We use collected data to operate the site, allow you to sign in, display
				your content, and improve the service. We may also use anonymized data
				for analytics and debugging.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Content ownership</h2>
			<p className="mb-4">
				You keep ownership of any content you post. By uploading content you
				grant the site a non-exclusive license to host and display it as part of
				the service.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">
				Sharing &amp; third parties
			</h2>
			<p className="mb-4">
				We do not sell personal data. We may share data with service providers
				for hosting, email, or analytics — only as needed to operate the site.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Security</h2>
			<p className="mb-4">
				We take reasonable steps to secure data, but no internet service can be
				perfectly secure. Use strong passwords and contact the site maintainers
				if you have concerns.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Changes</h2>
			<p className="mb-4">
				We may update this policy occasionally; please check it from time to
				time.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Contact</h2>
			<p>
				If you have questions about privacy or data requests, please email us at
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
