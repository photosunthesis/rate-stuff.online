import { useNavigate } from "@tanstack/react-router";
import { AppLogo } from "~/components/ui/app-logo";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export function ErrorOccurred() {
	useEffect(() => {
		document.title = "(°□°;)";

		let metaDescription = document.querySelector(
			'meta[name="description"]',
		) as HTMLMetaElement;
		if (!metaDescription) {
			metaDescription = document.createElement("meta");
			metaDescription.name = "description";
			document.head.appendChild(metaDescription);
		}
		metaDescription.content = "Something broke. Try again after a few minutes.";

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
		ogTitle.content = "Error 500 - Something Went Wrong";

		// Set og:description
		let ogDescription = document.querySelector(
			'meta[property="og:description"]',
		) as HTMLMetaElement;
		if (!ogDescription) {
			ogDescription = document.createElement("meta");
			ogDescription.setAttribute("property", "og:description");
			document.head.appendChild(ogDescription);
		}
		ogDescription.content = "Something went wrong. Please try again later.";
	}, []);

	const navigate = useNavigate();

	return (
		<div className="flex items-center justify-center min-h-screen bg-neutral-950">
			<div className="text-center px-4">
				<div className="flex items-center justify-center gap-2 mb-4">
					<h1 className="text-5xl text-white font-semibold">500</h1>
					<AppLogo size={40} />
				</div>
				<p className="text-neutral-500 text-sm mx-auto leading-[1.6]">
					Something went wrong, but we're on it. Try again shortly.
				</p>
				<div className="mt-4">
					<Button
						variant="secondary"
						className="w-auto! inline-flex px-3 py-1 text-sm rounded-md justify-center whitespace-nowrap"
						onClick={() => navigate({ to: "/" })}
					>
						Go to homepage
					</Button>
				</div>
			</div>
		</div>
	);
}
