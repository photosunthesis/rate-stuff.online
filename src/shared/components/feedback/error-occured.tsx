import { useNavigate } from "@tanstack/react-router";
import { AppLogo } from "~/shared/components/ui/app-logo";
import { useEffect } from "react";
import { Button } from "~/shared/components/ui/button";
import { useUmami } from "@danielgtmn/umami-react";
import { m } from "~/paraglide/messages";

interface ErrorOccurredProps {
	error?: Error;
	reset?: () => void;
}

export function ErrorOccurred({ error, reset }: ErrorOccurredProps) {
	const umami = useUmami();

	useEffect(() => {
		if (umami && error) {
			umami.track("app_error", { message: error.message });
		}
	}, [umami, error]);

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
			<div className="text-center px-4 max-w-lg mx-auto">
				<div className="flex items-center justify-center gap-2 mb-4">
					<h1 className="text-5xl text-white font-semibold">500</h1>
					<AppLogo size={40} />
				</div>
				<p className="text-neutral-500 text-base mx-auto leading-[1.6] mb-4">
					{error?.message || m.error_message()}
				</p>

				{process.env.NODE_ENV === "development" && error?.stack && (
					<div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-md text-left overflow-auto max-h-48">
						<code className="text-xs text-red-200 font-mono whitespace-pre-wrap">
							{error.stack}
						</code>
					</div>
				)}

				<div className="flex items-center justify-center gap-3">
					{reset && (
						<Button
							variant="primary"
							className="w-auto! inline-flex px-4 py-1 text-base rounded-md justify-center whitespace-nowrap"
							onClick={reset}
						>
							{m.error_try_again()}
						</Button>
					)}
					<Button
						variant="secondary"
						className="w-auto! inline-flex px-4 py-1 text-base rounded-md justify-center whitespace-nowrap"
						onClick={() => navigate({ to: "/" })}
					>
						{m.error_go_home()}
					</Button>
				</div>
			</div>
		</div>
	);
}
