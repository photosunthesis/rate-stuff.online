import { Link } from "@tanstack/react-router";
import { AppLogo } from "~/components/ui/appLogo";
import { useEffect } from "react";

export function NotFound() {
	useEffect(() => {
		document.title = "Error 404";

		let metaDescription = document.querySelector(
			'meta[name="description"]',
		) as HTMLMetaElement;
		if (!metaDescription) {
			metaDescription = document.createElement("meta");
			metaDescription.name = "description";
			document.head.appendChild(metaDescription);
		}
		metaDescription.content =
			"The page you're looking for doesn't exist or has been moved.";

		let metaRobots = document.querySelector(
			'meta[name="robots"]',
		) as HTMLMetaElement;
		if (!metaRobots) {
			metaRobots = document.createElement("meta");
			metaRobots.name = "robots";
			document.head.appendChild(metaRobots);
		}
		metaRobots.content = "noindex, nofollow";

		// Set og:title
		let ogTitle = document.querySelector(
			'meta[property="og:title"]',
		) as HTMLMetaElement;
		if (!ogTitle) {
			ogTitle = document.createElement("meta");
			ogTitle.setAttribute("property", "og:title");
			document.head.appendChild(ogTitle);
		}
		ogTitle.content = "404 - Page Not Found";

		// Set og:description
		let ogDescription = document.querySelector(
			'meta[property="og:description"]',
		) as HTMLMetaElement;
		if (!ogDescription) {
			ogDescription = document.createElement("meta");
			ogDescription.setAttribute("property", "og:description");
			document.head.appendChild(ogDescription);
		}
		ogDescription.content = "Oops! The page you're looking for doesn't exist.";
	}, []);

	return (
		<div className="flex items-center justify-center min-h-screen bg-neutral-900">
			<div className="text-center px-4">
				<div className="flex items-center justify-center gap-2 mb-4">
					<h1 className="text-3xl text-white font-bold">(ó﹏ò｡)</h1>
					<AppLogo size={40} />
				</div>
				<p className="text-neutral-500 text-sm">We searched everywhere.</p>
				<p className="text-neutral-500 mb-4 text-sm">
					This page is either invalid or just doesn't exist.
				</p>
				<Link
					to="/"
					className="inline-block text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors rounded-lg"
				>
					Go to Home
				</Link>
			</div>
		</div>
	);
}
