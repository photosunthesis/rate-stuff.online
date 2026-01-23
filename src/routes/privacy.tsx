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
						dateModified: "2026-01-17",
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
		<main className="max-w-2xl mx-auto px-4 py-12 text-base text-neutral-200">
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
				<li>
					Technical data (IP address, browser type) via our logs and error
					tracking services.
				</li>
			</ul>

			<h2 className="text-lg font-medium mt-4 mb-2">Your Rights</h2>
			<p className="mb-2">
				Depending on your location (e.g., GDPR, CCPA), you may have specific
				rights regarding your data:
			</p>
			<ul className="list-disc pl-6 mb-4 space-y-1">
				<li>
					<strong>Access:</strong> Request a copy of the personal data we hold
					about you.
				</li>
				<li>
					<strong>Correction:</strong> Update inaccurate or incomplete data via
					your profile settings.
				</li>
				<li>
					<strong>Erasure:</strong> Request deletion of your account and
					associated data ("Right to be Forgotten").
				</li>
				<li>
					<strong>Portability:</strong> Request your data in a machine-readable
					format.
				</li>
			</ul>
			<p className="mb-4">
				To exercise these rights, please email us at{" "}
				<a
					className="text-emerald-400 underline"
					href="mailto:hello@rate-stuff.online"
				>
					hello@rate-stuff.online
				</a>
				. We will respond to data requests within 30 days of receipt. Please
				allow additional time for technical processing of deletions.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">How we use information</h2>
			<p className="mb-4">
				We use collected data to operate the site, allow you to sign in, display
				your content, and improve the service. We may also use anonymized data
				for analytics and debugging.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Content ownership</h2>
			<p className="mb-4">
				You keep ownership of any content you post and are responsible for
				ensuring you have the right to share it. By uploading content you grant
				the site a non-exclusive license to host, display, and transmit it as
				part of the service.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">
				Sharing &amp; third parties
			</h2>
			<p className="mb-4">
				We do not sell personal data. We share data only with trusted service
				providers necessary to operate the site:
			</p>
			<ul className="list-disc pl-6 mb-4 space-y-1">
				<li>
					<strong>Cloudflare:</strong> For hosting, security, and global content
					delivery. Cloudflare may set cookies for DDoS protection and
					performance optimization. See{" "}
					<a
						className="text-emerald-400 underline"
						href="https://www.cloudflare.com/privacypolicy/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Cloudflare's privacy policy
					</a>{" "}
					for details.
				</li>
				<li>
					<strong>Umami:</strong> For privacy-focused, anonymous analytics (no
					tracking cookies or personal identifiers).
				</li>
				<li>
					<strong>Bugsink:</strong> For error tracking and debugging. Bugsink
					collects error traces and technical logs to help us fix bugs. We
					exclude sensitive user data from these reports, but error messages may
					contain URLs or form field names for debugging purposes.
				</li>
			</ul>

			<h2 className="text-lg font-medium mt-4 mb-2">Children&#39;s Privacy</h2>
			<p className="mb-4">
				Our service is not intended for children under the age of 13. We do not
				knowingly collect personal data from children. If we become aware that a
				child has provided us with personal data, we will delete it.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Security</h2>
			<p className="mb-4">
				We take reasonable steps to secure data, but no internet service can be
				perfectly secure. Use strong passwords and contact the site maintainers
				if you have concerns.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">
				Data Breach Notification
			</h2>
			<p className="mb-4">
				In the event of a data breach affecting personal information, we will
				notify affected users within 72 hours via email (or as required by
				applicable law).
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

			<div className="mt-6 text-base text-neutral-500">
				Last updated: January 17, 2026
			</div>
		</main>
	);
}
