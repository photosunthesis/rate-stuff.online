import { Link } from "@tanstack/react-router";
import { AppLogo } from "./app-logo";
import { useEffect } from "react";

export function NotFound() {
	useEffect(() => {
		document.title = "(ó﹏ò｡)";

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
		ogTitle.content = "Error 404 - Page Not Found";

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
		<div className="flex items-center justify-center min-h-screen bg-neutral-950">
			<div className="text-center px-4">
				<div className="flex items-center justify-center gap-2 mb-4">
					<h1 className="text-5xl text-white font-semibold">404</h1>
					<AppLogo size={40} />
				</div>
				<p className="text-neutral-500 text-sm w-64 mx-auto leading-[1.6]">
					We searched everywhere. This page is either invalid or just doesn't
					exist.
				</p>
				<div className="mt-2">
					<Link
						to="/"
						className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors text-sm"
					>
						Go to homepage
					</Link>
				</div>
			</div>
		</div>
	);
}
