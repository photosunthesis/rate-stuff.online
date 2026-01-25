import { createFileRoute } from "@tanstack/react-router";
import AppLogo from "~/components/ui/misc/app-logo";

export const Route = createFileRoute("/_public/terms")({
	component: RouteComponent,
	head: () => {
		const title = "Terms of Service - Rate Stuff Online";
		const description =
			"Terms of Service for using Rate Stuff Online, a small hobby project.";

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
						dateModified: "2026-01-25",
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
			<h1 className="text-2xl font-semibold mb-4">Terms of Service</h1>

			<p className="mb-4">
				Welcome to Rate Stuff Online. These Terms of Service govern your use of
				this website. By using the site you agree to these terms, so please read
				them carefully.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">About this project</h2>
			<p className="mb-4">
				Rate Stuff Online is a small hobby project. We (the site maintainers)
				operate and maintain the service. This site is provided "as-is" for
				personal and community use. Registration is currently invite-only.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Eligibility</h2>
			<p className="mb-4">
				You must be at least 13 years old to use this service. By creating an
				account, you represent and warrant that you meet this age requirement.
				If we discover a user is under 13, we will immediately terminate their
				account and delete their data as required by law.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Accounts &amp; Content</h2>
			<p className="mb-2">
				You may create an account to post reviews, ratings, and images. You are
				solely responsible for anything you post. You represent that you own or
				have the necessary rights to share the content you post, including any
				images. We do not claim ownership of your content, but by posting it you
				grant the site a license to display and transmit it as part of the
				service.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Prohibited Conduct</h2>
			<p className="mb-4">You agree not to use the service to:</p>
			<ul className="list-disc pl-6 mb-4 space-y-1">
				<li>Post illegal, infringing, defamatory, or abusive content.</li>
				<li>Harass, threaten, or intimidate other users.</li>
				<li>Spam, phish, or distribute malware.</li>
				<li>
					Attempt to bypass security measures or reverse engineer the site.
				</li>
			</ul>
			<p className="mb-4">
				We reserve the right to remove content or terminate accounts that
				violate these terms, or for technical/security reasons, at our
				discretion. Account termination decisions are final. We are not
				obligated to provide reasons.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Reporting Violations</h2>
			<p className="mb-4">
				Users can report violations by emailing{" "}
				<a
					className="underline underline-offset-2"
					href="mailto:hello@rate-stuff.online"
				>
					hello@rate-stuff.online
				</a>
				. We will investigate reports within 7 business days and remove content
				that violates these Terms or applicable law.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">DMCA & Copyright Policy</h2>
			<p className="mb-4">
				We respect the intellectual property rights of others. If you believe
				your copyright has been infringed, please notify our designated agent at{" "}
				<a
					className="underline underline-offset-2"
					href="mailto:hello@rate-stuff.online"
				>
					hello@rate-stuff.online
				</a>
				.
			</p>
			<p className="mb-4">
				Your notice must include: (a) a description of the copyrighted work; (b)
				the URL where the infringing material is located; and (c) your contact
				information. We will respond to valid notices by removing the infringing
				content.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Indemnification</h2>
			<p className="mb-4">
				You agree to indemnify and hold harmless Rate Stuff Online, its
				maintainers, and affiliates from any claims, damages, liabilities, and
				expenses (including legal fees) arising out of your use of the service
				or your violation of these terms.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">
				Disclaimer, Liability & Copyright
			</h2>
			<p className="mb-4">
				This site is provided for informational and entertainment purposes. We
				are not responsible for any user-generated content, including images,
				text, or other media. The user who posted the content is solely liable
				for any copyright infringement or other legal issues arising from it.
			</p>
			<p className="mb-4">
				To the fullest extent permitted by law, we disclaim all warranties and
				will not be liable for damages arising from use of the service. We
				reserve the right to remove any content alleged to be infringing without
				prior notice.
			</p>

			<h2 className="text-lg font-medium mt-4 mb-2">Governing Law</h2>
			<p className="mb-4">
				These terms are governed by the laws of the Republic of the Philippines,
				without regard to its conflict of law principles. Any disputes shall be
				resolved in the courts located in that jurisdiction.
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
					className="underline underline-offset-2 ml-1"
					href="mailto:hello@rate-stuff.online"
				>
					hello@rate-stuff.online
				</a>
				.
			</p>

			<div className="mt-6 text-base text-neutral-500">
				Last updated: January 25, 2026
			</div>
		</main>
	);
}
