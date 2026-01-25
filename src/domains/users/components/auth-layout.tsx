import type { ReactNode } from "react";
import AppLogo from "~/components/ui/app-logo";
import { Link } from "@tanstack/react-router";

export function AuthLayout({
	title,
	description,
	children,
	footerText,
	footerLinkText,
	footerLinkTo,
}: {
	title: string;
	description: string;
	children: ReactNode;
	footerText?: string;
	footerLinkText?: string;
	footerLinkTo?: string;
}) {
	return (
		<div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="text-left mb-8 mt-8 md:mt-0">
					<div className="flex justify-start mb-4">
						<AppLogo size={30} />
					</div>
					<h1 className="text-2xl font-semibold text-white mb-2">{title}</h1>
					<p className="text-neutral-400">{description}</p>
				</div>

				{children}

				{footerText && footerLinkText && footerLinkTo && (
					<div className="mt-6 mb-8 md:mb-4 text-left">
						<p className="text-neutral-400 text-base">
							{footerText}{" "}
							<Link
								to={footerLinkTo}
								className="hover:text-neutral-200 transition-colors underline underline-offset-2"
							>
								{footerLinkText}
							</Link>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
